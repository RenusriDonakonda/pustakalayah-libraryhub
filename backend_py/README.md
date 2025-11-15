# Pustakalayah LibraryHub - FastAPI Backend (SQLite)

## Setup

```powershell
cd backend_py
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Note:** If you get an execution policy error when activating the virtual environment, run:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```
Then try activating again.

API base: `http://localhost:8000`

## Endpoints

- GET `/api/health`

### Users `/api/users`
- GET `/` list users
- POST `/` create user `{ username, email, name?, password }`
- POST `/login` login `{ username, password }`
- PUT `/{user_id}` update `{ name?, email? }`
- DELETE `/{user_id}`

### Books `/api/books`
- GET `/` list books (optional `?category=fiction|action|romance|comic|mystery|all`)
- GET `/{id}`
- POST `/` create
- PUT `/{id}` update
- DELETE `/{id}`

### Borrowing `/api/borrowing`
- GET `/` list all
- GET `/user/{user_id}` by user
- POST `/borrow` `{ user_id, book_id, book_title, book_author }`
- PUT `/return/{borrow_id}`
- GET `/overdue`

## Notes
- SQLite database file: `backend_py/library.db` (auto-created)
- CORS: enabled for all origins (so your current frontend can call it)
- Passwords stored as plain text
