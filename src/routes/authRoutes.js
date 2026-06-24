const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');

// Rutas de autenticación
router.post('/register', register);
router.post('/login', login);

// Ruta pública para ver usuarios (SIN autenticación)
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

module.exports = router;
