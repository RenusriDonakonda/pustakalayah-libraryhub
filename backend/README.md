# Pustakalayah LibraryHub Backend API

This is the backend API server for the Pustakalayah LibraryHub application.

## Features

- **User Management**: User registration, login, profile management
- **Book Management**: CRUD operations for books, category filtering
- **Borrowing System**: Book borrowing and return functionality
- **RESTful API**: Clean and well-structured API endpoints

## API Endpoints

### Users (`/api/users`)
- `GET /` - Get all users
- `GET /:id` - Get user by ID
- `POST /` - Create new user
- `PUT /:id` - Update user
- `DELETE /:id` - Delete user
- `POST /login` - User login

### Books (`/api/books`)
- `GET /` - Get all books
- `GET /:id` - Get book by ID
- `GET /category/:category` - Get books by category
- `POST /` - Create new book
- `PUT /:id` - Update book
- `DELETE /:id` - Delete book

### Borrowing (`/api/borrowing`)
- `GET /` - Get all borrowing records
- `GET /user/:userId` - Get user's borrowing records
- `POST /borrow` - Borrow a book
- `PUT /return/:id` - Return a book
- `GET /overdue` - Get overdue books
- `DELETE /:id` - Delete borrowing record

## Installation

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the server:
   ```bash
   npm start
   ```

   For development with auto-restart:
   ```bash
   npm run dev
   ```

## Configuration

- **Port**: Default port is 3000 (configurable via PORT environment variable)
- **Data Storage**: JSON files in `data/` directory
- **CORS**: Enabled for cross-origin requests

## Data Structure

### User
```json
{
  "id": 1,
  "username": "admin",
  "email": "admin@library.com",
  "name": "Admin User",
  "memberSince": "2024-01-01T00:00:00.000Z",
  "role": "admin"
}
```

### Book
```json
{
  "id": 1,
  "title": "The Lost City",
  "author": "Sarah Mitchell",
  "category": "fiction",
  "image": "https://example.com/image.jpg",
  "description": "A thrilling tale...",
  "isbn": "978-1234567890",
  "publishedYear": 2023,
  "available": true
}
```

### Borrowing Record
```json
{
  "id": 1,
  "userId": 1,
  "bookId": 1,
  "bookTitle": "The Lost City",
  "bookAuthor": "Sarah Mitchell",
  "borrowDate": "2024-01-01T00:00:00.000Z",
  "returnDate": "2024-01-15T00:00:00.000Z",
  "status": "borrowed"
}
```

## Development

The server uses Express.js with the following middleware:
- CORS for cross-origin requests
- JSON parsing for request bodies
- Static file serving for frontend assets

Data is stored in JSON files for simplicity, but can be easily migrated to a database.
