from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..db import get_db
from .. import models, schemas

router = APIRouter()

@router.get("/", response_model=list[schemas.BorrowOut])
def list_all(db: Session = Depends(get_db)):
    return db.query(models.Borrowing).all()

@router.get("/user/{user_id}", response_model=list[schemas.BorrowOut])
def list_by_user(user_id: int, db: Session = Depends(get_db)):
    return db.query(models.Borrowing).filter(models.Borrowing.user_id == user_id).all()

@router.post("/borrow", response_model=schemas.BorrowOut)
def borrow(payload: schemas.BorrowCreate, db: Session = Depends(get_db)):
    # prevent duplicate active borrow
    existing = db.query(models.Borrowing).filter(
        models.Borrowing.user_id == payload.user_id,
        models.Borrowing.book_id == payload.book_id,
        models.Borrowing.status == "borrowed",
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Book already borrowed by this user")

    book = db.query(models.Book).get(payload.book_id)
    if not book or not book.available:
        raise HTTPException(status_code=400, detail="Book not available")

    record = models.Borrowing(
        user_id=payload.user_id,
        book_id=payload.book_id,
        book_title=payload.book_title,
        book_author=payload.book_author,
        borrow_date=datetime.utcnow(),
        return_date=datetime.utcnow() + timedelta(days=14),
        status="borrowed",
    )
    book.available = False
    db.add(record)
    db.commit()
    db.refresh(record)
    return record

@router.put("/return/{borrow_id}", response_model=schemas.BorrowOut)
def return_book(borrow_id: int, db: Session = Depends(get_db)):
    record = db.query(models.Borrowing).get(borrow_id)
    if not record:
        raise HTTPException(status_code=404, detail="Borrowing record not found")
    if record.status == "returned":
        raise HTTPException(status_code=400, detail="Book already returned")
    record.status = "returned"
    record.return_date = datetime.utcnow()

    # mark book available
    book = db.query(models.Book).get(record.book_id)
    if book:
        book.available = True

    db.commit()
    db.refresh(record)
    return record

@router.get("/overdue", response_model=list[schemas.BorrowOut])
def overdue(db: Session = Depends(get_db)):
    now = datetime.utcnow()
    return db.query(models.Borrowing).filter(
        models.Borrowing.status == "borrowed",
        models.Borrowing.return_date < now,
    ).all()
