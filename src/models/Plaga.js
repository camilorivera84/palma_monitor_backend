const { Pool } = require('pg');
const pool = require('../config/database');

class Plaga {
  // Crear tabla de plagas
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS plagas (
        id SERIAL PRIMARY KEY,
        palma_id INTEGER REFERENCES palmas(id) ON DELETE CASCADE,
        plaga VARCHAR(100) NOT NULL,
        nombre_cientifico VARCHAR(100),
        estado_biologico VARCHAR(50),
        fecha_deteccion DATE DEFAULT CURRENT_DATE,
        nivel_infestacion VARCHAR(20) DEFAULT 'Bajo',
        observaciones TEXT,
        latitud DECIMAL(10, 8),
        longitud DECIMAL(11, 8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(query);
    console.log('✅ Tabla plagas verificada/creada');
  }

  // Crear registro de plaga
  static async create({
    palma_id,
    plaga,
    nombre_cientifico,
    estado_biologico,
    fecha_deteccion,
    nivel_infestacion,
    observaciones,
    latitud,
    longitud,
  }) {
    const query = `
      INSERT INTO plagas (palma_id, plaga, nombre_cientifico, estado_biologico, fecha_deteccion, nivel_infestacion, observaciones, latitud, longitud)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const result = await pool.query(query, [
      palma_id,
      plaga,
      nombre_cientifico,
      estado_biologico,
      fecha_deteccion || new Date(),
      nivel_infestacion || 'Bajo',
      observaciones,
      latitud,
      longitud,
    ]);
    return result.rows[0];
  }

  // Obtener todas las plagas
  static async getAll() {
    const query = `
      SELECT p.*, pa.lote, pa.linea, pa.palma as palma_numero
      FROM plagas p
      LEFT JOIN palmas pa ON p.palma_id = pa.id
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Obtener plagas por palma
  static async getByPalma(palma_id) {
    const query =
      'SELECT * FROM plagas WHERE palma_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [palma_id]);
    return result.rows;
  }

  // Obtener plagas por tipo
  static async getByTipo(plaga) {
    const query =
      'SELECT * FROM plagas WHERE plaga = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [plaga]);
    return result.rows;
  }

  // Obtener estadísticas de plagas
  static async getStats() {
    const query = `
      SELECT 
        plaga,
        COUNT(*) as total,
        COUNT(DISTINCT palma_id) as palmas_afectadas,
        MAX(fecha_deteccion) as ultimo_registro
      FROM plagas
      GROUP BY plaga
      ORDER BY total DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Obtener datos para mapa de calor
  static async getHeatmapData() {
    const query = `
      SELECT 
        plaga,
        latitud,
        longitud,
        COUNT(*) as concentracion,
        STRING_AGG(DISTINCT palma_id::text, ',') as palmas_afectadas
      FROM plagas
      WHERE latitud IS NOT NULL AND longitud IS NOT NULL
      GROUP BY plaga, latitud, longitud
      ORDER BY concentracion DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = Plaga;
