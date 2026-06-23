const express = require('express');
const router = express.Router();
const catalogoEnfermedadController = require('../controllers/catalogoEnfermedadController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Rutas públicas (solo lectura)
router.get('/', catalogoEnfermedadController.getAll);
router.get('/:id', catalogoEnfermedadController.getById);

// Rutas protegidas (solo admin)
router.post('/', verifyToken, isAdmin, catalogoEnfermedadController.create);
router.put('/:id', verifyToken, isAdmin, catalogoEnfermedadController.update);
router.delete(
  '/:id',
  verifyToken,
  isAdmin,
  catalogoEnfermedadController.delete,
);

module.exports = router;
