"""
Messaging Microservice - Main Application Entry Point.

Part of a microservice architecture with:
- External Auth Service integration
- API Gateway compatibility
- WebSocket real-time messaging
- Eureka service registration
"""

from fastapi import FastAPI
from contextlib import asynccontextmanager
import logging
import asyncio
from py_eureka_client import eureka_client

from app.config import settings
from app.database import init_db
from app.routers.messages import router as messages_router

# Configure logging
logging.basicConfig(
    level=getattr(logging, settings.LOG_LEVEL),
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Eureka registration flag
eureka_registered = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Lifespan context manager for startup and shutdown events.
    """
    # Startup
    logger.info(f"Starting {settings.SERVICE_NAME} v{settings.SERVICE_VERSION}")
    
    logger.info("Initializing database...")
    await init_db()
    logger.info("Database initialized successfully")
    
    # Register with Eureka using init_async
    try:
        # Use init_async instead of init
        await eureka_client.init_async(
            eureka_server="http://localhost:8761/eureka",
            app_name="MESSAGING-SERVICE",
            instance_port=8000,
            instance_ip="127.0.0.1",
            home_page_url="http://localhost:8000/",
            health_check_url="http://localhost:8000/health",
            status_page_url="http://localhost:8000/",
        )
        global eureka_registered
        eureka_registered = True
        logger.info("✓ Registered with Eureka as MESSAGING-SERVICE")
    except Exception as e:
        logger.error(f"Failed to register with Eureka: {e}")
    
    yield
    
    # Shutdown
    logger.info("Shutting down application...")
    if eureka_registered:
        try:
            # Stop is also async in newer versions, or safe to call if sync
            await eureka_client.stop_async() 
            # Note: If stop_async() doesn't exist in your version, just use eureka_client.stop()
            # But usually init_async pairs with stop_async or stop() handles it.
            logger.info("Deregistered from Eureka")
        except Exception as e:
            logger.error(f"Error deregistering from Eureka: {e}")



# Create FastAPI application
app = FastAPI(
    title="Messaging Microservice",
    description="Real-time messaging service with WebSocket support. Part of microservice architecture.",
    version=settings.SERVICE_VERSION,
    lifespan=lifespan,
    docs_url="/docs" if settings.DEV_MODE else None,
    redoc_url="/redoc" if settings.DEV_MODE else None,
)

# Note: CORS is handled by API Gateway, not by this service
# Do NOT add CORS middleware here - it will conflict with gateway configuration

# Include routers with API prefix
app.include_router(messages_router, prefix=settings.API_PREFIX)


@app.get("/")
async def root():
    """
    Root endpoint providing service information.
    
    Returns:
        Service status and available endpoints
    """
    return {
        "service": settings.SERVICE_NAME,
        "version": settings.SERVICE_VERSION,
        "status": "running",
        "dev_mode": settings.DEV_MODE,
        "endpoints": {
            "messages": f"{settings.API_PREFIX}/messages/",
            "conversations": f"{settings.API_PREFIX}/conversations/",
            "users": f"{settings.API_PREFIX}/users/",
            "websocket": f"{settings.API_PREFIX}/ws/{{user_id}}"
        }
    }


@app.get("/health")
async def health_check():
    """
    Health check endpoint for monitoring.
    
    Returns:
        Service health status
    """
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )

