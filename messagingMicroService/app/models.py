"""
SQLAlchemy ORM models for the messaging service.

Defines three main entities:
- User: Represents a user in the system
- Conversation: Represents a chat between two users
- Message: Represents individual messages in conversations
"""

from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.database import Base


class MessageStatus(str, enum.Enum):
    """Enumeration for message delivery status."""
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"


class User(Base):
    """
    User model representing system users.
    Synced with MCSV social_app.users table.
    
    Attributes:
        id: Unique user identifier
        email: User's email address
        password: User's password hash
        username: User's display name
        full_name: User's full name
        bio: User's biography/description
        avatar_url: URL to user's avatar image
        created_at: Account creation timestamp
    """
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    username = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    sent_messages = relationship("Message", foreign_keys="Message.sender_id", back_populates="sender")


class Conversation(Base):
    """
    Conversation model representing a chat between two users.
    
    Attributes:
        id: Unique conversation identifier
        participant_1_id: First user's ID
        participant_2_id: Second user's ID
        created_at: Timestamp of conversation creation
    """
    __tablename__ = "conversations"
    
    id = Column(Integer, primary_key=True, index=True)
    participant_1_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    participant_2_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    participant_1 = relationship("User", foreign_keys=[participant_1_id])
    participant_2 = relationship("User", foreign_keys=[participant_2_id])
    messages = relationship("Message", back_populates="conversation", cascade="all, delete-orphan")


class Message(Base):
    """
    Message model representing individual messages in conversations.
    
    Attributes:
        id: Unique message identifier
        conversation_id: Associated conversation ID
        sender_id: ID of the user who sent the message
        content: Message text content
        timestamp: When the message was sent
        status: Delivery status (sent/delivered/read)
    """
    __tablename__ = "messages"
    
    id = Column(Integer, primary_key=True, index=True)
    conversation_id = Column(Integer, ForeignKey("conversations.id"), nullable=False)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    content = Column(String, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    status = Column(SQLEnum(MessageStatus, native_enum=False), default=MessageStatus.SENT, nullable=False)
    
    # Relationships
    conversation = relationship("Conversation", back_populates="messages")
    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
