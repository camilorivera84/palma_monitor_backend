// src/initDb.js
const pool = require('./config/database');
const bcrypt = require('bcryptjs');

async function initDatabase() {
  try {
    console.log('🔧 Iniciando creación de tablas...');

    // 1. Crear tabla de palmas (CON la columna codigo_estado)
    await pool.query(`
      CREATE TABLE IF NOT EXISTS palmas (
        id SERIAL PRIMARY KEY,
        lote VARCHAR(50) NOT NULL,
        linea VARCHAR(50) NOT NULL,
        palma VARCHAR(50) NOT NULL,
        estado VARCHAR(20) DEFAULT 'ACTIVA',
        descarte VARCHAR(50),
        codigo_estado VARCHAR(20),
        latitud DECIMAL(10, 8),
        longitud DECIMAL(11, 8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabla palmas creada con columna codigo_estado');

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

    // 5. Insertar datos de prueba en palmas (opcional)
    const palmasCheck = await pool.query('SELECT COUNT(*) FROM palmas');
    if (parseInt(palmasCheck.rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO palmas (lote, linea, palma, estado, codigo_estado, descarte, latitud, longitud) 
        VALUES 
        ('LOTE-001', 'LINEA-001', 'Palma 1', 'ACTIVA', 'ACT', 'ZONA A', 4.12345, -72.12345),
        ('LOTE-001', 'LINEA-001', 'Palma 2', 'ACTIVA', 'ACT', 'ZONA B', 4.12346, -72.12346),
        ('LOTE-001', 'LINEA-002', 'Palma 3', 'INACTIVA', 'INA', 'ZONA C', 4.12347, -72.12347)
      `);
      console.log('✅ Datos de prueba insertados en palmas');
    }

    // 6. ELIMINAR usuarios existentes para limpiar
    await pool.query(
      `DELETE FROM usuarios WHERE username IN ('admin', 'admin2', 'admin3')`,
    );
    console.log('🗑️ Usuarios anteriores eliminados');

    // 7. Crear usuario admin con contraseña admin123
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

    // 8. Agregar columna si existe en el código pero no en la tabla (por si acaso)
    try {
      await pool.query(`
        ALTER TABLE palmas 
        ADD COLUMN IF NOT EXISTS codigo_estado VARCHAR(20);
      `);
      console.log('✅ Columna codigo_estado verificada/agregada');
    } catch (error) {
      console.log('ℹ️ La columna codigo_estado ya existe o no se pudo agregar');
    }

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

module.exports = initDatabase;
