from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from datetime import datetime

from .db import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=True)
    member_since = Column(DateTime, default=datetime.utcnow)
    role = Column(String, default="member")
    avatar = Column(String, nullable=True)

    borrowings = relationship("Borrowing", back_populates="user")

class Book(Base):
    __tablename__ = "books"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    category = Column(String, nullable=False)
    image = Column(String, nullable=True)
    description = Column(String, nullable=True)
    isbn = Column(String, nullable=True)
    published_year = Column(Integer, nullable=True)
    available = Column(Boolean, default=True)

    borrowings = relationship("Borrowing", back_populates="book")

class Borrowing(Base):
    __tablename__ = "borrowing"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    book_id = Column(Integer, ForeignKey("books.id"), nullable=False)
    book_title = Column(String, nullable=False)
    book_author = Column(String, nullable=False)
    borrow_date = Column(DateTime, default=datetime.utcnow)
    return_date = Column(DateTime, nullable=True)  # planned or actual
    status = Column(String, default="borrowed")  # borrowed/returned

    user = relationship("User", back_populates="borrowings")
    book = relationship("Book", back_populates="borrowings")
