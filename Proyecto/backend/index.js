const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- ENDPOINTS DE LA API REST ---

// 1. OBTENER TODOS LOS REGISTROS
app.get('/items', async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM items ORDER BY id DESC');
        res.json({ data: result.rows });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en la base de datos' });
    }
});

// 2. OBTENER UN REGISTRO POR ID
app.get('/items/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const result = await db.query('SELECT * FROM items WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Elemento no encontrado' });
        }
        res.json({ data: result.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error en la base de datos' });
    }
});

// 3. GUARDAR UN NUEVO REGISTRO (Seguro contra SQL Injection)
app.post('/items', async (req, res) => {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
        return res.status(400).json({ error: 'El campo "nombre" es obligatorio' });
    }

    try {
        const queryText = 'INSERT INTO items (nombre, descripcion) VALUES ($1, $2) RETURNING *';
        const result = await db.query(queryText, [nombre, descripcion]);
        
        res.status(201).json({
            message: 'Registro creado con éxito',
            data: result.rows[0]
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Error al insertar en la base de datos' });
    }
});

// Iniciar Servidor
app.listen(PORT, () => {
    console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});