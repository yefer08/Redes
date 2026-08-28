const express = require('express');
const cors = require('cors');
const db = require('./db');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Middleware de Telemetría e Inspección de Tráfico HTTP
app.use((req, res, next) => {
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    console.log(`📡 [CAPA 7 - HTTP] Método: ${req.method} | Ruta: ${req.url} | Cliente IP: ${clientIP}`);
    next();
});

// FUNCIONALIDAD 1: CRUD COMPLETO
app.get('/items', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM items ORDER BY id DESC');
        res.json({ status: 200, protocol: 'HTTP/1.1', data: rows });
    } catch (err) {
        res.status(500).json({ error: 'Error en servidor de BD' });
    }
});

app.post('/items', async (req, res) => {
    const { nombre, descripcion } = req.body;
    if (!nombre) return res.status(400).json({ error: 'Nombre requerido' });

    try {
        const [result] = await db.query('INSERT INTO items (nombre, descripcion) VALUES (?, ?)', [nombre, descripcion]);
        res.status(201).json({ status: 201, data: { id: result.insertId, nombre, descripcion } });
    } catch (err) {
        res.status(500).json({ error: 'Error al insertar registro' });
    }
});

app.put('/items/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;
    try {
        const [result] = await db.query('UPDATE items SET nombre = ?, descripcion = ? WHERE id = ?', [nombre, descripcion, id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json({ status: 200, message: 'Registro actualizado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al actualizar' });
    }
});

app.delete('/items/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const [result] = await db.query('DELETE FROM items WHERE id = ?', [id]);
        if (result.affectedRows === 0) return res.status(404).json({ error: 'No encontrado' });
        res.json({ status: 200, message: 'Registro eliminado' });
    } catch (err) {
        res.status(500).json({ error: 'Error al eliminar' });
    }
});

// FUNCIONALIDAD 2: HEALTH CHECK DE RED (TELEMETRÍA)
app.get('/health', (req, res) => {
    res.json({ status: 'ONLINE', timestamp: new Date(), port: PORT, protocol: 'TCP/IP' });
});

// Escuchar en 0.0.0.0 para acceso desde la red LAN
// Endpoint que responde a la función iniciarTelemetria()
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
});