"""
Authentication middleware for the Messaging Microservice.

Validates JWT tokens from the Auth Service.
Provides fallback authentication for development/testing.
"""

import logging
from typing import Optional
from fastapi import Depends, HTTPException, Header, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import httpx

from app.config import settings

logger = logging.getLogger(__name__)

security = HTTPBearer(auto_error=False)


class AuthenticatedUser:
    """Represents an authenticated user from the Auth Service."""
    
    def __init__(self, user_id: int, username: str, email: Optional[str] = None):
        self.user_id = user_id
        self.username = username
        self.email = email
    
    def __repr__(self):
        return f"AuthenticatedUser(id={self.user_id}, username={self.username})"


async def validate_token_with_auth_service(token: str) -> Optional[dict]:
    """
    Validate token by calling the Auth Service.
    
    Args:
        token: JWT token to validate
        
    Returns:
        User data if valid, None otherwise
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.AUTH_SERVICE_URL}/api/auth/validate",
                headers={"Authorization": f"Bearer {token}"},
                timeout=5.0
            )
            
            if response.status_code == 200:
                return response.json()
            
            logger.warning(f"Auth service returned status {response.status_code}")
            return None
            
    except httpx.RequestError as e:
        logger.error(f"Failed to connect to Auth Service: {e}")
        return None


def decode_token_locally(token: str) -> Optional[dict]:
    """
    Decode JWT token locally (fallback for dev mode).
    
    Args:
        token: JWT token to decode
        
    Returns:
        Decoded payload if valid, None otherwise
    """
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET,
            algorithms=[settings.JWT_ALGORITHM]
        )
        return payload
    except jwt.ExpiredSignatureError:
        logger.warning("Token has expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid token: {e}")
        return None


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    x_username: Optional[str] = Header(None, alias="X-Username"),
) -> AuthenticatedUser:
    """
    Get the current authenticated user.
    
    Supports multiple authentication methods:
    1. JWT Bearer token (validated with Auth Service or locally)
    2. X-User-ID/X-Username headers (from API Gateway, dev mode only)
    
    Args:
        credentials: Bearer token credentials
        x_user_id: User ID header (from gateway or dev testing)
        x_username: Username header (from gateway or dev testing)
        
    Returns:
        AuthenticatedUser: The authenticated user
        
    Raises:
        HTTPException: If authentication fails
    """
    # Method 1: Check for X-User-ID header (from API Gateway or dev testing)
    if settings.DEV_MODE and x_user_id and x_username:
        logger.debug(f"Dev mode auth: user_id={x_user_id}, username={x_username}")
        return AuthenticatedUser(
            user_id=int(x_user_id),
            username=x_username
        )
    
    # Method 2: JWT Bearer token
    if credentials:
        token = credentials.credentials
        
        # Try Auth Service first (if not in dev mode or service is available)
        if not settings.DEV_MODE:
            user_data = await validate_token_with_auth_service(token)
            if user_data:
                return AuthenticatedUser(
                    user_id=user_data["user_id"],
                    username=user_data["username"],
                    email=user_data.get("email")
                )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired token",
                headers={"WWW-Authenticate": "Bearer"}
            )
        
        # Dev mode: try local decode first, then Auth Service
        payload = decode_token_locally(token)
        if payload:
            user_id = payload.get("user_id") or payload.get("id") or payload.get("sub")
            username = payload.get("username")
            email = payload.get("email")
            
            # If username is missing, try to get it from Auth Service
            if not username:
                user_data = await validate_token_with_auth_service(token)
                if user_data:
                    username = user_data.get("username")
                    if not email:
                        email = user_data.get("email")
            
            # If still no username, raise error (cannot create user without it)
            if not username:
                logger.error(f"Could not extract username from token. Payload: {payload}")
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Username not found in token",
                    headers={"WWW-Authenticate": "Bearer"}
                )
            
            return AuthenticatedUser(
                user_id=user_id,
                username=username,
                email=email
            )
        
        # Try Auth Service as fallback in dev mode
        user_data = await validate_token_with_auth_service(token)
        if user_data:
            return AuthenticatedUser(
                user_id=user_data["user_id"],
                username=user_data["username"],
                email=user_data.get("email")
            )
    
    # No valid authentication
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Authentication required",
        headers={"WWW-Authenticate": "Bearer"}
    )


async def get_optional_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    x_user_id: Optional[str] = Header(None, alias="X-User-ID"),
    x_username: Optional[str] = Header(None, alias="X-Username"),
) -> Optional[AuthenticatedUser]:
    """
    Get the current user if authenticated, None otherwise.
    
    Useful for endpoints that work differently for authenticated vs anonymous users.
    """
    try:
        return await get_current_user(credentials, x_user_id, x_username)
    except HTTPException:
        return None
