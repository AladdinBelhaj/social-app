"""
Pydantic schemas for request/response validation.

Defines data transfer objects (DTOs) for API endpoints,
ensuring type safety and automatic validation.
"""

from pydantic import BaseModel, ConfigDict
from datetime import datetime
from typing import Optional
from app.models import MessageStatus


# User Schemas
class UserBase(BaseModel):
    """Base user schema with common attributes."""
    username: str


class UserCreate(UserBase):
    """Schema for creating/syncing a user from MCSV."""
    email: Optional[str] = None  # Optional for backward compatibility
    id: Optional[int] = None
    password: Optional[str] = None
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None


class UserResponse(UserBase):
    """Schema for user responses."""
    id: int
    email: Optional[str] = None
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: Optional[datetime] = None
    
    model_config = ConfigDict(from_attributes=True)


# Message Schemas
class MessageCreate(BaseModel):
    """
    Schema for creating a new message.
    
    Attributes:
        receiver_id: ID of the user receiving the message
        content: Message text content
    """
    receiver_id: int
    content: str


class MessageResponse(BaseModel):
    """
    Schema for message responses.
    
    Attributes:
        id: Message unique identifier
        conversation_id: Associated conversation ID
        sender_id: ID of the sender
        content: Message text
        timestamp: When the message was sent
        status: Current delivery status
    """
    id: int
    conversation_id: int
    sender_id: int
    content: str
    timestamp: datetime
    status: MessageStatus
    
    model_config = ConfigDict(from_attributes=True)


# Conversation Schemas
class ConversationResponse(BaseModel):
    """
    Schema for conversation responses.
    
    Attributes:
        id: Conversation unique identifier
        participant_1_id: First participant ID
        participant_1: First participant user object
        participant_2_id: Second participant ID
        participant_2: Second participant user object
        created_at: When conversation was created
        last_message: Optional last message preview
    """
    id: int
    participant_1_id: int
    participant_1: UserResponse
    participant_2_id: int
    participant_2: UserResponse
    created_at: datetime
    last_message: Optional[MessageResponse] = None
    
    model_config = ConfigDict(from_attributes=True)


# WebSocket Message Schema
class WebSocketMessage(BaseModel):
    """
    Schema for WebSocket real-time messages.
    
    Used to push messages to connected clients.
    """
    type: str  # "new_message", "status_update", etc.
    message: MessageResponse
    
    model_config = ConfigDict(from_attributes=True)
