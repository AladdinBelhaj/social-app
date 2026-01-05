from fastapi import WebSocket
from typing import Dict, List
import json
import logging
import asyncio

logger = logging.getLogger(__name__)


class ConnectionManager:
    
    def __init__(self):
        self.active_connections: Dict[int, List[WebSocket]] = {}
    
    async def connect(self, user_id: int, websocket: WebSocket):
        # Note: WebSocket should already be accepted by the caller
        # Do NOT call websocket.accept() here - it's already accepted in the endpoint
        
        was_offline = user_id not in self.active_connections or len(self.active_connections[user_id]) == 0
        
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        
        self.active_connections[user_id].append(websocket)
        logger.info(f"User {user_id} connected. Total connections: {len(self.active_connections[user_id])}")
        
        if was_offline:
            await self.broadcast_user_status(user_id, 'online')
    
    def disconnect(self, user_id: int, websocket: WebSocket):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
                asyncio.create_task(self.broadcast_user_status(user_id, 'offline'))
            
            logger.info(f"User {user_id} disconnected")
    
    async def broadcast_user_status(self, user_id: int, status: str):
        message = {
            'type': 'user_status',
            'user_id': user_id,
            'status': status
        }
        message_json = json.dumps(message)
        
        for connected_user_id, connections in list(self.active_connections.items()):
            for connection in connections[:]:
                try:
                    await connection.send_text(message_json)
                    logger.info(f"Sent {status} status for user {user_id} to user {connected_user_id}")
                except Exception as e:
                    logger.error(f"Failed to send status update: {e}")
    
    async def send_online_users(self, websocket: WebSocket):
        online_user_ids = list(self.active_connections.keys())
        message = {
            'type': 'online_users',
            'users': online_user_ids
        }
        try:
            await websocket.send_text(json.dumps(message))
            logger.info(f"Sent online users list: {online_user_ids}")
        except Exception as e:
            logger.error(f"Failed to send online users: {e}")
    
    async def send_personal_message(self, message: dict, user_id: int):
        if user_id in self.active_connections:
            message_json = json.dumps(message, default=str)
            
            disconnected = []
            for connection in self.active_connections[user_id]:
                try:
                    await connection.send_text(message_json)
                except Exception as e:
                    logger.error(f"Error sending message to user {user_id}: {e}")
                    disconnected.append(connection)
            
            for connection in disconnected:
                self.disconnect(user_id, connection)
    
    def is_user_online(self, user_id: int) -> bool:
        return user_id in self.active_connections and len(self.active_connections[user_id]) > 0


manager = ConnectionManager()
