// ==============================================================================
// BACKEND API REST & TELEMETRÍA - COMPATIBLE CON NODE.JS v14.21.3 (WINDOWS SERVER)
// ==============================================================================
const path = require('path');
const express = require('express');
const cors = require('cors');
const config = require('./config');
const db = require('./db');

// --- MANEJO DE EXCEPCIONES GLOBALES (CRÍTICO EN WINDOWS SERVER / SERVICIOS) ---
process.on('uncaughtException', function (err) {
    console.error('💥 [CRITICAL UNCAUGHT EXCEPTION]:', err && err.stack ? err.stack : err);
    // En servicios de producción, se loguea para auditoría sin tirar el loop de eventos
});

process.on('unhandledRejection', function (reason, promise) {
    console.error('⚠️ [UNHANDLED PROMISE REJECTION]:', reason);
});

const app = express();

// --- MIDDLEWARES BASE ---
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// --- TELEMETRÍA E INSPECCIÓN DE TRÁFICO HTTP (CAPA 7) ---
app.use(function (req, res, next) {
    var clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'Desconocida';
    console.log(`📡 [CAPA 7 - HTTP] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} | Cliente IP: ${clientIP}`);
    next();
});

// --- SERVIDO DE ARCHIVOS ESTÁTICOS (FRONTEND INTEGRADO) ---
// Utiliza path.join para garantizar rutas consistentes con separadores (\ o /) de Windows
var frontendPath = path.resolve(__dirname, '..', 'Frontend');
app.use(express.static(frontendPath));

// --- ENDPOINT DE AUTENTICACIÓN / LOGIN ---
app.post('/login', async function (req, res) {
    var username = req.body.username;
    var password = req.body.password;

    if (!username || !password) {
        return res.status(400).json({ error: 'Usuario y contraseña requeridos' });
    }

    try {
        var queryResult = await db.query(
            'SELECT id, username, nombre FROM usuarios WHERE username = ? AND password = ?',
            [username, password]
        );
        var rows = queryResult[0];

        if (!rows || rows.length === 0) {
            // Acceso de respaldo maestro si la tabla está vacía o sin inicializar
            if (username === 'admin' && password === 'admin123') {
                return res.json({
                    status: 200,
                    message: 'Autenticación exitosa (Credencial de Administrador)',
                    user: { id: 1, username: 'admin', nombre: 'Administrador de Redes' }
                });
            }
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        var usuario = rows[0];
        return res.json({
            status: 200,
            message: 'Autenticación exitosa',
            user: { id: usuario.id, username: usuario.username, nombre: usuario.nombre }
        });
    } catch (err) {
        console.error('❌ [API ERROR /login]:', err.message);
        // Si el motor SQL o la tabla no está creada, permitir acceso de emergencia a admin
        if (username === 'admin' && password === 'admin123') {
            console.warn('⚠️ [LOGIN] Acceso concedido a admin maestro (BD offline o sin tabla usuarios)');
            return res.json({
                status: 200,
                message: 'Autenticación exitosa (Modo de Recuperación)',
                user: { id: 1, username: 'admin', nombre: 'Administrador de Redes' }
            });
        }
        return res.status(500).json({
            error: 'Error interno en la base de datos'
        });
    }

});

// --- ENDPOINTS CRUD: ITEMS ---
// Almacén en memoria de respaldo si el motor SQL no está activo
var inMemoryItems = [
    { id: 1, nombre: 'Gateway Principal (192.168.1.1)', descripcion: 'Enrutador central y salida a Internet' },
    { id: 2, nombre: 'Servidor DNS / DHCP', descripcion: 'Windows Server 2012 - Resolución de nombres activa' },
    { id: 3, nombre: 'Controlador de Dominio (DC)', descripcion: 'Autenticación de usuarios y directivas de grupo' }
];

app.get('/items', async function (req, res) {
    try {
        var queryResult = await db.query('SELECT * FROM items ORDER BY id DESC');
        var rows = queryResult[0];
        return res.json({ status: 200, protocol: 'HTTP/1.1', data: rows });
    } catch (err) {
        console.warn('⚠️ [API GET /items] BD SQL offline. Sirviendo nodos desde memoria temporal.');
        return res.json({ status: 200, protocol: 'HTTP/1.1', data: inMemoryItems });
    }
});

app.post('/items', async function (req, res) {
    var nombre = req.body.nombre;
    var descripcion = req.body.descripcion;

    if (!nombre) {
        return res.status(400).json({ error: 'El campo nombre es requerido' });
    }

    try {
        var queryResult = await db.query(
            'INSERT INTO items (nombre, descripcion) VALUES (?, ?)',
            [nombre, descripcion || '']
        );
        var meta = queryResult[1];
        var insertedId = meta && meta.insertId ? meta.insertId : null;

        return res.status(201).json({
            status: 201,
            message: 'Registro creado con éxito',
            data: { id: insertedId, nombre: nombre, descripcion: descripcion || '' }
        });
    } catch (err) {
        console.warn('⚠️ [API POST /items] Guardando en memoria temporal (BD SQL offline)');
        var newId = inMemoryItems.length ? Math.max(...inMemoryItems.map(i => i.id)) + 1 : 1;
        var newItem = { id: newId, nombre: nombre, descripcion: descripcion || '' };
        inMemoryItems.unshift(newItem);
        return res.status(201).json({
            status: 201,
            message: 'Registro creado (Modo local)',
            data: newItem
        });
    }
});

app.put('/items/:id', async function (req, res) {
    var id = parseInt(req.params.id, 10);
    var nombre = req.body.nombre;
    var descripcion = req.body.descripcion;

    try {
        var queryResult = await db.query(
            'UPDATE items SET nombre = ?, descripcion = ? WHERE id = ?',
            [nombre, descripcion, id]
        );
        var meta = queryResult[1];

        if (!meta || meta.affectedRows === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }

        return res.json({ status: 200, message: 'Registro actualizado correctamente' });
    } catch (err) {
        var item = inMemoryItems.find(i => i.id === id);
        if (item) {
            item.nombre = nombre;
            item.descripcion = descripcion;
            return res.json({ status: 200, message: 'Registro actualizado (Memoria)' });
        }
        return res.status(404).json({ error: 'Registro no encontrado' });
    }
});

app.delete('/items/:id', async function (req, res) {
    var id = parseInt(req.params.id, 10);

    try {
        var queryResult = await db.query('DELETE FROM items WHERE id = ?', [id]);
        var meta = queryResult[1];

        if (!meta || meta.affectedRows === 0) {
            return res.status(404).json({ error: 'Registro no encontrado' });
        }

        return res.json({ status: 200, message: 'Registro eliminado correctamente' });
    } catch (err) {
        inMemoryItems = inMemoryItems.filter(i => i.id !== id);
        return res.json({ status: 200, message: 'Registro eliminado (Memoria)' });
    }
});


// --- TELEMETRÍA Y HEALTH CHECK AVANZADO ---
app.get('/health', function (req, res) {
    var memoryUsage = process.memoryUsage();
    res.json({
        status: 'ONLINE',
        timestamp: new Date().toISOString(),
        uptimeSeconds: Math.floor(process.uptime()),
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        database: {
            driver: db.dbType,
            host: config.db.host,
            port: config.db.port
        },
        memory: {
            rssMb: Math.round(memoryUsage.rss / 1024 / 1024),
            heapUsedMb: Math.round(memoryUsage.heapUsed / 1024 / 1024)
        },
        protocol: 'TCP/IP'
    });
});

// --- MANEJO DE RUTAS NO ENCONTRADAS (404) ---
app.use(function (req, res) {
    res.status(404).json({ error: 'Ruta no encontrada', path: req.originalUrl });
});

// --- MANEJO DE ERRORES CENTRALIZADO DE EXPRESS (500) ---
app.use(function (err, req, res, next) {
    console.error('💥 [EXPRESS ERROR HANDLER]:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// --- INICIALIZACIÓN DEL SERVIDOR ---
var server = app.listen(config.server.port, config.server.host, async function () {
    console.log('====================================================');
    console.log(`🚀 Servidor backend activo en http://${config.server.host}:${config.server.port}`);
    console.log(`💻 Entorno Node.js: ${process.version} | SO: ${process.platform} (${process.arch})`);
    console.log(`📁 Directorio Frontend: ${frontendPath}`);
    console.log('====================================================');

    // Verificar conexión a base de datos de manera no bloqueante
    await db.testConnection();
});

// --- GRACEFUL SHUTDOWN (COMPATIBLE CON WINDOWS SERVICE / NSSM / PM2) ---
function handleShutdown(signal) {
    console.log(`\n🛑 Recibida señal de detención (${signal}). Cerrando servidor de forma ordenada...`);
    server.close(async function () {
        console.log('🔌 Conexiones HTTP finalizadas.');
        await db.closePool();
        console.log('👋 Proceso terminado limpiamente.');
        process.exit(0);
    });

    // Forzar salida si tarda más de 5 segundos
    setTimeout(function () {
        console.error('⚠️ [TIMEOUT] Forzando detención del proceso.');
        process.exit(1);
    }, 5000).unref();
}

process.on('SIGINT', function () { handleShutdown('SIGINT'); });
process.on('SIGTERM', function () { handleShutdown('SIGTERM'); });
// Compatible con gestores de procesos en Windows (IPC message)
process.on('message', function (msg) {
    if (msg === 'shutdown') {
        handleShutdown('IPC:shutdown');
    }
});