const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const palmaController = require('../controllers/palmaController');

// Configuración de Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `palmas-${uniqueSuffix}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  console.log('📁 Archivo:', file.originalname);
  cb(null, true);
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 },
});

// ============================================
// PRIMERO: RUTAS ESPECÍFICAS
// ============================================

// IMPORTAR CSV
router.post('/import-csv', upload.single('file'), palmaController.importCSV);

// ESTADÍSTICAS
router.get('/stats', palmaController.getStats);

// BUSCAR PALMAS
router.get('/palmas/search', palmaController.search);

// CONTAR POR ESTADO
router.get('/palmas/count/estado', palmaController.countByEstado);

// ÚLTIMAS PALMAS
router.get('/palmas/latest', palmaController.getLatest);

// PALMAS CERCANAS
router.get('/palmas/nearby', palmaController.getNearby);

// ============================================
// RUTAS CON PARÁMETROS
// ============================================

// POR LOTE
router.get('/palmas/lote/:lote', palmaController.getByLote);

// POR ESTADO
router.get('/palmas/estado/:estado', palmaController.getByEstado);

// POR ZONA
router.get('/palmas/zona/:zona', palmaController.getByZona);

// POR CÓDIGO DE ESTADO
router.get('/palmas/codigo/:codigo', palmaController.getByCodigoEstado);

// ============================================
// RUTAS CRUD
// ============================================

// OBTENER TODAS
router.get('/palmas', palmaController.getAll);

// OBTENER POR ID (AL FINAL)
router.get('/palmas/:id', palmaController.getById);

// ACTUALIZAR
router.put('/palmas/:id', palmaController.update);

// ELIMINAR
router.delete('/palmas/:id', palmaController.delete);

module.exports = router;
