const { Pool } = require('pg');
const pool = require('../config/database');

class CatalogoPlaga {
  // Obtener todas las plagas
  static async getAll() {
    const query = 'SELECT * FROM catalogo_plagas ORDER BY nombre';
    const result = await pool.query(query);
    return result.rows;
  }

  // Obtener plaga por ID
  static async getById(id) {
    const query = 'SELECT * FROM catalogo_plagas WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Crear nueva plaga
  static async create(nombre, nombre_cientifico = '') {
    const query = `
      INSERT INTO catalogo_plagas (nombre, nombre_cientifico)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query(query, [nombre, nombre_cientifico]);
    return result.rows[0];
  }

  // Actualizar plaga
  static async update(id, nombre, nombre_cientifico) {
    const query = `
      UPDATE catalogo_plagas 
      SET nombre = $1, nombre_cientifico = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [nombre, nombre_cientifico, id]);
    return result.rows[0];
  }

  // Eliminar plaga
  static async delete(id) {
    const query = 'DELETE FROM catalogo_plagas WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = CatalogoPlaga;
