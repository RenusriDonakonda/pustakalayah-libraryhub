from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, DeclarativeBase

SQLALCHEMY_DATABASE_URL = "sqlite:///./library.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

class Base(DeclarativeBase):
    pass

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

from . import models  # noqa: E402

def hash_password(password: str) -> str:
    """Plain text password storage (no hashing)"""
    return password

def verify_password(password: str, stored: str) -> bool:
    """Verify password against stored plain text"""
    return password == stored

def init_db():
    # Drop all tables
    Base.metadata.drop_all(bind=engine)
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        # Add default admin user if no users exist
        if db.query(models.User).count() == 0:
            admin_user = models.User(
                username="admin",
                password_hash=hash_password("admin"),
                email="admin@library.com",
                name="Admin User",
                role="admin",
                email_verified=True
            )
            db.add(admin_user)
            print("Default admin user created: admin/admin")
        
        # Add seed books if no books exist
        if db.query(models.Book).count() == 0:
            seed_books = [
                models.Book(
                    title="The Lost City",
                    author="Sarah Mitchell",
                    category="fiction",
                    image="https://images.unsplash.com/photo-1543002588-bfa74002ed7e?fit=crop&w=400&h=600",
                    description="A thrilling tale of discovery and adventure in an ancient civilization.",
                    isbn="978-1234567890",
                    published_year=2023,
                    available=True
                ),
                models.Book(
                    title="Midnight Chase",
                    author="James Anderson",
                    category="action",
                    image="https://images.unsplash.com/photo-1589998059171-988d887df646?fit=crop&w=400&h=600",
                    description="High-stakes pursuit through the dark streets of London.",
                    isbn="978-1234567891",
                    published_year=2023,
                    available=True
                ),
                models.Book(
                    title="Love in Paris",
                    author="Emily Roberts",
                    category="romance",
                    image="https://images.unsplash.com/photo-1544947950-fa07a98d237f?fit=crop&w=400&h=600",
                    description="A romantic journey through the city of love.",
                    isbn="978-1234567892",
                    published_year=2023,
                    available=True
                ),
                models.Book(
                    title="Superhero Chronicles",
                    author="Mike Turner",
                    category="comic",
                    image="https://images.unsplash.com/photo-1608889476518-738c9b1dcb40?fit=crop&w=400&h=600",
                    description="Action-packed adventures of modern-day heroes.",
                    isbn="978-1234567893",
                    published_year=2023,
                    available=True
                ),
                models.Book(
                    title="The Silent Witness",
                    author="Patricia Blake",
                    category="mystery",
                    image="https://images.unsplash.com/photo-1587876931567-564ce588bfbd?fit=crop&w=400&h=600",
                    description="A gripping mystery that will keep you guessing until the end.",
                    isbn="978-1234567894",
                    published_year=2023,
                    available=True
                ),
                models.Book(
                    title="Dragon's Rise",
                    author="Robert King",
                    category="fiction",
                    image="https://m.media-amazon.com/images/I/71zr12FF4kL._AC_UF1000,1000_QL80_.jpg",
                    description="Epic fantasy tale of dragons and magic.",
                    isbn="978-1234567895",
                    published_year=2023,
                    available=True
                ),
                models.Book(
                    title="Urban Warriors",
                    author="David Chen",
                    category="action",
                    image="https://m.media-amazon.com/images/I/81qBSSkGfvL._UF1000,1000_QL80_.jpg",
                    description="Modern martial arts action in the concrete jungle.",
                    isbn="978-1234567896",
                    published_year=2023,
                    available=True
                ),
                models.Book(
                    title="Sunset Dreams",
                    author="Sofia Garcia",
                    category="romance",
                    image="https://m.media-amazon.com/images/I/71iLEh7q--L._UF1000,1000_QL80_.jpg",
                    description="A beautiful story of summer love and new beginnings.",
                    isbn="978-1234567897",
                    published_year=2023,
                    available=True
                ),
                models.Book(
                    title="Mystery Manor",
                    author="Thomas Wright",
                    category="mystery",
                    image="https://images.unsplash.com/photo-1512820790803-83ca734da794?fit=crop&w=400&h=600",
                    description="Strange occurrences in an old English manor.",
                    isbn="978-1234567898",
                    published_year=2023,
                    available=True
                ),
                models.Book(
                    title="Hero Academy",
                    author="Lisa Chang",
                    category="comic",
                    image="https://images.unsplash.com/photo-1608889476518-738c9b1dcb40?fit=crop&w=400&h=600",
                    description="Young heroes learning to master their powers.",
                    isbn="978-1234567899",
                    published_year=2023,
                    available=True
                )
            ]
            for book in seed_books:
                db.add(book)
            print("Seed books added to database")
        
        db.commit()
    finally:
        db.close()
