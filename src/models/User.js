const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const pool = require('../config/database');

class User {
  // Crear tabla de usuarios si no existe
  static async createTable() {
    const query = `
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;
    await pool.query(query);
    console.log('✅ Tabla users verificada/creada');
  }

  // Crear un nuevo usuario
  static async create({ username, email, password, role = 'user' }) {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const query = `
      INSERT INTO users (username, email, password, role)
      VALUES ($1, $2, $3, $4)
      RETURNING id, username, email, role, created_at
    `;
    const result = await pool.query(query, [
      username,
      email,
      hashedPassword,
      role,
    ]);
    return result.rows[0];
  }

  // Buscar usuario por username
  static async findByUsername(username) {
    const query = 'SELECT * FROM users WHERE username = $1';
    const result = await pool.query(query, [username]);
    return result.rows[0];
  }

  // Buscar usuario por email
  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1';
    const result = await pool.query(query, [email]);
    return result.rows[0];
  }

  // Buscar usuario por ID
  static async findById(id) {
    const query =
      'SELECT id, username, email, role, created_at FROM users WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }

  // Obtener todos los usuarios
  static async getAll() {
    const query =
      'SELECT id, username, email, role, created_at FROM users ORDER BY id';
    const result = await pool.query(query);
    return result.rows;
  }

  // Verificar contraseña
  static async comparePassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // Eliminar usuario
  static async delete(id) {
    const query = 'DELETE FROM users WHERE id = $1 RETURNING id, username';
    const result = await pool.query(query, [id]);
    return result.rows[0];
  }
}

module.exports = User;
