const mysql = require('mysql2/promise');

async function testConnection() {
    console.log('Intentando conectar a MySQL local...');
    try {
        const connection = await mysql.createConnection({
            host: 'localhost',
            user: 'root',
            password: '123456',
            database: 'mi_base_datos',
            port: 3306
        });
        console.log('✅ ¡CONEXIÓN EXITOSA A MYSQL!');
        
        const [rows] = await connection.query('SELECT 1 + 1 AS resultado');
        console.log('Prueba de consulta OK, resultado:', rows[0].resultado);
        await connection.end();
    } catch (error) {
        console.error('❌ ERROR AL CONECTAR:');
        console.error('Código de error:', error.code);
        console.error('Mensaje completo:', error.message);
    }
}

testConnection();