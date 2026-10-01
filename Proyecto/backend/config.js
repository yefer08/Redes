// ==============================================================================
// CONFIGURACIÓN CENTRALIZADA - COMPATIBLE CON NODE.JS v14.21.3 (COMMONJS)
// ==============================================================================
const fs = require('fs');
const path = require('path');

/**
 * Cargador de variables de entorno Zero-Dependency.
 * CRÍTICO PARA WINDOWS SERVER:
 * Cuando una aplicación se ejecuta como Servicio de Windows (vía NSSM, WinSer, Task Scheduler o IISNode),
 * el directorio actual (process.cwd()) suele apuntar a 'C:\Windows\System32'.
 * Por ello, SIEMPRE debemos resolver la ruta del archivo .env a partir de __dirname.
 */
function loadEnvFile() {
    const envPath = path.resolve(__dirname, '.env');
    if (!fs.existsSync(envPath)) {
        return;
    }

    try {
        const fileContent = fs.readFileSync(envPath, { encoding: 'utf8' });
        const lines = fileContent.split(/\r?\n/);

        lines.forEach(function (line) {
            var trimmed = line.trim();
            // Ignorar comentarios o líneas vacías
            if (!trimmed || trimmed.indexOf('#') === 0) {
                return;
            }
            var equalIndex = trimmed.indexOf('=');
            if (equalIndex > 0) {
                var key = trimmed.substring(0, equalIndex).trim();
                var value = trimmed.substring(equalIndex + 1).trim();
                // Remover comillas envolventes si existen
                if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
                    value = value.substring(1, value.length - 1);
                }
                // No sobreescribir variables ya inyectadas por el sistema operativo
                if (process.env[key] === undefined) {
                    process.env[key] = value;
                }
            }
        });
    } catch (err) {
        console.warn('⚠️ [CONFIG] No se pudo leer el archivo .env local:', err.message);
    }
}

// Cargar variables antes de exportar configuración
loadEnvFile();

const config = {
    env: process.env.NODE_ENV || 'production',
    server: {
        // En Windows Server, asegurar binding en todas las interfaces para acceso en red local
        host: process.env.HOST || '0.0.0.0',
        port: parseInt(process.env.PORT, 10) || 3000
    },
    // Selector de motor de base de datos: 'mysql' o 'postgres'
    dbType: (process.env.DB_TYPE || 'mysql').toLowerCase(),
    db: {
        // Usar '127.0.0.1' en Windows evita retardos de resolución DNS de 'localhost' (IPv4 vs IPv6 ::1)
        host: process.env.DB_HOST || '127.0.0.1',
        port: parseInt(process.env.DB_PORT, 10) || (process.env.DB_TYPE === 'postgres' ? 5432 : 3306),
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '123456789',
        database: process.env.DB_NAME || 'mi_base_datos',
        connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT, 10) || 10,
        connectTimeout: parseInt(process.env.DB_CONNECT_TIMEOUT_MS, 10) || 10000,
        // Manejo de SSL / TLS en Windows Server legacy:
        // Si se conecta a una BD en nube con certificados raíz no reconocidos por el OpenSSL de Node 14:
        ssl: process.env.DB_SSL === 'true' ? {
            rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true'
        } : false
    }
};

module.exports = config;
