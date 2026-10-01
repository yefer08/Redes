// ==============================================================================
// GESTIÓN DE CONEXIONES SQL (MYSQL2 / PG) - COMPATIBLE CON NODE.JS v14.21.3
// ==============================================================================
const config = require('./config');

var pool = null;
var isPostgres = config.dbType === 'postgres';

if (isPostgres) {
    // --- DRIVER POSTGRESQL (pg) ---
    const { Pool } = require('pg');
    
    var pgOptions = {
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        max: config.db.connectionLimit,
        connectionTimeoutMillis: config.db.connectTimeout,
        idleTimeoutMillis: 30000
    };

    if (config.db.ssl) {
        pgOptions.ssl = config.db.ssl;
    }

    pool = new Pool(pgOptions);

    // Capturar errores en clientes inactivos del pool (CRÍTICO para evitar caídas del proceso en Node 14)
    pool.on('error', function (err, client) {
        console.error('⚠️ [POSTGRES POOL ERROR] Error inesperado en cliente inactivo:', err.message);
    });

} else {
    // --- DRIVER MYSQL (mysql2/promise) ---
    const mysql = require('mysql2/promise');

    var mysqlOptions = {
        host: config.db.host,
        port: config.db.port,
        user: config.db.user,
        password: config.db.password,
        database: config.db.database,
        waitForConnections: true,
        connectionLimit: config.db.connectionLimit,
        queueLimit: 0,
        connectTimeout: config.db.connectTimeout,
        // Compatibilidad con reconexión automática y zona horaria
        timezone: 'Z',
        dateStrings: true
    };

    if (config.db.ssl) {
        mysqlOptions.ssl = config.db.ssl;
    }

    pool = mysql.createPool(mysqlOptions);

    // En mysql2 pool de promesas, el pool subyacente emite errores de conexión
    if (pool.pool) {
        pool.pool.on('error', function (err) {
            console.error('⚠️ [MYSQL POOL ERROR] Error en el pool de conexiones:', err.message);
        });
    }
}

/**
 * Adaptador de consultas unificado para mantener compatibilidad con [rows] o [result]
 * Permite alternar entre MySQL y PostgreSQL sin romper la sintaxis de index.js
 */
async function query(sql, params) {
    params = params || [];

    if (isPostgres) {
        // Convertir placeholders estilo MySQL (?) a estilo PostgreSQL ($1, $2, ...)
        var paramIndex = 1;
        var pgSql = sql.replace(/\?/g, function () {
            return '$' + (paramIndex++);
        });

        // Si es un INSERT y no tiene RETURNING id, agregar RETURNING id para emular insertId
        var isInsert = /^\s*insert\s+into/i.test(pgSql);
        if (isInsert && !/returning/i.test(pgSql)) {
            pgSql += ' RETURNING id';
        }

        var result = await pool.query(pgSql, params);

        // Emular interfaz de mysql2 para evitar refactorizar cada endpoint
        var simulatedResult = {
            affectedRows: result.rowCount || 0,
            insertId: (result.rows && result.rows[0] && result.rows[0].id) ? result.rows[0].id : null
        };

        return [result.rows, simulatedResult];
    } else {
        return await pool.query(sql, params);
    }
}

/**
 * Verificación diagnóstica de la conexión en el arranque
 */
async function testConnection() {
    try {
        console.log(`🔌 [DB] Probando conexión con ${config.dbType.toUpperCase()} en ${config.db.host}:${config.db.port}...`);
        var testSql = isPostgres ? 'SELECT 1 AS resultado' : 'SELECT 1 + 1 AS resultado';
        await query(testSql);
        console.log(`✅ [DB] Conexión establecida exitosamente con ${config.dbType.toUpperCase()} (${config.db.database})`);
        return true;
    } catch (err) {
        console.error(`❌ [DB ERROR] No se pudo conectar a la base de datos (${config.dbType}):`, err.message);
        console.error('💡 Verifique que el servicio SQL esté corriendo y las credenciales en .env sean correctas.');
        return false;
    }
}

/**
 * Cierre ordenado del pool al recibir señales de terminación
 */
async function closePool() {
    try {
        if (pool) {
            if (isPostgres) {
                await pool.end();
            } else if (pool.end) {
                await pool.end();
            }
            console.log('🛑 [DB] Pool de conexiones cerrado correctamente.');
        }
    } catch (err) {
        console.error('⚠️ [DB] Error al cerrar pool:', err.message);
    }
}

module.exports = {
    pool: pool,
    query: query,
    testConnection: testConnection,
    closePool: closePool,
    dbType: config.dbType
};