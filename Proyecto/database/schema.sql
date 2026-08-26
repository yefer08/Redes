-- Creación de la base de datos (Ejecutar en la consola de tu PostgreSQL)
-- CREATE DATABASE mi_base_datos;

-- Creación de la tabla de items
CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Registros de prueba iniciales
INSERT INTO items (nombre, descripcion) VALUES 
('Conexión PostgreSQL', 'Configurar el driver pg en Node.js'),
('Endpoint RESTful', 'Verificar respuesta en formato JSON');