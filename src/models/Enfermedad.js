const { Pool } = require('pg');
const pool = require('../config/database');

class Enfermedad {
  // Crear tabla de enfermedades
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS enfermedades (
        id SERIAL PRIMARY KEY,
        palma_id INTEGER REFERENCES palmas(id) ON DELETE CASCADE,
        enfermedad VARCHAR(100) NOT NULL,
        fecha_deteccion DATE DEFAULT CURRENT_DATE,
        severidad VARCHAR(20) DEFAULT 'Media',
        observaciones TEXT,
        latitud DECIMAL(10, 8),
        longitud DECIMAL(11, 8),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(query);
    console.log('✅ Tabla enfermedades verificada/creada');
  }

  // Crear registro de enfermedad
  static async create({
    palma_id,
    enfermedad,
    fecha_deteccion,
    severidad,
    observaciones,
    latitud,
    longitud,
  }) {
    const query = `
      INSERT INTO enfermedades (palma_id, enfermedad, fecha_deteccion, severidad, observaciones, latitud, longitud)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    const result = await pool.query(query, [
      palma_id,
      enfermedad,
      fecha_deteccion || new Date(),
      severidad || 'Media',
      observaciones,
      latitud,
      longitud,
    ]);
    return result.rows[0];
  }

  // Obtener todas las enfermedades
  static async getAll() {
    const query = `
      SELECT e.*, p.lote, p.linea, p.palma as palma_numero
      FROM enfermedades e
      LEFT JOIN palmas p ON e.palma_id = p.id
      ORDER BY e.created_at DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Obtener enfermedades por palma
  static async getByPalma(palma_id) {
    const query =
      'SELECT * FROM enfermedades WHERE palma_id = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [palma_id]);
    return result.rows;
  }

  // Obtener enfermedades por tipo
  static async getByTipo(enfermedad) {
    const query =
      'SELECT * FROM enfermedades WHERE enfermedad = $1 ORDER BY created_at DESC';
    const result = await pool.query(query, [enfermedad]);
    return result.rows;
  }

  // Obtener estadísticas de enfermedades
  static async getStats() {
    const query = `
      SELECT 
        enfermedad,
        COUNT(*) as total,
        COUNT(DISTINCT palma_id) as palmas_afectadas,
        MAX(fecha_deteccion) as ultimo_registro
      FROM enfermedades
      GROUP BY enfermedad
      ORDER BY total DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }

  // Obtener datos para mapa de calor
  static async getHeatmapData() {
    const query = `
      SELECT 
        enfermedad,
        latitud,
        longitud,
        COUNT(*) as concentracion,
        STRING_AGG(DISTINCT palma_id::text, ',') as palmas_afectadas
      FROM enfermedades
      WHERE latitud IS NOT NULL AND longitud IS NOT NULL
      GROUP BY enfermedad, latitud, longitud
      ORDER BY concentracion DESC
    `;
    const result = await pool.query(query);
    return result.rows;
  }
}

module.exports = Enfermedad;
