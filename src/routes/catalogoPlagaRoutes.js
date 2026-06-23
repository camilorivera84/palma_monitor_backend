const express = require('express');
const router = express.Router();
const catalogoPlagaController = require('../controllers/catalogoPlagaController');
const { verifyToken, isAdmin } = require('../middleware/auth');

// Rutas públicas (solo lectura)
router.get('/', catalogoPlagaController.getAll);
router.get('/:id', catalogoPlagaController.getById);

// Rutas protegidas (solo admin)
router.post('/', verifyToken, isAdmin, catalogoPlagaController.create);
router.put('/:id', verifyToken, isAdmin, catalogoPlagaController.update);
router.delete('/:id', verifyToken, isAdmin, catalogoPlagaController.delete);

module.exports = router;
