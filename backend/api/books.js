// Books Management API
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const BOOKS_FILE = path.join(__dirname, '../data/books.json');

// Initialize books data if file doesn't exist
async function initializeBooks() {
  try {
    await fs.access(BOOKS_FILE);
  } catch (error) {
    const defaultBooks = [
      {
        id: 1,
        title: "The Lost City",
        author: "Sarah Mitchell",
        category: "fiction",
        image: "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?fit=crop&w=400&h=600",
        description: "A thrilling tale of discovery and adventure in an ancient civilization.",
        isbn: "978-1234567890",
        publishedYear: 2023,
        available: true
      },
      {
        id: 2,
        title: "Midnight Chase",
        author: "James Anderson",
        category: "action",
        image: "https://images.unsplash.com/photo-1589998059171-988d887df646?fit=crop&w=400&h=600",
        description: "High-stakes pursuit through the dark streets of London.",
        isbn: "978-1234567891",
        publishedYear: 2023,
        available: true
      },
      {
        id: 3,
        title: "Love in Paris",
        author: "Emily Roberts",
        category: "romance",
        image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?fit=crop&w=400&h=600",
        description: "A romantic journey through the city of love.",
        isbn: "978-1234567892",
        publishedYear: 2023,
        available: true
      },
      {
        id: 4,
        title: "Superhero Chronicles",
        author: "Mike Turner",
        category: "comic",
        image: "https://images.unsplash.com/photo-1608889476518-738c9b1dcb40?fit=crop&w=400&h=600",
        description: "Action-packed adventures of modern-day heroes.",
        isbn: "978-1234567893",
        publishedYear: 2023,
        available: true
      },
      {
        id: 5,
        title: "The Silent Witness",
        author: "Patricia Blake",
        category: "mystery",
        image: "https://images.unsplash.com/photo-1587876931567-564ce588bfbd?fit=crop&w=400&h=600",
        description: "A gripping mystery that will keep you guessing until the end.",
        isbn: "978-1234567894",
        publishedYear: 2023,
        available: true
      }
    ];
    await fs.writeFile(BOOKS_FILE, JSON.stringify(defaultBooks, null, 2));
  }
}

// GET all books
router.get('/', async (req, res) => {
  try {
    await initializeBooks();
    const data = await fs.readFile(BOOKS_FILE, 'utf8');
    const books = JSON.parse(data);
    res.json(books);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// GET book by ID
router.get('/:id', async (req, res) => {
  try {
    await initializeBooks();
    const data = await fs.readFile(BOOKS_FILE, 'utf8');
    const books = JSON.parse(data);
    const book = books.find(b => b.id === parseInt(req.params.id));
    
    if (!book) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    res.json(book);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch book' });
  }
});

// GET books by category
router.get('/category/:category', async (req, res) => {
  try {
    await initializeBooks();
    const data = await fs.readFile(BOOKS_FILE, 'utf8');
    const books = JSON.parse(data);
    const category = req.params.category;
    
    const filteredBooks = category === 'all' 
      ? books 
      : books.filter(book => book.category === category);
    
    res.json(filteredBooks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch books by category' });
  }
});

// POST create new book
router.post('/', async (req, res) => {
  try {
    await initializeBooks();
    const data = await fs.readFile(BOOKS_FILE, 'utf8');
    const books = JSON.parse(data);
    
    const { title, author, category, image, description, isbn, publishedYear } = req.body;
    
    const newBook = {
      id: books.length > 0 ? Math.max(...books.map(b => b.id)) + 1 : 1,
      title,
      author,
      category,
      image,
      description,
      isbn,
      publishedYear: publishedYear || new Date().getFullYear(),
      available: true
    };
    
    books.push(newBook);
    await fs.writeFile(BOOKS_FILE, JSON.stringify(books, null, 2));
    
    res.status(201).json(newBook);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create book' });
  }
});

// PUT update book
router.put('/:id', async (req, res) => {
  try {
    await initializeBooks();
    const data = await fs.readFile(BOOKS_FILE, 'utf8');
    const books = JSON.parse(data);
    const bookIndex = books.findIndex(b => b.id === parseInt(req.params.id));
    
    if (bookIndex === -1) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    const { title, author, category, image, description, isbn, publishedYear, available } = req.body;
    books[bookIndex] = { 
      ...books[bookIndex], 
      title, 
      author, 
      category, 
      image, 
      description, 
      isbn, 
      publishedYear,
      available: available !== undefined ? available : books[bookIndex].available
    };
    
    await fs.writeFile(BOOKS_FILE, JSON.stringify(books, null, 2));
    res.json(books[bookIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update book' });
  }
});

// DELETE book
router.delete('/:id', async (req, res) => {
  try {
    await initializeBooks();
    const data = await fs.readFile(BOOKS_FILE, 'utf8');
    const books = JSON.parse(data);
    const filteredBooks = books.filter(b => b.id !== parseInt(req.params.id));
    
    if (books.length === filteredBooks.length) {
      return res.status(404).json({ error: 'Book not found' });
    }
    
    await fs.writeFile(BOOKS_FILE, JSON.stringify(filteredBooks, null, 2));
    res.json({ message: 'Book deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

module.exports = router;
