"""
REST API endpoints for messaging operations.

Part of microservice architecture with:
- Auth Service integration (JWT validation)
- API Gateway compatibility
- WebSocket real-time messaging

Endpoints:
- User sync (internal, from Auth Service)
- Send/receive messages
- Conversation management
- WebSocket connections
"""

from fastapi import APIRouter, Depends, HTTPException, WebSocket, WebSocketDisconnect, Query, Header
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List, Optional
import logging

from app.config import settings
from app.database import get_db
from app.middleware.auth import get_current_user, AuthenticatedUser
from app.schemas import (
    MessageCreate,
    MessageResponse,
    ConversationResponse,
    UserCreate,
    UserResponse
)
from app.services.message_service import (
    create_message,
    get_user_conversations,
    get_conversation_messages,
    update_message_status,
    create_user,
    get_user_by_id,
    get_or_create_user
)
from app.models import MessageStatus
from app.websockets.manager import manager

logger = logging.getLogger(__name__)

router = APIRouter(tags=["messaging"])


# ==================== User Sync (Internal) ====================

@router.post("/users/sync", response_model=UserResponse, status_code=201)
async def sync_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db),
    x_internal_key: Optional[str] = Header(None, alias="X-Internal-Key")
):
    """
    Sync user from MCSV (internal endpoint).
    
    Called by MCSV when a new user registers or updates profile.
    Creates or updates user in messaging service.
    In production, validate X-Internal-Key header.
    
    Args:
        user_data: User information from MCSV
        db: Database session
        
    Returns:
        Synced user details
    """
    # In production, validate internal service key
    # if not settings.DEV_MODE and x_internal_key != settings.INTERNAL_SERVICE_KEY:
    #     raise HTTPException(status_code=403, detail="Invalid internal key")
    
    try:
        # Email is required for database constraint
        if not user_data.email:
            raise ValueError("Email is required to sync user")
            
        user = await get_or_create_user(
            db,
            user_data.username,
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name,
            bio=user_data.bio,
            avatar_url=user_data.avatar_url
        )
        logger.info(f"User synced: {user.username} (id={user.id})")
        return UserResponse.model_validate(user)
    except Exception as e:
        logger.error(f"Error syncing user: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/users/", response_model=UserResponse, status_code=201)
async def register_user(
    user_data: UserCreate,
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new user (DEV MODE ONLY).
    
    In production, users are created via Auth Service.
    This endpoint is for testing without Auth Service.
    
    Args:
        user_data: User information (username)
        db: Database session
        
    Returns:
        Created user details
    """
    if not settings.DEV_MODE:
        raise HTTPException(
            status_code=403,
            detail="User registration disabled. Use Auth Service."
        )
    
    try:
        user = await get_or_create_user(db, user_data.username)
        return UserResponse.model_validate(user)
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/users/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: int,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve user information by ID.
    
    Args:
        user_id: User's unique identifier
        db: Database session
        
    Returns:
        User details
    """
    user = await get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)


@router.get("/users/username/{username}", response_model=UserResponse)
async def get_user_by_username(
    username: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Retrieve user information by username.
    
    Args:
        username: User's username
        db: Database session
        
    Returns:
        User details
    """
    from sqlalchemy import select
    from app.models import User
    
    result = await db.execute(select(User).where(User.username == username))
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return UserResponse.model_validate(user)


# ==================== Messaging ====================

@router.post("/messages/", response_model=MessageResponse, status_code=201)
async def send_message(
    message_data: MessageCreate,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Send a new message to another user.
    
    Creates a conversation if one doesn't exist between the users.
    If the receiver is online, pushes the message via WebSocket.
    
    Args:
        message_data: Message content and receiver ID
        current_user: Authenticated user (from Auth Service)
        db: Database session
        
    Returns:
        Created message details
    """
    try:
        sender_id = current_user.user_id
        
        # Ensure sender exists in local DB (sync from auth)
        sender = await get_or_create_user(db, current_user.username)
        
        # Validate receiver exists
        receiver = await get_user_by_id(db, message_data.receiver_id)
        if not receiver:
            raise HTTPException(status_code=404, detail="Receiver not found")
        
        # Create message in database
        message = await create_message(db, sender.id, message_data)
        message_response = MessageResponse.model_validate(message)
        
        # If receiver is online, push message via WebSocket and update status
        if manager.is_user_online(message_data.receiver_id):
            await manager.send_personal_message(
                {
                    "type": "new_message",
                    "message": message_response.model_dump(mode='json')
                },
                message_data.receiver_id
            )
            
            # Update message status to delivered
            await update_message_status(db, message.id, MessageStatus.DELIVERED)
            message_response.status = MessageStatus.DELIVERED
        
        logger.info(f"Message sent from user {sender.id} to {message_data.receiver_id}")
        return message_response
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        raise HTTPException(status_code=500, detail="Failed to send message")


@router.get("/conversations/", response_model=List[ConversationResponse])
async def list_conversations(
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    List all conversations for the authenticated user.
    
    Includes a preview of the last message in each conversation.
    
    Args:
        current_user: Authenticated user
        db: Database session
        
    Returns:
        List of conversations with metadata
    """
    try:
        # Ensure user exists in local DB
        user = await get_or_create_user(db, current_user.username)
        
        conversations = await get_user_conversations(db, user.id)
        logger.info(f"Retrieved {len(conversations)} conversations for user {user.id}")
        return conversations
    
    except Exception as e:
        logger.error(f"Error retrieving conversations: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve conversations")


@router.get("/messages/{conversation_id}", response_model=List[MessageResponse])
async def get_messages(
    conversation_id: int,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Fetch all messages from a specific conversation.
    
    Validates that the authenticated user is a participant.
    
    Args:
        conversation_id: ID of the conversation
        current_user: Authenticated user
        db: Database session
        
    Returns:
        List of messages in chronological order
    """
    try:
        # Ensure user exists in local DB
        user = await get_or_create_user(db, current_user.username)
        
        messages = await get_conversation_messages(db, conversation_id, user.id)
        logger.info(f"Retrieved {len(messages)} messages from conversation {conversation_id}")
        return [MessageResponse.model_validate(msg) for msg in messages]
    
    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception as e:
        logger.error(f"Error retrieving messages: {e}")
        raise HTTPException(status_code=500, detail="Failed to retrieve messages")


# ==================== WebSocket ====================
@router.websocket("/ws/{user_id}")
async def websocket_endpoint(
    websocket: WebSocket,
    user_id: int,
    token: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    try:
        if not token:
            logger.warning(f"WebSocket: No token for user {user_id}")
            await websocket.close(code=1008, reason="Token required")
            return

        logger.info(f"WebSocket: Validating token for user {user_id}")
        
        from app.middleware.auth import decode_token_locally, validate_token_with_auth_service

        payload = decode_token_locally(token)
        token_user_id = None

        if payload:
            logger.info(f"WebSocket: Token decoded locally, payload={payload}")
            token_user_id = payload.get("user_id") or payload.get("id") or payload.get("sub")
        else:
            logger.info(f"WebSocket: Local decode failed, trying Auth Service at {settings.AUTH_SERVICE_URL}")
            user_data = await validate_token_with_auth_service(token)
            if user_data:
                logger.info(f"WebSocket: Auth Service validated token: {user_data}")
                token_user_id = user_data.get("user_id")
            else:
                logger.warning(f"WebSocket: Auth Service returned None")

        if not token_user_id:
            logger.warning(f"WebSocket: No user_id extracted from token")
            await websocket.close(code=1008, reason="Invalid token")
            return
            
        if token_user_id != user_id:
            logger.warning(f"WebSocket: Token user_id {token_user_id} != requested {user_id}")
            await websocket.close(code=1008, reason="User mismatch")
            return

        logger.info(f"✓ WebSocket: Token validated for user {user_id}")

        # ✅ REQUIRED: Accept the WebSocket connection
        await websocket.accept()
        logger.info(f"✓ WebSocket: Connection accepted for user {user_id}")

    except Exception as e:
        logger.error(f"WebSocket auth error: {e}", exc_info=True)
        try:
            await websocket.close(code=1008, reason="Auth failed")
        except:
            pass
        return

    await manager.connect(user_id, websocket)

    try:
        await websocket.send_json({
            "type": "connection_established",
            "user_id": user_id,
            "message": "Connected to messaging service"
        })

        await manager.send_online_users(websocket)

        # Keep connection alive - wait for messages or heartbeat
        # Client can send keep-alive pings or other messages
        while True:
            try:
                data = await websocket.receive_text()
                logger.debug(f"WebSocket received from user {user_id}: {data}")
                # Handle incoming messages (e.g., typing indicators, read receipts, etc.)
                # For now, just log and discard
            except WebSocketDisconnect:
                raise  # Re-raise to be caught by outer handler
            except Exception as e:
                logger.warning(f"WebSocket receive error for user {user_id}: {e}")
                # Continue listening for messages

    except WebSocketDisconnect:
        logger.info(f"✓ WebSocket: User {user_id} disconnected normally")
        manager.disconnect(user_id, websocket)

    except Exception as e:
        logger.error(f"WebSocket error for user {user_id}: {e}", exc_info=True)
        manager.disconnect(user_id, websocket)