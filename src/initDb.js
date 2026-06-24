// src/initDb.js
const pool = require('./config/database');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  try {
    console.log('🔧 Iniciando creación de tablas...');

    // 1. Crear tabla de palmas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS palmas (
        id SERIAL PRIMARY KEY,
        lote VARCHAR(50) NOT NULL,
        linea VARCHAR(50) NOT NULL,
        palma VARCHAR(50) NOT NULL,
        estado VARCHAR(20) DEFAULT 'ACTIVA',
        descarte VARCHAR(50),
        latitud DECIMAL(10, 8),
        longitud DECIMAL(11, 8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla palmas creada');

    // 2. Crear tabla de usuarios
    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla usuarios creada');

    // 3. Crear tabla de enfermedades
    await pool.query(`
      CREATE TABLE IF NOT EXISTS enfermedades (
        id SERIAL PRIMARY KEY,
        palma_id INTEGER REFERENCES palmas(id),
        enfermedad VARCHAR(100) NOT NULL,
        fecha_deteccion DATE DEFAULT CURRENT_DATE,
        severidad VARCHAR(20) CHECK (severidad IN ('Baja', 'Media', 'Alta', 'Crítica')),
        observaciones TEXT,
        latitud DECIMAL(10, 8),
        longitud DECIMAL(11, 8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla enfermedades creada');

    // 4. Crear tabla de plagas
    await pool.query(`
      CREATE TABLE IF NOT EXISTS plagas (
        id SERIAL PRIMARY KEY,
        palma_id INTEGER REFERENCES palmas(id),
        plaga VARCHAR(100) NOT NULL,
        fecha_deteccion DATE DEFAULT CURRENT_DATE,
        nivel_infestacion VARCHAR(20) CHECK (nivel_infestacion IN ('Bajo', 'Medio', 'Alto', 'Crítico')),
        estado_biologico VARCHAR(20),
        observaciones TEXT,
        latitud DECIMAL(10, 8),
        longitud DECIMAL(11, 8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla plagas creada');

    // 5. ELIMINAR usuarios existentes para limpiar
    await pool.query(`DELETE FROM usuarios WHERE username = 'admin'`);
    console.log('🗑️ Usuario admin anterior eliminado');

    // 6. Crear usuario admin con contraseña admin123
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);
    console.log('🔑 Hash generado:', hashedPassword);

    await pool.query(
      `
      INSERT INTO usuarios (username, email, password, role) 
      VALUES ($1, $2, $3, $4)
    `,
      ['admin', 'admin@palma.com', hashedPassword, 'admin'],
    );

    console.log('✅ Usuario admin creado con contraseña admin123');

    console.log('🎉 Base de datos inicializada correctamente');
    return {
      success: true,
      message: 'Base de datos inicializada correctamente',
    };
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error.message);
    throw error;
  }
}

// ✅ EXPORTAR LA FUNCIÓN CORRECTAMENTE
module.exports = initDatabase;
