const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const sqlite3 = require('sqlite3').verbose();
const axios = require('axios'); // For webhook
const cors = require('cors'); // Add CORS middleware

const app = express();
const port = 3000;
const JWT_SECRET = 'your_jwt_secret'; // In a real app, use environment variables

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(bodyParser.json());

// Initialize SQLite database
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error connecting to database:', err.message);
    } else {
        console.log('Connected to the SQLite database.');
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE,
            password TEXT,
            role TEXT
        )`);
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            userId INTEGER,
            recipient TEXT,
            amount REAL,
            currency TEXT,
            timestamp TEXT,
            FOREIGN KEY (userId) REFERENCES users(id)
        )`);
    }
});

// Helper function to authenticate JWT
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return res.sendStatus(403); // Forbidden
            }
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401); // Unauthorized
    }
};

// Routes

// 1. POST /signup
app.post('/signup', async (req, res) => {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    if (!['psp', 'dev'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Must be "psp" or "dev"' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run('INSERT INTO users (email, password, role) VALUES (?, ?, ?)', [email, hashedPassword, role], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(409).json({ message: 'User with this email already exists' });
                }
                console.error('Error inserting user:', err.message);
                return res.status(500).json({ message: 'Internal server error' });
            }
            res.status(201).json({ message: 'User registered successfully', userId: this.lastID });
        });
    } catch (error) {
        console.error('Error hashing password:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// 2. POST /login
app.post('/login', (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            console.error('Error fetching user:', err.message);
            return res.status(500).json({ message: 'Internal server error' });
        }
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign({ userId: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
        res.json({ token });
    });
});

// 3. GET /transactions
app.get('/transactions', authenticateJWT, (req, res) => {
    const userId = req.user.userId;

    db.all('SELECT recipient, amount, currency, timestamp FROM transactions WHERE userId = ?', [userId], (err, rows) => {
        if (err) {
            console.error('Error fetching transactions:', err.message);
            return res.status(500).json({ message: 'Internal server error' });
        }
        res.json(rows);
    });
});

// 4. POST /send
app.post('/send', authenticateJWT, async (req, res) => {
    const { recipient, amount, currency } = req.body;
    const userId = req.user.userId;

    if (!recipient || !amount || !currency) {
        return res.status(400).json({ message: 'Recipient, amount, and currency are required' });
    }

    if (typeof amount !== 'number' || amount <= 0) {
        return res.status(400).json({ message: 'Amount must be a positive number' });
    }

    const timestamp = new Date().toISOString();

    // Simulate payment processing
    const success = Math.random() > 0.2; // 80% success rate

    if (success) {
        db.run('INSERT INTO transactions (userId, recipient, amount, currency, timestamp) VALUES (?, ?, ?, ?, ?)',
            [userId, recipient, amount, currency, timestamp], function(err) {
                if (err) {
                    console.error('Error inserting transaction:', err.message);
                    return res.status(500).json({ message: 'Internal server error' });
                }
                const transactionId = this.lastID;

                // Bonus: Trigger webhook
                const webhookUrl = 'https://webhook.site/YOUR_WEBHOOK_ID'; // Replace with a real webhook URL for testing
                axios.post(webhookUrl, {
                    event: 'payment_sent',
                    transaction: {
                        id: transactionId,
                        userId: userId,
                        recipient,
                        amount,
                        currency,
                        timestamp
                    }
                }).then(() => {
                    console.log('Webhook successfully triggered.');
                }).catch(webhookErr => {
                    console.error('Error triggering webhook:', webhookErr.message);
                });

                res.status(200).json({ message: 'Payment successful', transactionId });
            });
    } else {
        res.status(500).json({ message: 'Payment failed. Please try again.' });
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Express app listening at http://localhost:${port}`);
});
