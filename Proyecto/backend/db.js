const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: '127.0.0.1',        // Usa '127.0.0.1' en lugar de 'localhost'
    user: 'root',             // Tu usuario de MySQL
    password: '123456789',    // La contraseña que usas para entrar
    database: 'mi_base_datos',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;