const express = require('express');
const { Pool } = require('pg');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Pool de Conexiones a la Base de Datos
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

// Configurar EJS como motor de vistas
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Inicializar la Tabla de la Base de Datos
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
        console.log('✓ Tabla de la base de datos inicializada correctamente');
    } catch (error) {
        console.error('✗ Error al inicializar la base de datos:', error);
        process.exit(1);
    }
}

// Rutas

// GET - Mostrar todos los usuarios
app.get('/', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
        const users = result.rows;
        res.render('index', { users, editingUser: null });
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        res.status(500).render('index', { users: [], error: 'Error al obtener usuarios' });
    }
});

// POST - Crear un nuevo usuario
app.post('/users', async (req, res) => {
    const { name, email, age } = req.body;

    // Validación
    if (!name || !email) {
        return res.status(400).json({ error: 'Nombre y correo electrónico son requeridos' });
    }

    try {
        await pool.query(
            'INSERT INTO users (name, email, age) VALUES ($1, $2, $3)',
            [name, email, age || null]
        );
        console.log(`✓ Usuario creado: ${name}`);
        res.redirect('/');
    } catch (error) {
        console.error('Error al crear usuario:', error);
        if (error.code === '23505') {
            return res.status(400).render('index', { users: [], error: 'El correo electrónico ya existe' });
        }
        res.status(500).render('index', { users: [], error: 'Error al crear usuario' });
    }
});

// GET - Obtener un solo usuario para editar
app.get('/users/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const userResult = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const usersResult = await pool.query('SELECT * FROM users ORDER BY created_at DESC');
        res.render('index', {
            users: usersResult.rows,
            editingUser: userResult.rows[0],
        });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
});

// PUT - Actualizar un usuario
app.put('/users/:id', async (req, res) => {
    const { id } = req.params;
    const { name, email, age } = req.body;

    // Validación
    if (!name || !email) {
        return res.status(400).json({ error: 'Nombre y correo electrónico son requeridos' });
    }

    try {
        const result = await pool.query(
            'UPDATE users SET name = $1, email = $2, age = $3, updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING *',
            [name, email, age || null, id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        console.log(`✓ Usuario actualizado: ${name}`);
        res.json({ success: true, user: result.rows[0] });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        if (error.code === '23505') {
            return res.status(400).json({ error: 'El correo electrónico ya existe' });
        }
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});

// DELETE - Eliminar un usuario
app.delete('/users/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        console.log(`✓ Usuario eliminado: ${result.rows[0].name}`);
        res.json({ success: true, message: 'Usuario eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});

// Verificación de estado
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});

// Middleware de manejo de errores
app.use((err, req, res, next) => {
    console.error('Error no manejado:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// Iniciar Servidor
async function startServer() {
    await initializeDatabase();

    app.listen(PORT, () => {
        console.log(`🚀 Servidor ejecutándose en http://localhost:${PORT}`);
        console.log(`📊 Base de Datos: ${process.env.DB_NAME || 'crud_app'}`);
        console.log(`🔌 Host de la Base de Datos: ${process.env.DB_HOST || 'localhost'}`);
    });
}

startServer().catch((error) => {
    console.error('Fallo al iniciar el servidor:', error);
    process.exit(1);
});

// Cierre gracefully
process.on('SIGTERM', () => {
    console.log('Señal SIGTERM recibida: cerrando servidor HTTP');
    pool.end();
    process.exit(0);
});