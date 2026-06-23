const express = require('express');
const router = express.Router();
const plagaController = require('../controllers/plagaController');
const { verifyToken } = require('../middleware/auth');

// ============================================
// TODAS LAS RUTAS REQUIEREN AUTENTICACIÓN
// ============================================
router.use(verifyToken);

// ============================================
// PRIMERO: RUTAS ESPECÍFICAS (SIN PARÁMETROS)
// ============================================

// OBTENER ESTADÍSTICAS
router.get('/stats', plagaController.getStats);

// OBTENER DATOS PARA MAPA DE CALOR
router.get('/heatmap', plagaController.getHeatmap);

// OBTENER PLAGAS CON DATOS DE PALMA
router.get('/with-palma', plagaController.getWithPalmaData);

// ============================================
// LUEGO: RUTAS CON PARÁMETROS
// ============================================

// OBTENER PLAGAS POR TIPO
router.get('/tipo/:tipo', plagaController.getByTipo);

// OBTENER PLAGAS POR NIVEL
router.get('/nivel/:nivel', plagaController.getByNivel);

// OBTENER PLAGAS POR ESTADO BIOLÓGICO
router.get('/estado-biologico/:estado', plagaController.getByEstadoBiologico);

// OBTENER PLAGAS POR FECHA
router.get('/fecha/:fecha', plagaController.getByFecha);

// OBTENER PLAGAS POR PALMA
router.get('/palma/:palma_id', plagaController.getByPalma);

// ============================================
// FINAL: RUTAS CRUD CON ID
// ============================================

// CREAR REGISTRO
router.post('/', plagaController.create);

// OBTENER TODOS LOS REGISTROS
router.get('/', plagaController.getAll);

// OBTENER POR ID (DEBE IR AL FINAL)
router.get('/:id', plagaController.getById);

// ACTUALIZAR
router.put('/:id', plagaController.update);

// ELIMINAR
router.delete('/:id', plagaController.delete);

module.exports = router;
