const express = require('express');
const router = express.Router();
const enfermedadController = require('../controllers/enfermedadController');
const { verifyToken } = require('../middleware/auth');

// ============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ============================================
router.use(verifyToken);

// ============================================
// PRIMERO: RUTAS ESPECÍFICAS (SIN PARÁMETROS)
// ============================================

// OBTENER ESTADÍSTICAS
router.get('/stats', enfermedadController.getStats);

// OBTENER DATOS PARA MAPA DE CALOR
router.get('/heatmap', enfermedadController.getHeatmap);

// OBTENER ENFERMEDADES CON DATOS DE PALMA
router.get('/with-palma', enfermedadController.getWithPalmaData);

// ============================================
// LUEGO: RUTAS CON PARÁMETROS
// ============================================

// OBTENER ENFERMEDADES POR TIPO
router.get('/tipo/:tipo', enfermedadController.getByTipo);

// OBTENER ENFERMEDADES POR SEVERIDAD
router.get('/severidad/:severidad', enfermedadController.getBySeveridad);

// OBTENER ENFERMEDADES POR FECHA
router.get('/fecha/:fecha', enfermedadController.getByFecha);

// OBTENER ENFERMEDADES POR PALMA
router.get('/palma/:palma_id', enfermedadController.getByPalma);

// ============================================
// FINAL: RUTAS CRUD CON ID
// ============================================

// CREAR REGISTRO
router.post('/', enfermedadController.create);

// OBTENER TODOS LOS REGISTROS
router.get('/', enfermedadController.getAll);

// OBTENER POR ID (DEBE IR AL FINAL)
router.get('/:id', enfermedadController.getById);

// ACTUALIZAR
router.put('/:id', enfermedadController.update);

// ELIMINAR
router.delete('/:id', enfermedadController.delete);

module.exports = router;
