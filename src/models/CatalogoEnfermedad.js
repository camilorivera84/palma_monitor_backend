const { Pool } = require('pg');
const pool = require('../config/database');

class CatalogoEnfermedad {
  // Obtener todas las enfermedades
  static async getAll() {
    const query = 'SELECT * FROM catalogo_enfermedades ORDER BY nombre';
    const result = await pool.query(query);
    return result.rows;
  }

  // Obtener enfermedad por ID
  static async getById(id) {
    const query = 'SELECT * FROM catalogo_enfermedades WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Crear nueva enfermedad
  static async create(nombre, descripcion = '') {
    const query = `
      INSERT INTO catalogo_enfermedades (nombre, descripcion)
      VALUES ($1, $2)
      RETURNING *
    `;
    const result = await pool.query(query, [nombre, descripcion]);
    return result.rows[0];
  }

  // Actualizar enfermedad
  static async update(id, nombre, descripcion) {
    const query = `
      UPDATE catalogo_enfermedades 
      SET nombre = $1, descripcion = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;
    const result = await pool.query(query, [nombre, descripcion, id]);
    return result.rows[0];
  }

  // Eliminar enfermedad
  static async delete(id) {
    const query = 'DELETE FROM catalogo_enfermedades WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = CatalogoEnfermedad;
