const { Pool } = require('pg');

// Configuración de la conexión a tu PostgreSQL local
const pool = new Pool({
    user: 'postgres',          // Tu usuario de PostgreSQL (por defecto 'postgres')
    host: 'localhost',
    database: 'mi_base_datos', // Nombre de la BD creada
    password: 'tu_password',   // Pon aquí tu contraseña local de PostgreSQL
    port: 5432,                // Puerto por defecto de PostgreSQL
});

pool.on('connect', () => {
    console.log('Conectado a la base de datos PostgreSQL.');
});

module.exports = {
    query: (text, params) => pool.query(text, params),
};