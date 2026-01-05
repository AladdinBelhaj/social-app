"""
Business logic for message operations.

Contains service functions for creating conversations, sending messages,
and retrieving conversation data.
"""

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, and_, desc
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime

from app.models import User, Conversation, Message, MessageStatus
from app.schemas import MessageCreate, MessageResponse, ConversationResponse


async def get_or_create_conversation(
    db: AsyncSession,
    user1_id: int,
    user2_id: int
) -> Conversation:
    """
    Get existing conversation between two users or create a new one.
    
    Args:
        db: Database session
        user1_id: First user's ID
        user2_id: Second user's ID
        
    Returns:
        Conversation object (existing or newly created)
    """
    # Ensure consistent ordering (smaller ID first)
    participant_1 = min(user1_id, user2_id)
    participant_2 = max(user1_id, user2_id)
    
    # Check if conversation already exists
    result = await db.execute(
        select(Conversation).where(
            and_(
                Conversation.participant_1_id == participant_1,
                Conversation.participant_2_id == participant_2
            )
        )
    )
    conversation = result.scalar_one_or_none()
    
    # Create new conversation if none exists
    if not conversation:
        conversation = Conversation(
            participant_1_id=participant_1,
            participant_2_id=participant_2,
            created_at=datetime.utcnow()
        )
        db.add(conversation)
        await db.commit()
        await db.refresh(conversation)
    
    return conversation


async def create_message(
    db: AsyncSession,
    sender_id: int,
    message_data: MessageCreate
) -> Message:
    """
    Create and save a new message.
    
    Args:
        db: Database session
        sender_id: ID of the user sending the message
        message_data: Message content and receiver information
        
    Returns:
        Created Message object
    """
    # Get or create conversation
    conversation = await get_or_create_conversation(
        db,
        sender_id,
        message_data.receiver_id
    )
    
    # Create new message
    message = Message(
        conversation_id=conversation.id,
        sender_id=sender_id,
        content=message_data.content,
        timestamp=datetime.utcnow(),
        status=MessageStatus.SENT
    )
    
    db.add(message)
    await db.commit()
    await db.refresh(message)
    
    return message


async def get_user_conversations(
    db: AsyncSession,
    user_id: int
) -> List[ConversationResponse]:
    """
    Retrieve all conversations for a specific user with last message preview.
    
    Args:
        db: Database session
        user_id: ID of the user
        
    Returns:
        List of conversations with metadata
    """
    # Query conversations where user is a participant, with participants loaded
    result = await db.execute(
        select(Conversation)
        .options(selectinload(Conversation.participant_1), selectinload(Conversation.participant_2))
        .where(
            or_(
                Conversation.participant_1_id == user_id,
                Conversation.participant_2_id == user_id
            )
        ).order_by(desc(Conversation.created_at))
    )
    conversations = result.scalars().all()
    
    # Enrich with last message for each conversation
    conversation_responses = []
    for conv in conversations:
        # Get last message
        last_msg_result = await db.execute(
            select(Message)
            .where(Message.conversation_id == conv.id)
            .order_by(desc(Message.timestamp))
            .limit(1)
        )
        last_message = last_msg_result.scalar_one_or_none()
        
        conv_response = ConversationResponse(
            id=conv.id,
            participant_1_id=conv.participant_1_id,
            participant_1=conv.participant_1,
            participant_2_id=conv.participant_2_id,
            participant_2=conv.participant_2,
            created_at=conv.created_at,
            last_message=MessageResponse.model_validate(last_message) if last_message else None
        )
        conversation_responses.append(conv_response)
    
    return conversation_responses


async def get_conversation_messages(
    db: AsyncSession,
    conversation_id: int,
    user_id: int
) -> List[Message]:
    """
    Retrieve all messages from a specific conversation.
    
    Validates that the requesting user is a participant.
    
    Args:
        db: Database session
        conversation_id: ID of the conversation
        user_id: ID of the requesting user (for authorization)
        
    Returns:
        List of messages ordered by timestamp
        
    Raises:
        ValueError: If user is not a participant in the conversation
    """
    # Verify user is a participant
    result = await db.execute(
        select(Conversation).where(Conversation.id == conversation_id)
    )
    conversation = result.scalar_one_or_none()
    
    if not conversation:
        raise ValueError("Conversation not found")
    
    if user_id not in [conversation.participant_1_id, conversation.participant_2_id]:
        raise ValueError("User is not a participant in this conversation")
    
    # Fetch messages
    result = await db.execute(
        select(Message)
        .where(Message.conversation_id == conversation_id)
        .order_by(Message.timestamp)
    )
    messages = result.scalars().all()
    
    return messages


async def update_message_status(
    db: AsyncSession,
    message_id: int,
    status: MessageStatus
) -> Optional[Message]:
    """
    Update the status of a message (e.g., from sent to delivered).
    
    Args:
        db: Database session
        message_id: ID of the message to update
        status: New status value
        
    Returns:
        Updated Message object or None if not found
    """
    result = await db.execute(
        select(Message).where(Message.id == message_id)
    )
    message = result.scalar_one_or_none()
    
    if message:
        message.status = status
        await db.commit()
        await db.refresh(message)
    
    return message


async def get_user_by_id(db: AsyncSession, user_id: int) -> Optional[User]:
    """
    Retrieve a user by ID.
    
    Args:
        db: Database session
        user_id: User's unique identifier
        
    Returns:
        User object or None if not found
    """
    result = await db.execute(
        select(User).where(User.id == user_id)
    )
    return result.scalar_one_or_none()


async def get_user_by_username(db: AsyncSession, username: str) -> Optional[User]:
    """
    Retrieve a user by username.
    
    Args:
        db: Database session
        username: User's username
        
    Returns:
        User object or None if not found
    """
    result = await db.execute(
        select(User).where(User.username == username)
    )
    return result.scalar_one_or_none()


async def create_user(
    db: AsyncSession,
    username: str,
    email: str = None,
    password: str = None,
    full_name: str = None,
    bio: str = None,
    avatar_url: str = None
) -> User:
    """
    Create a new user with optional profile fields.
    
    Args:
        db: Database session
        username: Desired username
        email: User's email address
        password: User's password hash
        full_name: User's full name
        bio: User's biography
        avatar_url: URL to user's avatar
        
    Returns:
        Created User object
    """
    user = User(
        username=username,
        email=email,
        password=password,
        full_name=full_name,
        bio=bio,
        avatar_url=avatar_url
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user


async def get_or_create_user(
    db: AsyncSession,
    username: str,
    email: str = None,
    password: str = None,
    full_name: str = None,
    bio: str = None,
    avatar_url: str = None
) -> User:
    """
    Get existing user or create new one.
    
    Used for syncing users from Auth Service (MCSV).
    If user exists, updates their profile fields.
    
    Args:
        db: Database session
        username: Username to find or create
        email: User's email address
        password: User's password hash
        full_name: User's full name
        bio: User's biography
        avatar_url: URL to user's avatar
        
    Returns:
        User object (existing or newly created)
    """
    user = await get_user_by_username(db, username)
    if user:
        # Update existing user with new data
        if email:
            user.email = email
        if password:
            user.password = password
        if full_name:
            user.full_name = full_name
        if bio is not None:  # Allow empty string
            user.bio = bio
        if avatar_url:
            user.avatar_url = avatar_url
        await db.commit()
        await db.refresh(user)
    else:
        # Create new user
        user = await create_user(
            db,
            username,
            email=email,
            password=password,
            full_name=full_name,
            bio=bio,
            avatar_url=avatar_url
        )
    return user
