# Messaging Microservice

Real-time messaging service for microservice architecture. Provides REST API and WebSocket for instant messaging.

## Quick Start

### Backend
```powershell
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```
- Server: http://localhost:8000
- API Docs: http://localhost:8000/docs (dev mode)

### Test Frontend
```powershell
cd frontend
npm install
npm start
```
- Test Client: http://localhost:3000

### VS Code Task
Press `Ctrl+Shift+B` to start both backend and frontend.

## Architecture

**Microservice Design:**
- Independent service with own SQLite database
- External Auth Service integration (JWT)
- API Gateway compatible (`/api/messaging` prefix)
- WebSocket for real-time messaging

**Components:**
- **Auth Service** (external) - Validates JWT tokens
- **API Gateway** (external) - Routes to `/api/messaging`
- **This Service** - Handles messaging logic

## Configuration

Environment variables (or `.env` file):

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `8000` | Server port |
| `DATABASE_URL` | `sqlite+aiosqlite:///./messaging.db` | Database connection |
| `AUTH_SERVICE_URL` | `http://localhost:8001` | Auth service URL |
| `JWT_SECRET` | `dev-secret-key...` | JWT signing key |
| `DEV_MODE` | `true` | Enable dev auth fallback |
| `API_PREFIX` | `/api/messaging` | API route prefix |
| `CORS_ORIGINS` | `*` | Allowed origins |

## Authentication

### Production
- Bearer token in `Authorization` header
- Validated via Auth Service

### Dev Mode (`DEV_MODE=true`)
- Header auth: `X-User-ID` + `X-Username`
- Local JWT decode as fallback
- User creation endpoint enabled

## API Endpoints

All endpoints prefixed with `/api/messaging`

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| `GET` | `/` | - | Service info |
| `GET` | `/health` | - | Health check |
| `POST` | `/users/` | -* | Create user (dev only) |
| `POST` | `/users/sync` | Internal | Sync from Auth Service |
| `GET` | `/users/{id}` | ✓ | Get user |
| `GET` | `/users/username/{name}` | ✓ | Get user by username |
| `POST` | `/messages/` | ✓ | Send message |
| `GET` | `/messages/{conv_id}` | ✓ | Get messages |
| `GET` | `/conversations/` | ✓ | List conversations |
| `WS` | `/ws/{user_id}` | - | WebSocket |

## WebSocket Events

**Server → Client:**
```json
{"type": "connection_established", "user_id": 1}
{"type": "online_users", "users": [1, 2]}
{"type": "user_status", "user_id": 2, "status": "online"}
{"type": "new_message", "message": {...}}
```

## Database

**Users** - `id`, `username`  
**Conversations** - `id`, `participant_1_id`, `participant_2_id`, `created_at`  
**Messages** - `id`, `conversation_id`, `sender_id`, `content`, `timestamp`, `status`

## Project Structure

```
app/
  config.py             # Environment settings
  main.py               # FastAPI entry point
  database.py           # SQLAlchemy async setup
  models.py             # ORM models
  schemas.py            # Pydantic schemas
  middleware/auth.py    # JWT + dev auth
  routers/messages.py   # API routes
  services/             # Business logic
  websockets/manager.py # Connection manager

frontend/               # Test client (React)
```

## Dev Testing

1. Start backend: `python -m uvicorn app.main:app --reload`
2. Start frontend: `cd frontend && npm start`
3. Open http://localhost:3000
4. Create user → Open incognito → Create another user
5. Start chat by username → Send messages

Messages appear in real-time via WebSocket.
