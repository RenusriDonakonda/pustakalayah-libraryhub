from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
import shutil
from typing import Optional
import random
import string

from ..db import get_db, hash_password, verify_password
from .. import models, schemas

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")

# JWT configuration
SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key")  # Change in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# In-memory OTP storage (use Redis/database in production)
otp_storage = {}

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def generate_otp():
    """Generate a 6-digit OTP"""
    return ''.join(random.choices(string.digits, k=6))

def store_otp(username: str, otp: str):
    """Store OTP with expiration (15 minutes)"""
    otp_storage[username] = {
        'otp': otp,
        'expires_at': datetime.utcnow() + timedelta(minutes=15)
    }

def verify_otp(username: str, otp: str) -> bool:
    """Verify OTP and remove if valid"""
    if username not in otp_storage:
        return False

    stored = otp_storage[username]
    if datetime.utcnow() > stored['expires_at']:
        del otp_storage[username]
        return False

    if stored['otp'] == otp:
        del otp_storage[username]  # Remove after successful verification
        return True

    return False

@router.get("/", response_model=list[schemas.UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@router.post("/register", response_model=schemas.TokenResponse)
async def register_user(
    username: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    name: Optional[str] = Form(None),
    mobile: Optional[str] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
    # Create payload object for validation
    payload = schemas.UserCreate(
        username=username,
        email=email,
        password=password,
        name=name,
        mobile=mobile
    )
    # Check username
    existing = db.query(models.User).filter(models.User.username == payload.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already exists")

    # Check email
    existing = db.query(models.User).filter(models.User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")

    # Create user first without avatar
    user = models.User(
        username=payload.username,
        email=payload.email,
        name=payload.name or payload.username,
        mobile=payload.mobile,
        password_hash=hash_password(payload.password),
        email_verified=True  # Auto-verify new users
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    # Handle avatar if provided (either as file upload or data URL)
    if avatar:
        upload_dir = os.path.join("uploads", "avatars")
        os.makedirs(upload_dir, exist_ok=True)

        file_ext = os.path.splitext(avatar.filename)[1]
        filename = f"avatar_{user.id}_{int(datetime.now().timestamp())}{file_ext}"
        file_path = os.path.join(upload_dir, filename)

        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(avatar.file, buffer)

        user.avatar = f"/uploads/avatars/{filename}"
        db.commit()
        db.refresh(user)
    elif payload.avatar:
        # Handle data URL avatar from frontend
        user.avatar = payload.avatar
        db.commit()
        db.refresh(user)

    # Generate verification token
    verification_token = create_access_token({
        "sub": user.username,
        "type": "email_verification",
        "user_id": user.id
    })

    # In development mode, return verification URL
    verification_url = f"http://localhost:3000/pages/verify-email.html?token={verification_token}"

    # Return token for immediate login (user can still use app, but needs to verify email)
    token = create_access_token({"sub": user.username})

    return {
        "success": True,
        "message": "Registration successful! You can now login.",
        "token": token,
        "user": user
    }

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=401,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(models.User).filter(models.User.username == username).first()
    if user is None:
        raise credentials_exception
    return user

@router.post("/login", response_model=schemas.TokenResponse)
def login(
    username: str = Form(...),
    password: str = Form(...),
    db: Session = Depends(get_db)
):
    payload = schemas.LoginRequest(username=username, password=password)
    user = db.query(models.User).filter(models.User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    # Email verification disabled - all users can login
    # if not user.email_verified and user.role != "admin":
    #     raise HTTPException(status_code=403, detail="Email not verified")

    # Generate token
    token = create_access_token({"sub": user.username})
    return {
        "success": True,
        "token": token,
        "user": user
    }

@router.get("/me", response_model=schemas.UserOut)
def get_current_user_profile(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.put("/me", response_model=schemas.UserOut)
async def update_current_user(
    name: Optional[str] = Form(None),
    email: Optional[str] = Form(None),
    avatar: Optional[UploadFile] = File(None),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    # Check email uniqueness if being updated
    if email and email != current_user.email:
        existing = db.query(models.User).filter(models.User.email == email).first()
        if existing:
            raise HTTPException(status_code=400, detail="Email already exists")
    
    # Update basic fields
    if name is not None:
        current_user.name = name
    if email is not None:
        current_user.email = email
    
    # Handle avatar update if provided
    if avatar:
        upload_dir = os.path.join("uploads", "avatars")
        os.makedirs(upload_dir, exist_ok=True)
        
        # Delete old avatar file if exists and is not a base64 data URL
        if current_user.avatar and not current_user.avatar.startswith('data:'):
            old_path = os.path.join(os.getcwd(), current_user.avatar.lstrip('/'))
            try:
                if os.path.exists(old_path):
                    os.remove(old_path)
            except Exception:
                pass
        
        # Save new avatar
        file_ext = os.path.splitext(avatar.filename)[1]
        filename = f"avatar_{current_user.id}_{int(datetime.now().timestamp())}{file_ext}"
        file_path = os.path.join(upload_dir, filename)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(avatar.file, buffer)
        
        current_user.avatar = f"/uploads/avatars/{filename}"
    
    db.commit()
    db.refresh(current_user)
    return current_user

@router.post("/me/avatar", response_model=schemas.UserOut)
async def upload_current_user_avatar(
    avatar: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    upload_dir = os.path.join("uploads", "avatars")
    os.makedirs(upload_dir, exist_ok=True)
    
    # Delete old avatar file if exists and is not a base64 data URL
    if current_user.avatar and not current_user.avatar.startswith('data:'):
        old_path = os.path.join(os.getcwd(), current_user.avatar.lstrip('/'))
        try:
            if os.path.exists(old_path):
                os.remove(old_path)
        except Exception:
            pass
    
    # Save new avatar
    file_ext = os.path.splitext(avatar.filename)[1]
    filename = f"avatar_{current_user.id}_{int(datetime.now().timestamp())}{file_ext}"
    file_path = os.path.join(upload_dir, filename)
    
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(avatar.file, buffer)
    
    current_user.avatar = f"/uploads/avatars/{filename}"
    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.post("/forgot-password")
def forgot_password(payload: schemas.ForgotPasswordRequest, db: Session = Depends(get_db)):
    """Send OTP to user's mobile/email for password reset"""
    # Find user by username or email
    user = db.query(models.User).filter(
        (models.User.username == payload.username) | (models.User.email == payload.username)
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # Generate and store OTP
    otp = generate_otp()
    store_otp(user.username, otp)

    # In development mode, return OTP in response
    # In production, send SMS/email here
    return {
        "success": True,
        "message": "OTP sent to your registered mobile number",
        "otp": otp  # Remove in production
    }

@router.post("/verify-otp")
def verify_otp_endpoint(payload: schemas.VerifyOTPRequest, db: Session = Depends(get_db)):
    """Verify OTP entered by user"""
    user = db.query(models.User).filter(
        (models.User.username == payload.username) | (models.User.email == payload.username)
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_otp(user.username, payload.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    return {"success": True, "message": "OTP verified successfully"}

@router.post("/reset-password")
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using verified OTP"""
    user = db.query(models.User).filter(
        (models.User.username == payload.username) | (models.User.email == payload.username)
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if not verify_otp(user.username, payload.otp):
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # Update password
    user.password_hash = hash_password(payload.new_password)
    db.commit()

    return {"success": True, "message": "Password reset successfully"}

@router.post("/verify-email")
def verify_email(
    token: str = Form(...),
    db: Session = Depends(get_db)
):
    payload = schemas.VerifyEmailRequest(token=token)
    """Verify user's email using token"""
    try:
        token_payload = jwt.decode(payload.token, SECRET_KEY, algorithms=[ALGORITHM])
        token_type = token_payload.get("type")
        user_id = token_payload.get("user_id")

        if token_type != "email_verification":
            raise HTTPException(status_code=400, detail="Invalid token type")

        user = db.query(models.User).filter(models.User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        if user.email_verified:
            return {"success": True, "message": "Email already verified"}

        user.email_verified = True
        db.commit()

        return {"success": True, "message": "Email verified successfully"}

    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid or expired token")

@router.post("/resend-verification")
def resend_verification(
    username: str = Form(...),
    db: Session = Depends(get_db)
):
    payload = schemas.ResendVerificationRequest(username=username)
    """Resend email verification token"""
    user = db.query(models.User).filter(
        (models.User.username == payload.username) | (models.User.email == payload.username)
    ).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if user.email_verified:
        return {"success": True, "message": "Email already verified"}

    # Generate new verification token
    verification_token = create_access_token({
        "sub": user.username,
        "type": "email_verification",
        "user_id": user.id
    })

    # In development mode, return verification URL
    verification_url = f"http://localhost:3000/pages/verify-email.html?token={verification_token}"

    return {
        "success": True,
        "message": "Verification email sent",
        "verificationUrl": verification_url  # Remove in production
    }

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"success": True}

# Wishlist endpoints
@router.get("/wishlist")
def get_wishlist(
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's wishlist"""
    wishlist_items = db.query(models.Wishlist).filter(
        models.Wishlist.user_id == current_user.id
    ).all()
    
    return {
        "success": True,
        "wishlist": [
            {
                "id": item.id,
                "book_id": item.book_id,
                "book_title": item.book_title,
                "book_author": item.book_author,
                "added_date": item.added_date.isoformat()
            }
            for item in wishlist_items
        ]
    }

@router.post("/wishlist")
def add_to_wishlist(
    book_id: int = Form(...),
    book_title: str = Form(...),
    book_author: str = Form(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add book to wishlist"""
    # Check if book exists
    book = db.query(models.Book).filter(models.Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Check if already in wishlist
    existing_item = db.query(models.Wishlist).filter(
        models.Wishlist.user_id == current_user.id,
        models.Wishlist.book_id == book_id
    ).first()
    
    if existing_item:
        raise HTTPException(status_code=400, detail="Book already in wishlist")
    
    # Add to wishlist
    wishlist_item = models.Wishlist(
        user_id=current_user.id,
        book_id=book_id,
        book_title=book_title,
        book_author=book_author
    )
    
    db.add(wishlist_item)
    db.commit()
    db.refresh(wishlist_item)
    
    return {
        "success": True,
        "message": "Book added to wishlist",
        "wishlist_item": {
            "id": wishlist_item.id,
            "book_id": wishlist_item.book_id,
            "book_title": wishlist_item.book_title,
            "book_author": wishlist_item.book_author,
            "added_date": wishlist_item.added_date.isoformat()
        }
    }

@router.delete("/wishlist/{book_id}")
def remove_from_wishlist(
    book_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove book from wishlist"""
    wishlist_item = db.query(models.Wishlist).filter(
        models.Wishlist.user_id == current_user.id,
        models.Wishlist.book_id == book_id
    ).first()
    
    if not wishlist_item:
        raise HTTPException(status_code=404, detail="Book not found in wishlist")
    
    db.delete(wishlist_item)
    db.commit()
    
    return {
        "success": True,
        "message": "Book removed from wishlist"
    }

@router.get("/wishlist/check/{book_id}")
def check_wishlist(
    book_id: int,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if book is in user's wishlist"""
    wishlist_item = db.query(models.Wishlist).filter(
        models.Wishlist.user_id == current_user.id,
        models.Wishlist.book_id == book_id
    ).first()
    
    return {
        "success": True,
        "in_wishlist": wishlist_item is not None
    }
