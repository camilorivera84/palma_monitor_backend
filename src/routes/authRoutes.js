const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// Rutas de autenticación
router.post('/register', register);
router.post('/login', login);

// Ruta pública para ver todos los usuarios (SIN autenticación)
router.get('/public-users', async (req, res) => {
  try {
    const pool = require('../config/database');
    const result = await pool.query('SELECT id, username, email, role FROM usuarios');
    res.json({ success: true, users: result.rows });
  } catch (error) {
    console.error('❌ Error en /public-users:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Ruta de depuración para ver el hash de la contraseña de admin (SIN autenticación)
router.get('/check-admin', async (req, res) => {
  try {
    const pool = require('../config/database');
    const result = await pool.query('SELECT id, username, password FROM usuarios WHERE username = $1', ['admin']);
    if (result.rows.length === 0) {
      return res.json({ success: false, message: 'Usuario admin no encontrado' });
    }
    res.json({ 
      success: true, 
      username: result.rows[0].username,
      password_hash: result.rows[0].password,
      hash_length: result.rows[0].password.length
    });
  } catch (error) {
    console.error('❌ Error en /check-admin:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
