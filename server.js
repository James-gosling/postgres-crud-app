const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Database Connection Pool
const pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'crud_app',
});

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static('public'));

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Initialize Database Table
async function initializeDatabase() {
    try {
        await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        age INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✓ Database table initialized successfully');
    } catch (error) {
        console.error('✗ Error initializing database:', error);
        process.exit(1);
    }
}

// Routes

// GET - Display all users
app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
        const users = result.rows;
        res.render('index', { users, editingUser: null });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).render('index', { users: [], error: 'Error fetching users' });
    }
});

// POST - Create a new user
app.post('/users', async (req, res) => {
    const { name, email, age } = req.body;

    // Validation
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    try {
        await pool.query(
            'INSERT INTO users (name, email, age) VALUES ($1, $2, $3)',
            [name, email, age || null]
        );
        console.log(`✓ User created: ${name}`);
        res.redirect('/');
    } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === '23505') {
            return res.status(400).render('index', { users: [], error: 'Email already exists' });
        }
        res.status(500).render('index', { users: [], error: 'Error creating user' });
    }
});

// GET - Get single user for editing
app.get('/users/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const usersResult = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
        res.render('index', {
            users: usersResult.rows,
            editingUser: userResult.rows[0],
        });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({ error: 'Error fetching user' });
    }
});

// PUT - Update a user
app.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, age } = req.body;

    // Validation
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }

    try {
        const result = await pool.query(
            'UPDATE users SET name = $1, email = $2, age = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
            [name, email, age || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`✓ User updated: ${name}`);
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('Error updating user:', error);
        if (error.code === '23505') {
            return res.status(400).json({ error: 'Email already exists' });
        }
        res.status(500).json({ error: 'Error updating user' });
    }
});

// DELETE - Delete a user
app.delete('/users/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        console.log(`✓ User deleted: ${result.rows[0].name}`);
        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Error deleting user' });
    }
});

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
});

// Start Server
async function startServer() {
    await initializeDatabase();

    app.listen(PORT, () => {
        console.log(`🚀 Servidor ejecutandose on http://localhost:${PORT}`);
        console.log(`📊 Base de Datos: ${process.env.DB_NAME || 'crud_app'}`);
        console.log(`🔌 Host Base de Datos: ${process.env.DB_HOST || 'localhost'}`);
    });
}

startServer().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    pool.end();
    process.exit(0);
});