from pydantic import BaseModel
from typing import Optional
from datetime import datetime

# Users
class UserBase(BaseModel):
    username: str
    email: str
    name: Optional[str] = None
    avatar: Optional[str] = None

class UserCreate(BaseModel):
    username: str
    email: str
    password: str
    name: Optional[str] = None
    mobile: Optional[str] = None
    avatar: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    avatar: Optional[str] = None
    mobile: Optional[str] = None

class UserOut(UserBase):
    id: int
    member_since: datetime
    role: str
    avatar: Optional[str] = None
    mobile: Optional[str] = None
    email_verified: bool = False

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    username: str
    password: str

class TokenResponse(BaseModel):
    success: bool
    token: str
    user: UserOut
    message: Optional[str] = None
    verificationUrl: Optional[str] = None

class ForgotPasswordRequest(BaseModel):
    username: str  # Can be username or email

class VerifyOTPRequest(BaseModel):
    username: str  # Can be username or email
    otp: str

class ResetPasswordRequest(BaseModel):
    username: str  # Can be username or email
    otp: str
    new_password: str

class VerifyEmailRequest(BaseModel):
    token: str

class ResendVerificationRequest(BaseModel):
    username: str  # Can be username or email

# Books
class BookBase(BaseModel):
    title: str
    author: str
    category: str
    image: Optional[str] = None
    description: Optional[str] = None
    isbn: Optional[str] = None
    published_year: Optional[int] = None
    available: Optional[bool] = True

class BookCreate(BookBase):
    pass

class BookUpdate(BookBase):
    pass

class BookOut(BookBase):
    id: int

    class Config:
        from_attributes = True

# Borrowing
class BorrowCreate(BaseModel):
    user_id: int
    book_id: int
    book_title: str
    book_author: str

class BorrowOut(BaseModel):
    id: int
    user_id: int
    book_id: int
    book_title: str
    book_author: str
    borrow_date: datetime
    return_date: Optional[datetime] = None
    status: str

    class Config:
        from_attributes = True
