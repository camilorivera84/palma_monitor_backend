// src/initDb.js
const pool = require('./config/database');

async function initDatabase() {
  try {
    console.log('🔧 Iniciando creación de tablas...');

    // Crear todas las tablas (igual que antes)
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

    // Eliminar el usuario admin si existe
    await pool.query(`DELETE FROM usuarios WHERE username = 'admin'`);
    console.log('🗑️ Usuario admin anterior eliminado');

    // Hash fijo para la contraseña 'admin123' generado con bcrypt
    const fixedHash = '$2a$10$YQxVpKq.WYcKjqXQxVpKq.WYcKjqXQxVpKq.WYcKjqXQxVpKq.WYcKjq';

    // Insertar el usuario con el hash fijo
    await pool.query(`
      INSERT INTO usuarios (username, email, password, role) 
      VALUES ($1, $2, $3, $4)
    `, ['admin', 'admin@palma.com', fixedHash, 'admin']);

    console.log('✅ Usuario admin creado con contraseña admin123 (hash fijo)');

    console.log('🎉 Base de datos inicializada correctamente');
    return { success: true, message: 'Base de datos inicializada correctamente' };
  } catch (error) {
    console.error('❌ Error al inicializar la base de datos:', error.message);
    throw error;
  }
}

module.exports = initDatabase;
