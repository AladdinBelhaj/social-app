# Social Media Clone – React + Node + MySQL (XAMPP)

This project is now wired to a Node/Express API backed by MySQL (XAMPP) instead of Supabase.

## Setup

1) Install dependencies
```
npm install
```

2) Configure environment
- Copy `.env.example` to `.env` and adjust values.
- For XAMPP MySQL, default host/port/user often work (`root`/no password).
- Ensure `VITE_API_URL` matches the API base (default `http://localhost:4000/api`).

3) Create the database
- Start MySQL via XAMPP, then run the SQL in `server/schema.sql` (phpMyAdmin or `mysql` CLI):
```
mysql -u root -p < server/schema.sql
```

4) Run the API
```
npm run server
```

5) Run the frontend
```
npm run dev
```

## API routes (all prefixed with `/api`)
- `POST /auth/register` – email, password, username, fullName → returns JWT + profile.
- `POST /auth/login` – email, password → returns JWT + profile.
- `GET /users/me` – current user profile (auth).
- `PUT /users/me` – update `full_name`, `bio`, `avatar_url` (auth).
- `GET /friends` – accepted friends (auth).
- `GET /friends/pending` – incoming requests (auth).
- `GET /friends/sent` – sent pending requests (auth).
- `POST /friends/search` – `{ username }` search (auth).
- `POST /friends/requests` – `{ friendId }` send request (auth).
- `POST /friends/requests/:id/accept` – accept incoming (auth).
- `DELETE /friends/requests/:id` – reject incoming (auth).
- `DELETE /friends/:friendId` – remove friend both directions (auth).

## Environment keys
- `PORT` – API port (default 4000)
- `CLIENT_ORIGIN` – allowed frontend origin for CORS
- `DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME` – MySQL connection
- `JWT_SECRET` – secret for signing tokens
- `VITE_API_URL` – frontend API base (e.g., `http://localhost:4000/api`)
