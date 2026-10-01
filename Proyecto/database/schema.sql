-- ==============================================================================
-- ESQUEMA DE BASE DE DATOS (COMPATIBLE CON MYSQL Y POSTGRESQL)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- OPCIÓN A: PARA POSTGRESQL (pg)
-- ------------------------------------------------------------------------------
-- CREATE DATABASE mi_base_datos;
-- \c mi_base_datos;

CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Usuario inicial demo (Credenciales: admin / admin123)
INSERT INTO usuarios (username, password, nombre) 
VALUES ('admin', 'admin123', 'Administrador de Redes')
ON CONFLICT (username) DO NOTHING;

-- Items iniciales
INSERT INTO items (nombre, descripcion) VALUES 
('Conexión de Base de Datos', 'Controlador SQL inicializado con éxito'),
('Endpoint RESTful', 'Verificar respuesta en formato JSON');

-- ------------------------------------------------------------------------------
-- OPCIÓN B: PARA MYSQL (mysql2)
-- ------------------------------------------------------------------------------
/*
CREATE DATABASE IF NOT EXISTS mi_base_datos;
USE mi_base_datos;

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT IGNORE INTO usuarios (username, password, nombre) 
VALUES ('admin', 'admin123', 'Administrador de Redes');

INSERT INTO items (nombre, descripcion) VALUES 
('Conexión de Base de Datos', 'Controlador SQL inicializado con éxito'),
('Endpoint RESTful', 'Verificar respuesta en formato JSON');
*/