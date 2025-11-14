# 📚 Pustakalayah LibraryHub - Complete Project Documentation

**Developer:**Team 3C9 
**Project Type:** Full-Stack Library Management System  
**Technology:** Python FastAPI + HTML/CSS/JavaScript  
**Database:** SQLite  
**Date:** November 2025

---

## 📋 Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Features](#features)
4. [Installation Guide](#installation-guide)
5. [Project Structure](#project-structure)
6. [Database Schema](#database-schema)
7. [API Documentation](#api-documentation)
8. [Frontend Pages](#frontend-pages)
9. [Security Features](#security-features)
10. [Usage Guide](#usage-guide)
11. [Troubleshooting](#troubleshooting)
12. [Future Enhancements](#future-enhancements)

---

## 🎯 Project Overview

**Pustakalayah LibraryHub** is a modern, full-stack library management system that streamlines book borrowing, user management, and library operations.

### Key Highlights
- ✅ Full-stack web application with RESTful API
- ✅ Real-time data synchronization
- ✅ Responsive design for all devices
- ✅ Role-based access control (Admin/Member)
- ✅ Secure authentication with password hashing
- ✅ Complete CRUD operations
- ✅ Email verification system
- ✅ Password recovery with OTP

### Project Goals
- Simplify library management operations
- Provide intuitive user experience
- Ensure data security and integrity
- Enable scalable architecture
- Demonstrate modern web development practices

---

## 🛠️ Technology Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3 + Tailwind CSS** - Modern styling
- **JavaScript (ES6+)** - Client-side logic
- **Fetch API** - HTTP requests

### Backend
- **Python 3.13+** - Server-side language
- **FastAPI 0.115.0** - Web framework
- **SQLAlchemy 2.0.35** - ORM
- **SQLite** - Database
- **Pydantic 2.9.2** - Data validation
- **Uvicorn 0.30.6** - ASGI server
- **Bcrypt 4.0.1** - Password hashing
- **Python-Jose 3.3.0** - JWT tokens

---

## ✨ Features

### 1. User Authentication & Management
- User registration with email validation
- Secure login with bcrypt hashing
- Email verification with tokens
- Password recovery with OTP
- Profile management with avatar upload
- Role-based access (Admin/Member)
- Session management with JWT

### 2. Book Management
- Book catalog with detailed information
- Category filtering (Fiction, Action, Romance, Comics, Mystery)
- Search functionality
- Book details modal
- Availability status tracking
- CRUD operations for admins
- Book image upload

### 3. Borrowing System
- Shopping cart for book selection
- Borrow books with automatic due dates
- Return books functionality
- Borrowing history tracking
- Overdue detection
- User borrowing records

### 4. Dashboard & Analytics
- Library statistics overview
- Total books/members count
- Active borrowings tracking
- Visual metric cards

### 5. Admin Features
- User management (view, edit, delete)
- Book management (add, edit, delete)
- Borrowing oversight
- Admin dashboard
- Member verification management

### 6. UI/UX Features
- Responsive design (mobile, tablet, desktop)
- Modern UI with Tailwind CSS
- Smooth animations
- Loading states
- Error handling with user-friendly messages
- Toast notifications
- Modal dialogs

---

## 🚀 Installation Guide

### Prerequisites
- Python 3.13+
- Git
- Web Browser
- PowerShell/Command Prompt

### Step 1: Backend Setup

```bash
# Navigate to backend directory
cd C:\Users\vinay\OneDrive\Desktop\ip___project\backend_py

# Create virtual environment
python -m venv .venv

# Activate virtual environment (PowerShell)
.venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start backend server
uvicorn app.main:app --reload --port 8000
```

**Backend will run at:** `http://localhost:8000`

### Step 2: Frontend Setup

```bash
# Open new terminal, navigate to project root
cd C:\Users\vinay\OneDrive\Desktop\ip___project

# Start frontend server
python -m http.server 3000
```

**Frontend will run at:** `http://localhost:3000`

### Step 3: Access Application

1. Open browser: `http://localhost:3000`
2. **Default Admin Credentials:**
   - Username: `admin`
   - Password: `admin123`

### Verification

- **API Health:** `http://localhost:8000/api/health`
- **API Docs:** `http://localhost:8000/docs`

---

## 📁 Project Structure

```
ip___project/
├── backend_py/                  # Python FastAPI Backend
│   ├── app/
│   │   ├── main.py             # FastAPI app entry
│   │   ├── db.py               # Database config
│   │   ├── models.py           # SQLAlchemy models
│   │   ├── schemas.py          # Pydantic schemas
│   │   └── routers/            # API routes
│   │       ├── users.py        # User endpoints
│   │       ├── books.py        # Book endpoints
│   │       └── borrowing.py    # Borrowing endpoints
│   ├── uploads/avatars/        # User avatars
│   ├── library.db              # SQLite database
│   ├── requirements.txt        # Dependencies
│   └── README.md               # Backend docs
├── pages/                       # Frontend pages
│   ├── login.html
│   ├── signup.html
│   ├── homepage.html
│   ├── dashboard.html
│   ├── catalog.html
│   ├── cart.html
│   ├── members.html
│   ├── profile.html
│   ├── admin.html
│   └── verify-email.html
├── index.html                   # Main entry
├── script.js                    # Main JavaScript
├── styles.css                   # Main CSS
├── logo.jpg                     # Project logo
└── README.md                    # Project README
```

---

## 🗄️ Database Schema

### Users Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| username | VARCHAR | Unique username |
| password_hash | VARCHAR | Bcrypt hashed password |
| email | VARCHAR | Unique email |
| name | VARCHAR | Full name |
| mobile | VARCHAR | Mobile number |
| member_since | DATETIME | Registration date |
| role | VARCHAR | admin/member |
| avatar | VARCHAR | Avatar filename |
| email_verified | BOOLEAN | Verification status |

### Books Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| title | VARCHAR | Book title |
| author | VARCHAR | Book author |
| category | VARCHAR | Book category |
| image | VARCHAR | Cover image URL |
| description | TEXT | Book description |
| isbn | VARCHAR | ISBN number |
| published_year | INTEGER | Publication year |
| available | BOOLEAN | Availability status |

### Borrowing Table
| Column | Type | Description |
|--------|------|-------------|
| id | INTEGER | Primary key |
| user_id | INTEGER | Foreign key to users |
| book_id | INTEGER | Foreign key to books |
| book_title | VARCHAR | Cached book title |
| book_author | VARCHAR | Cached book author |
| borrow_date | DATETIME | Borrow timestamp |
| return_date | DATETIME | Return timestamp |
| status | VARCHAR | borrowed/returned |

### Relationships
- Users → Borrowing (1:N)
- Books → Borrowing (1:N)
- Foreign key constraints ensure data integrity

---

## 📡 API Documentation

### Base URL: `http://localhost:8000`

### User Endpoints

#### 1. Register User
```http
POST /api/users
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "password123",
  "name": "John Doe",
  "mobile": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 2,
    "username": "john_doe",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "member",
    "email_verified": false
  },
  "message": "Registration successful!",
  "verificationUrl": "http://localhost:3000/pages/verify-email.html?token=..."
}
```

#### 2. Login
```http
POST /api/users/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@library.com",
    "name": "Administrator",
    "role": "admin"
  }
}
```

#### 3. Get All Users
```http
GET /api/users
```

#### 4. Update User
```http
PUT /api/users/{user_id}
Content-Type: application/json

{
  "name": "Updated Name",
  "email": "updated@example.com",
  "mobile": "+9876543210"
}
```

#### 5. Delete User
```http
DELETE /api/users/{user_id}
```

#### 6. Upload Avatar
```http
POST /api/users/{user_id}/avatar
Content-Type: multipart/form-data

file: [image file]
```

#### 7. Forgot Password
```http
POST /api/users/forgot-password
Content-Type: application/json

{
  "username": "john_doe"
}
```

**Response:**
```json
{
  "message": "OTP sent successfully",
  "otp": "123456"
}
```

#### 8. Verify OTP
```http
POST /api/users/verify-otp
Content-Type: application/json

{
  "username": "john_doe",
  "otp": "123456"
}
```

#### 9. Reset Password
```http
POST /api/users/reset-password
Content-Type: application/json

{
  "username": "john_doe",
  "otp": "123456",
  "new_password": "newPassword123"
}
```

#### 10. Verify Email
```http
POST /api/users/verify-email
Content-Type: application/json

{
  "token": "verification_token"
}
```

#### 11. Resend Verification
```http
POST /api/users/resend-verification
Content-Type: application/json

{
  "username": "john_doe"
}
```

### Book Endpoints

#### 1. Get All Books
```http
GET /api/books?category=fiction
```

**Query Parameters:**
- `category` (optional): fiction, action, romance, comic, mystery, all

**Response:**
```json
[
  {
    "id": 1,
    "title": "The Great Gatsby",
    "author": "F. Scott Fitzgerald",
    "category": "fiction",
    "image": "https://covers.openlibrary.org/b/id/7222246-L.jpg",
    "description": "A classic American novel...",
    "isbn": "9780743273565",
    "published_year": 1925,
    "available": true
  }
]
```

#### 2. Get Book by ID
```http
GET /api/books/{book_id}
```

#### 3. Create Book
```http
POST /api/books
Content-Type: application/json

{
  "title": "Book Title",
  "author": "Author Name",
  "category": "fiction",
  "description": "Description",
  "isbn": "9781234567890",
  "published_year": 2024,
  "available": true
}
```

#### 4. Update Book
```http
PUT /api/books/{book_id}
Content-Type: application/json

{
  "title": "Updated Title",
  "available": false
}
```

#### 5. Delete Book
```http
DELETE /api/books/{book_id}
```

### Borrowing Endpoints

#### 1. Get All Borrowings
```http
GET /api/borrowing
```

#### 2. Get User's Borrowings
```http
GET /api/borrowing/user/{user_id}
```

**Response:**
```json
[
  {
    "id": 1,
    "user_id": 2,
    "book_id": 1,
    "book_title": "The Great Gatsby",
    "book_author": "F. Scott Fitzgerald",
    "borrow_date": "2024-01-15T10:00:00",
    "return_date": "2024-01-29T10:00:00",
    "status": "borrowed"
  }
]
```

#### 3. Borrow Book
```http
POST /api/borrowing/borrow
Content-Type: application/json

{
  "user_id": 1,
  "book_id": 1,
  "book_title": "Book Title",
  "book_author": "Author Name"
}
```

#### 4. Return Book
```http
PUT /api/borrowing/return/{borrow_id}
```

#### 5. Get Overdue Books
```http
GET /api/borrowing/overdue
```

---

## 🖥️ Frontend Pages

### 1. Login Page (`/pages/login.html`)
- User authentication
- Form validation
- Redirect to homepage on success
- Link to signup and password recovery

### 2. Signup Page (`/pages/signup.html`)
- New user registration
- Email validation
- Password strength requirements
- Automatic email verification

### 3. Homepage (`/pages/homepage.html`)
- Welcome message
- Library statistics
- Quick navigation
- Featured books

### 4. Dashboard (`/pages/dashboard.html`)
- Total books count
- Total members count
- Active borrowings
- Quick actions

### 5. Catalog Page (`/pages/catalog.html`)
- Browse all books
- Filter by category
- Search functionality
- Add to cart
- Book details modal

### 6. Cart Page (`/pages/cart.html`)
- View selected books
- Remove items
- Borrow multiple books
- Clear cart

### 7. Members Page (`/pages/members.html`)
- List all library members
- Member information
- Search members
- Admin controls

### 8. Profile Page (`/pages/profile.html`)
- Edit user information
- Change avatar
- Update contact details
- View borrowing history

### 9. Admin Page (`/pages/admin.html`)
- User management
- Book management
- Borrowing oversight
- System statistics
- Admin controls

### 10. Email Verification (`/pages/verify-email.html`)
- Email verification with token
- Resend verification link
- Success/error messages

---

## 🔒 Security Features

### Authentication & Authorization
- **Bcrypt Password Hashing** - Secure password storage
- **JWT Tokens** - Stateless authentication
- **Email Verification** - Confirm user identity
- **OTP System** - Password recovery
- **Role-based Access** - Admin/Member permissions

### Data Protection
- **Input Validation** - Pydantic schemas
- **SQL Injection Prevention** - SQLAlchemy ORM
- **CORS Configuration** - Cross-origin security
- **Parameterized Queries** - Safe database operations

### Session Management
- **Secure Sessions** - JWT-based
- **Token Expiration** - Automatic timeout
- **Protected Routes** - Authentication required

---

## 📖 Usage Guide

### For Members

#### 1. Register Account
- Go to signup page
- Fill in details (username, email, password, name, mobile)
- Verify email via link sent to email
- Login with credentials

#### 2. Browse Books
- Navigate to catalog page
- Use category filter (Fiction, Action, Romance, Comics, Mystery)
- Search for specific books
- Click on book to view details

#### 3. Borrow Books
- Add books to cart from catalog
- Go to cart page
- Review selected books
- Click "Borrow All" button
- Books will be added to your borrowing history

#### 4. Return Books
- Go to profile page
- View "Borrowed Books" section
- Click "Return" button next to book
- Book will be marked as returned

#### 5. Manage Profile
- Go to profile page
- Update personal information (name, email, mobile)
- Upload/change avatar image
- View borrowing history

### For Administrators

#### 1. User Management
- Go to admin page
- View all registered users
- Edit user details (name, email, role)
- Delete users if necessary
- Verify member accounts

#### 2. Book Management
- Go to admin page → Books section
- Add new books with details
- Edit existing book information
- Delete books from catalog
- Update book availability status

#### 3. Borrowing Management
- View all active borrowings
- Check overdue books
- Monitor borrowing patterns
- Manage returns

#### 4. System Oversight
- View dashboard statistics
- Monitor total books/members
- Track active borrowings
- Generate reports

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Backend won't start
**Problem:** `ModuleNotFoundError` or import errors

**Solution:**
```bash
# Ensure virtual environment is activated
.venv\Scripts\Activate.ps1

# Reinstall dependencies
pip install -r requirements.txt

# Check Python version
python --version  # Should be 3.13+
```

#### 2. Database errors
**Problem:** Database file locked or corrupted

**Solution:**
```bash
# Delete database file
rm library.db

# Restart backend (will recreate database with seed data)
uvicorn app.main:app --reload --port 8000
```

#### 3. CORS errors
**Problem:** Frontend can't connect to backend

**Solution:**
- Ensure backend is running on port 8000
- Check CORS settings in `main.py`
- Verify frontend URL matches allowed origins
- Clear browser cache

#### 4. Login fails
**Problem:** Invalid credentials or user not found

**Solution:**
- Use default admin credentials: `admin` / `admin123`
- Check if user exists in database
- Verify password is correct (case-sensitive)
- Check if email is verified (for new users)

#### 5. Avatar upload fails
**Problem:** File upload error or permission denied

**Solution:**
```bash
# Create uploads directory
mkdir uploads\avatars

# Check file permissions
# Ensure backend has write access
# Restart backend server
```

#### 6. Email verification not working
**Problem:** Verification token invalid or expired

**Solution:**
- Use "Resend Verification" option
- Check token in URL is complete
- Ensure backend is running
- Check console for errors

#### 7. Books not loading
**Problem:** Catalog page shows no books

**Solution:**
- Check backend connection
- Verify API endpoint: `http://localhost:8000/api/books`
- Check browser console for errors
- Ensure database has seed data

#### 8. Port already in use
**Problem:** `Address already in use` error

**Solution:**
```bash
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID with actual process ID)
taskkill /PID <PID> /F

# Or use different port
uvicorn app.main:app --reload --port 8001
```

---

## 🚀 Future Enhancements

### Planned Features
- [ ] Advanced search with multiple filters
- [ ] Email notifications for due dates and overdue books
- [ ] Mobile app (React Native or Flutter)
- [ ] Analytics dashboard with charts
- [ ] Book recommendations based on history
- [ ] Reading lists and favorites
- [ ] Book reviews and ratings system
- [ ] Fine calculation for overdue books
- [ ] Reservation system for unavailable books
- [ ] Multi-language support (i18n)
- [ ] Export reports (PDF, Excel)
- [ ] QR code for book checkout
- [ ] Barcode scanner integration

### Technical Improvements
- [ ] PostgreSQL migration for production
- [ ] Redis caching for performance
- [ ] API rate limiting
- [ ] Microservices architecture
- [ ] Docker containerization
- [ ] Kubernetes orchestration
- [ ] CI/CD pipeline (GitHub Actions)
- [ ] Unit and integration tests
- [ ] Performance monitoring (Prometheus, Grafana)
- [ ] Centralized logging (ELK stack)
- [ ] Automated database backups
- [ ] Load balancing
- [ ] CDN for static assets

### UI/UX Enhancements
- [ ] Dark mode toggle
- [ ] Accessibility improvements (WCAG 2.1)
- [ ] Progressive Web App (PWA)
- [ ] Offline support with service workers
- [ ] Better mobile responsiveness
- [ ] Advanced animations
- [ ] Keyboard shortcuts
- [ ] Print functionality for reports
- [ ] Drag-and-drop file uploads
- [ ] Real-time notifications (WebSockets)
- [ ] Voice search
- [ ] Virtual library tour

---

## 📊 Project Statistics

- **Total Files:** 30+ files
- **Lines of Code:** 2000+ lines
- **Development Time:** 3-4 weeks
- **Technologies Used:** 10+ technologies
- **API Endpoints:** 20+ endpoints
- **Database Tables:** 3 core tables
- **Frontend Pages:** 10 pages
- **Features Implemented:** 30+ features

---

## 🎓 Learning Outcomes

### Technical Skills Gained
- Full-stack web development
- RESTful API design and implementation
- Database modeling and relationships
- Authentication and authorization systems
- Frontend-backend integration
- Async programming with Python
- ORM usage (SQLAlchemy)
- Data validation (Pydantic)
- File upload handling
- Email verification systems
- Password recovery mechanisms

### Best Practices Learned
- Clean code principles
- Separation of concerns
- Security best practices
- Error handling strategies
- API documentation
- Version control with Git
- Testing strategies
- Code organization
- Database design patterns
- User experience design

### Soft Skills Developed
- Problem-solving
- Project planning
- Time management
- Documentation writing
- Debugging techniques
- Research skills

---

## 📝 License

This project is licensed under the MIT License.

---

## 👥 Contributors

**Developer:** Vinay Beerpuri  
**Project:** Pustakalayah LibraryHub  
**Year:** 2024

---

## 📞 Contact & Support

For questions, issues, or contributions:
- **GitHub:** [Repository URL]
- **Email:** [Your Email]
- **Documentation:** This file and README.md
- **API Docs:** http://localhost:8000/docs

---

## 🙏 Acknowledgments

- FastAPI documentation and community
- Tailwind CSS framework
- SQLAlchemy ORM documentation
- Open Library API for book covers
- Stack Overflow community
- Python community
- GitHub for version control

---

## 📚 Additional Resources

### Documentation
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [SQLAlchemy Documentation](https://docs.sqlalchemy.org/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Pydantic Documentation](https://docs.pydantic.dev/)

### Tutorials
- FastAPI Tutorial: https://fastapi.tiangolo.com/tutorial/
- SQLAlchemy Tutorial: https://docs.sqlalchemy.org/en/20/tutorial/
- JavaScript Fetch API: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API

### Tools
- **Postman** - API testing
- **DB Browser for SQLite** - Database management
- **VS Code Extensions** - Python, Prettier, ESLint

---

**Thank you for using Pustakalayah LibraryHub! 📚✨**

*Last Updated: November 2024*
