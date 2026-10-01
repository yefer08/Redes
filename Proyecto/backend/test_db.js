// ==============================================================================
// SCRIPT DE PRUEBA Y DIAGNÓSTICO DE BASE DE DATOS (NODE 14 / WINDOWS SERVER)
// ==============================================================================
const db = require('./db');
const config = require('./config');

async function runDiagnostic() {
    console.log('====================================================');
    console.log('🔍 INICIANDO DIAGNÓSTICO DE CONEXIÓN A BASE DE DATOS');
    console.log(`- Motor: ${config.dbType.toUpperCase()}`);
    console.log(`- Host: ${config.db.host}`);
    console.log(`- Puerto: ${config.db.port}`);
    console.log(`- Base de datos: ${config.db.database}`);
    console.log(`- Usuario: ${config.db.user}`);
    console.log(`- SSL Activado: ${Boolean(config.db.ssl)}`);
    console.log('====================================================');

    try {
        const isOk = await db.testConnection();
        if (isOk) {
            console.log('✨ Diagnóstico finalizado con éxito.');
        } else {
            console.log('⚠️ La prueba falló. Revisa las credenciales o el servicio SQL.');
        }
    } catch (err) {
        console.error('❌ Excepción durante el diagnóstico:', err);
    } finally {
        await db.closePool();
        process.exit(0);
    }
}

runDiagnostic();