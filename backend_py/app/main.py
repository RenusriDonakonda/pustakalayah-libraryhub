from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import users, books, borrowing
from .db import init_db

app = FastAPI(title="Pustakalayah LibraryHub API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def on_startup():
    init_db()

@app.get("/api/health")
def health():
    return {"status": "OK"}

app.include_router(users.router, prefix="/api/users", tags=["users"])
app.include_router(books.router, prefix="/api/books", tags=["books"])
app.include_router(borrowing.router, prefix="/api/borrowing", tags=["borrowing"])
