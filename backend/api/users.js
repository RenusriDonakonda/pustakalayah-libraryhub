// User Management API
const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const USERS_FILE = path.join(__dirname, '../data/users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'; // In production, use environment variable

// Initialize users data if file doesn't exist
async function initializeUsers() {
  try {
    await fs.access(USERS_FILE);
  } catch (error) {
    // Create the data directory if it doesn't exist
    const dataDir = path.dirname(USERS_FILE);
    await fs.mkdir(dataDir, { recursive: true });

    const defaultPassword = await bcrypt.hash('admin', 10);
    const defaultUsers = [
      {
        id: 1,
        username: 'admin',
        password: defaultPassword,
        email: 'admin@library.com',
        name: 'Admin User',
        memberSince: new Date().toISOString(),
        role: 'admin'
      }
    ];
    await fs.writeFile(USERS_FILE, JSON.stringify(defaultUsers, null, 2));
  }
}

// Middleware to ensure user is authenticated
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access denied' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    req.user = verified;
    next();
  } catch (err) {
    res.status(400).json({ error: 'Invalid token' });
  }
}

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    await initializeUsers();
    const { username, password } = req.body;

    // Validate input
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    const user = users.find(u => u.username === username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // For admin user with plaintext password
    if (user.username === 'admin' && !user.password.startsWith('$')) {
      if (password === user.password) {
        // Update admin password to hashed version
        user.password = await bcrypt.hash(password, 10);
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
      }
    } else {
      // For regular users, verify hashed password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid username or password' });
      }
    }

    // Create and sign JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password from user object before sending
    const { password: _, ...userWithoutPassword } = user;
    res.json({ token, user: userWithoutPassword });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Register endpoint
router.post('/register', async (req, res) => {
  try {
    await initializeUsers();
    const { username, email, password } = req.body;

    console.log('Registration attempt:', { username, email }); // Debug log

    // Validate input
    if (!username || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long' });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address' });
    }

    let data;
    try {
      data = await fs.readFile(USERS_FILE, 'utf8');
    } catch (error) {
      console.error('Error reading users file:', error);
      // If file doesn't exist, initialize with empty array
      data = '[]';
    }

    const users = JSON.parse(data);

    // Check if username or email already exists
    if (users.some(u => u.username.toLowerCase() === username.toLowerCase())) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create new user
    const newUser = {
      id: users.length + 1,
      username,
      email,
      password: hashedPassword,
      memberSince: new Date().toISOString(),
      role: 'user'
    };

    users.push(newUser);

    // Ensure the data directory exists
    const dataDir = path.dirname(USERS_FILE);
    await fs.mkdir(dataDir, { recursive: true });

    // Write updated users to file
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

    console.log('User registered successfully:', { username, email }); // Debug log

    res.status(201).json({
      success: true,
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to register user' });
  }
});

// GET all users (protected route)
router.get('/', authenticateToken, async (req, res) => {
  try {
    await initializeUsers();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);
    res.json(usersWithoutPasswords);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET user by ID (protected route)
// GET current user (from token)
router.get('/me', authenticateToken, async (req, res) => {
  try {
    await initializeUsers();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    const user = users.find(u => u.id === parseInt(req.user.id));
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET user by ID (protected route)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    await initializeUsers();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    const user = users.find(u => u.id === parseInt(req.params.id));
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    // remove password before sending
    const { password, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// POST create new user
router.post('/', async (req, res) => {
  try {
    await initializeUsers();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    
    const { username, email, password, name } = req.body;
    
    // Check if user already exists
    if (users.find(u => u.username === username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }
    // Hash password before storing
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = {
      id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
      username,
      email,
      password: hashedPassword,
      name: name || username,
      memberSince: new Date().toISOString(),
      role: 'member'
    };

    users.push(newUser);
    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));

    // Do not return password in response
    const { password: _, ...userWithoutPassword } = newUser;
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// PUT update user (protected: only owner or admin)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    await initializeUsers();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
    
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    // Authorization: only the owner or admin can update
    const requesterId = parseInt(req.user.id);
    const requesterRole = req.user.role;
    const targetUserId = parseInt(req.params.id);

    if (requesterRole !== 'admin' && requesterId !== targetUserId) {
      return res.status(403).json({ error: 'Forbidden: you can only update your own profile' });
    }

    const { name, email, avatar } = req.body;
    // Allow updating name, email and avatar
    users[userIndex] = {
      ...users[userIndex],
      ...(name !== undefined ? { name } : {}),
      ...(email !== undefined ? { email } : {}),
      ...(avatar !== undefined ? { avatar } : {})
    };

    await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2));
    const { password, ...userWithoutPassword } = users[userIndex];
    res.json(userWithoutPassword);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update user' });
  }
});

// DELETE user
router.delete('/:id', async (req, res) => {
  try {
    await initializeUsers();
    const data = await fs.readFile(USERS_FILE, 'utf8');
    const users = JSON.parse(data);
    const filteredUsers = users.filter(u => u.id !== parseInt(req.params.id));
    
    if (users.length === filteredUsers.length) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await fs.writeFile(USERS_FILE, JSON.stringify(filteredUsers, null, 2));
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Note: authentication/login is handled by the JWT-based /login route above

module.exports = router;
