const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- ENDPOINTS DE LA API REST (CRUD) ---

// 1. OBTENER TODOS LOS REGISTROS (READ - ALL)
app.get('/items', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM items ORDER BY id DESC');
        res.json({ data: rows });
    } catch (err) {
        console.error('Error al obtener datos:', err);
        res.status(500).json({ error: 'Error en la base de datos' });
    }
});

// 2. OBTENER UN REGISTRO POR ID (READ - ONE)
app.get('/items/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [rows] = await db.query('SELECT * FROM items WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Elemento no encontrado' });
        }
        res.json({ data: rows[0] });
    } catch (err) {
        console.error('Error al obtener elemento:', err);
        res.status(500).json({ error: 'Error en la base de datos' });
    }
});

// 3. GUARDAR UN NUEVO REGISTRO (CREATE)
app.post('/items', async (req, res) => {
    const { nombre, descripcion } = req.body;

    if (!nombre) {
        return res.status(400).json({ error: 'El campo "nombre" es obligatorio' });
    }

    try {
        const sql = 'INSERT INTO items (nombre, descripcion) VALUES (?, ?)';
        const [result] = await db.query(sql, [nombre, descripcion]);
        
        res.status(201).json({
            message: 'Registro creado con éxito en MySQL',
            data: {
                id: result.insertId,
                nombre,
                descripcion
            }
        });
    } catch (err) {
        console.error('Error al insertar en MySQL:', err);
        res.status(500).json({ error: 'Error al insertar en la base de datos' });
    }
});

// 4. ACTUALIZAR UN REGISTRO (UPDATE)
app.put('/items/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    if (!nombre) {
        return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    try {
        const sql = 'UPDATE items SET nombre = ?, descripcion = ? WHERE id = ?';
        const [result] = await db.query(sql, [nombre, descripcion, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Elemento no encontrado' });
        }

        res.json({ message: 'Registro actualizado con éxito' });
    } catch (err) {
        console.error('Error al actualizar en MySQL:', err);
        res.status(500).json({ error: 'Error al actualizar en la base de datos' });
    }
});

// 5. ELIMINAR UN REGISTRO (DELETE)
app.delete('/items/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const sql = 'DELETE FROM items WHERE id = ?';
        const [result] = await db.query(sql, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Elemento no encontrado' });
        }

        res.json({ message: 'Registro eliminado con éxito' });
    } catch (err) {
        console.error('Error al eliminar en MySQL:', err);
        res.status(500).json({ error: 'Error al eliminar en la base de datos' });
    }
});

// Iniciar Servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor Backend corriendo en http://localhost:${PORT}`);
});