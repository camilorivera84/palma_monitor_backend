const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');

// ============================================
// VALIDACIONES
// ============================================
const validateRegister = [
  body('username')
    .notEmpty()
    .withMessage('El nombre de usuario es requerido')
    .isLength({ min: 3 })
    .withMessage('El nombre de usuario debe tener al menos 3 caracteres')
    .isLength({ max: 50 })
    .withMessage('El nombre de usuario no puede tener más de 50 caracteres'),
  body('email')
    .notEmpty()
    .withMessage('El email es requerido')
    .isEmail()
    .withMessage('Email inválido'),
  body('password')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('role').optional().isIn(['user', 'admin']).withMessage('Rol inválido'),
];

const validateLogin = [
  body('username').notEmpty().withMessage('El nombre de usuario es requerido'),
  body('password').notEmpty().withMessage('La contraseña es requerida'),
];

// ============================================
// RUTAS PÚBLICAS
// ============================================

// Login (público)
router.post('/login', validateLogin, authController.login);

// ============================================
// RUTAS PROTEGIDAS (requieren token)
// ============================================

// Registro (solo admin)
router.post(
  '/register',
  verifyToken,
  validateRegister,
  authController.register,
);

// Perfil (usuario autenticado)
router.get('/profile', verifyToken, authController.getProfile);

// Validar token
router.get('/validate', verifyToken, authController.validateToken);

// Obtener todos los usuarios (solo admin)
router.get('/users', verifyToken, authController.getAllUsers);

// Eliminar usuario (solo admin)
router.delete('/users/:id', verifyToken, authController.deleteUser);

module.exports = router;
