// Borrowing Management API
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');

const BORROWING_FILE = path.join(__dirname, '../data/borrowing.json');

// Initialize borrowing data if file doesn't exist
async function initializeBorrowing() {
  try {
    await fs.access(BORROWING_FILE);
  } catch (error) {
    const defaultBorrowing = [];
    await fs.writeFile(BORROWING_FILE, JSON.stringify(defaultBorrowing, null, 2));
  }
}

// GET all borrowing records
router.get('/', async (req, res) => {
  try {
    await initializeBorrowing();
    const data = await fs.readFile(BORROWING_FILE, 'utf8');
    const borrowing = JSON.parse(data);
    res.json(borrowing);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch borrowing records' });
  }
});

// GET borrowing records by user ID
router.get('/user/:userId', async (req, res) => {
  try {
    await initializeBorrowing();
    const data = await fs.readFile(BORROWING_FILE, 'utf8');
    const borrowing = JSON.parse(data);
    const userBorrowing = borrowing.filter(b => b.userId === parseInt(req.params.userId));
    res.json(userBorrowing);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user borrowing records' });
  }
});

// POST borrow a book
router.post('/borrow', async (req, res) => {
  try {
    await initializeBorrowing();
    const data = await fs.readFile(BORROWING_FILE, 'utf8');
    const borrowing = JSON.parse(data);
    
    const { userId, bookId, bookTitle, bookAuthor } = req.body;
    
    // Check if user already has this book borrowed
    const existingBorrow = borrowing.find(b => 
      b.userId === userId && b.bookId === bookId && b.status === 'borrowed'
    );
    
    if (existingBorrow) {
      return res.status(400).json({ error: 'Book already borrowed by this user' });
    }
    
    const borrowDate = new Date();
    const returnDate = new Date();
    returnDate.setDate(returnDate.getDate() + 14); // 14 days borrowing period
    
    const newBorrow = {
      id: borrowing.length > 0 ? Math.max(...borrowing.map(b => b.id)) + 1 : 1,
      userId,
      bookId,
      bookTitle,
      bookAuthor,
      borrowDate: borrowDate.toISOString(),
      returnDate: returnDate.toISOString(),
      status: 'borrowed'
    };
    
    borrowing.push(newBorrow);
    await fs.writeFile(BORROWING_FILE, JSON.stringify(borrowing, null, 2));
    
    res.status(201).json(newBorrow);
  } catch (error) {
    res.status(500).json({ error: 'Failed to borrow book' });
  }
});

// PUT return a book
router.put('/return/:id', async (req, res) => {
  try {
    await initializeBorrowing();
    const data = await fs.readFile(BORROWING_FILE, 'utf8');
    const borrowing = JSON.parse(data);
    const borrowIndex = borrowing.findIndex(b => b.id === parseInt(req.params.id));
    
    if (borrowIndex === -1) {
      return res.status(404).json({ error: 'Borrowing record not found' });
    }
    
    if (borrowing[borrowIndex].status === 'returned') {
      return res.status(400).json({ error: 'Book already returned' });
    }
    
    borrowing[borrowIndex].status = 'returned';
    borrowing[borrowIndex].actualReturnDate = new Date().toISOString();
    
    await fs.writeFile(BORROWING_FILE, JSON.stringify(borrowing, null, 2));
    res.json(borrowing[borrowIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to return book' });
  }
});

// GET overdue books
router.get('/overdue', async (req, res) => {
  try {
    await initializeBorrowing();
    const data = await fs.readFile(BORROWING_FILE, 'utf8');
    const borrowing = JSON.parse(data);
    const now = new Date();
    
    const overdueBooks = borrowing.filter(b => {
      if (b.status !== 'borrowed') return false;
      const returnDate = new Date(b.returnDate);
      return returnDate < now;
    });
    
    res.json(overdueBooks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch overdue books' });
  }
});

// DELETE borrowing record
router.delete('/:id', async (req, res) => {
  try {
    await initializeBorrowing();
    const data = await fs.readFile(BORROWING_FILE, 'utf8');
    const borrowing = JSON.parse(data);
    const filteredBorrowing = borrowing.filter(b => b.id !== parseInt(req.params.id));
    
    if (borrowing.length === filteredBorrowing.length) {
      return res.status(404).json({ error: 'Borrowing record not found' });
    }
    
    await fs.writeFile(BORROWING_FILE, JSON.stringify(filteredBorrowing, null, 2));
    res.json({ message: 'Borrowing record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete borrowing record' });
  }
});

module.exports = router;
