from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os
import shutil
from typing import Optional

from ..db import get_db, hash_password, verify_password
from .. import models, schemas

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/users/login")

# JWT configuration
SECRET_KEY = os.getenv("JWT_SECRET", "your-secret-key")  # Change in production
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

@router.get("/", response_model=list[schemas.UserOut])
def list_users(db: Session = Depends(get_db)):
    return db.query(models.User).all()

@router.post("/register", response_model=schemas.TokenResponse)
async def register_user(
    payload: schemas.UserCreate,
    avatar: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db)
):
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
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Handle avatar if provided
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
    
    # Generate token
    token = create_access_token({"sub": user.username})
    return {
        "success": True,
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
def login(payload: schemas.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.username == payload.username).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
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

@router.delete("/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(models.User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"success": True}
    user = db.query(models.User).get(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    db.delete(user)
    db.commit()
    return {"message": "User deleted"}
