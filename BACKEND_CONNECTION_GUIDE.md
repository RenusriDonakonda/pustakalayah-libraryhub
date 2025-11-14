# Backend Connection Guide

## 🎯 Problem Fixed
The login error has been resolved by fixing the backend connection instead of using demo users.

## 🔧 What Was Fixed

### 1. Backend Server
- **Started FastAPI backend** on port 8000
- **Database**: SQLite with seeded admin user
- **Status**: ✅ Running and healthy

### 2. Frontend Configuration  
- **API_BASE**: Set to `http://localhost:8000`
- **Frontend server**: Moved to port 3000 (to avoid conflicts)
- **Demo mode**: Disabled (using real backend)

### 3. Authentication
- **Default admin user**: `admin` / `admin`
- **Password hashing**: bcrypt
- **JWT tokens**: Working correctly

## 🚀 How to Access

### Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **Test Page**: http://localhost:3000/backend_test.html

### Login Credentials
Use the default admin account:
- **Username**: `admin`
- **Password**: `admin`

## 📋 API Endpoints

### Authentication
- `POST /api/users/login` - User login
- `POST /api/users/register` - User registration

### Users
- `GET /api/users` - List users
- `PUT /api/users/{id}` - Update user

### Books
- `GET /api/books` - List books
- `POST /api/books` - Create book
- `PUT /api/books/{id}` - Update book

### Borrowing
- `GET /api/borrowing/user/{user_id}` - User's borrowed books
- `POST /api/borrowing/borrow` - Borrow a book

## 🧪 Testing

1. **Backend Health**: http://localhost:8000/api/health
2. **Login Test**: Use the test page at http://localhost:3000/backend_test.html
3. **Full Application**: http://localhost:3000

## 🔍 Troubleshooting

If login fails:
1. Check both servers are running (ports 8000 and 3000)
2. Verify credentials: admin/admin
3. Check browser console for errors
4. Test API directly with curl/Postman

## 📝 Notes

- No demo users are created - using real backend database
- Backend seeds one admin user on startup
- Frontend and backend run on different ports to avoid conflicts
- CORS is enabled on backend for frontend access
