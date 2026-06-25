require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const palmaRoutes = require('./routes/palmaRoutes');
const authRoutes = require('./routes/authRoutes');
const enfermedadRoutes = require('./routes/enfermedadRoutes');
const plagaRoutes = require('./routes/plagaRoutes');
const catalogoEnfermedadRoutes = require('./routes/catalogoEnfermedadRoutes');
const catalogoPlagaRoutes = require('./routes/catalogoPlagaRoutes');
const User = require('./models/User');
const Enfermedad = require('./models/Enfermedad');
const Plaga = require('./models/Plaga');
const pool = require('./config/database');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================================
// MIDDLEWARES
// ============================================

// Configuración CORS mejorada para permitir peticiones desde el frontend
const corsOptions = {
  origin: [
    'https://palma-monitor-frontend.pages.dev',
    'https://*.palma-monitor-frontend.pages.dev',
    'https://5b498b48.palma-monitor-frontend.pages.dev',
    'http://localhost:5173',
    'http://localhost:3000',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// ============================================
// MANEJO EXPLÍCITO DE SOLICITUDES OPTIONS
// ============================================
app.options('*', cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos (uploads)
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ============================================
// CREAR TABLAS AL INICIAR
// ============================================
(async () => {
  try {
    await User.createTable();
    await Enfermedad.createTable();
    await Plaga.createTable();
    console.log('✅ Todas las tablas creadas/verificadas');
  } catch (error) {
    console.error('❌ Error al crear tablas:', error.message);
  }
})();

// ============================================
// RUTAS
// ============================================

// Ruta temporal para inicializar la base de datos
app.get('/init-db', async (req, res) => {
  try {
    const initDb = require('./initDb');
    await initDb();
    res.json({
      success: true,
      message: 'Base de datos inicializada correctamente',
    });
  } catch (error) {
    console.error('❌ Error en /init-db:', error);
    res.status(500).json({
      success: false,
      message: 'Error al inicializar la base de datos',
      error: error.message,
    });
  }
});

// ============================================
// RUTA TEMPORAL PARA AGREGAR COLUMNAS FALTANTES
// ============================================
app.get('/add-column', async (req, res) => {
  try {
    // Columnas que tu código puede estar buscando
    // pero que no existen en tu tabla
    const columnsToAdd = [
      { name: 'sur', type: 'VARCHAR(20)' },
      { name: 'oeste', type: 'VARCHAR(20)' },
      { name: 'zona', type: 'VARCHAR(50)' },
      { name: 'sector', type: 'VARCHAR(50)' },
      { name: 'bloque', type: 'VARCHAR(50)' },
      { name: 'estado_actual', type: 'VARCHAR(20)' },
      { name: 'fecha_estado', type: 'DATE' },
      { name: 'observaciones', type: 'TEXT' },
      { name: 'anio_siembra', type: 'INTEGER' },
      { name: 'productividad', type: 'DECIMAL(10,2)' },
      { name: 'fecha_ultima_visita', type: 'DATE' },
      { name: 'geom', type: 'TEXT' },
    ];

    const results = [];

    for (const col of columnsToAdd) {
      try {
        // Verificar si la columna existe
        const checkColumn = await pool.query(
          `
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'palmas' AND column_name = $1
        `,
          [col.name],
        );

        if (checkColumn.rows.length === 0) {
          // Agregar la columna
          await pool.query(`
            ALTER TABLE palmas 
            ADD COLUMN ${col.name} ${col.type};
          `);
          results.push(`✅ Columna ${col.name} agregada correctamente`);
        } else {
          results.push(`ℹ️ La columna ${col.name} ya existe`);
        }
      } catch (err) {
        results.push(`❌ Error al agregar ${col.name}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      message: 'Columnas verificadas/agregadas correctamente',
      results,
    });
  } catch (error) {
    console.error('❌ Error en /add-column:', error);
    res.status(500).json({
      success: false,
      message: 'Error al agregar las columnas',
      error: error.message,
    });
  }
});

// ============================================
// RUTA TEMPORAL PARA VER ESTRUCTURA DE TABLA
// ============================================
app.get('/table-structure', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'palmas'
      ORDER BY ordinal_position
    `);
    res.json({
      success: true,
      columns: result.rows,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// Autenticación
app.use('/api/auth', authRoutes);

// Palmas
app.use('/api', palmaRoutes);

// Enfermedades (reportes)
app.use('/api/enfermedades', enfermedadRoutes);

// Plagas (reportes)
app.use('/api/plagas', plagaRoutes);

// Catálogo de Enfermedades (solo admin)
app.use('/api/catalogo/enfermedades', catalogoEnfermedadRoutes);

// Catálogo de Plagas (solo admin)
app.use('/api/catalogo/plagas', catalogoPlagaRoutes);

// ============================================
// RUTAS PÚBLICAS
// ============================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Servidor Palma Monitor funcionando correctamente',
    database: process.env.DB_NAME,
    timestamp: new Date().toISOString(),
  });
});

// Ruta raíz con información de endpoints
app.get('/', (req, res) => {
  res.json({
    message: 'Bienvenido a la API de Palma Monitor',
    version: '1.0.0',
    endpoints: {
      auth: {
        register: 'POST /api/auth/register (solo admin)',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile (requiere token)',
        validate: 'GET /api/auth/validate (requiere token)',
        users: 'GET /api/auth/users (solo admin)',
        deleteUser: 'DELETE /api/auth/users/:id (solo admin)',
      },
      palmas: {
        all: 'GET /api/palmas',
        byId: 'GET /api/palmas/:id',
        search: 'GET /api/palmas/search',
        stats: 'GET /api/stats',
        import: 'POST /api/import-csv',
        byLote: 'GET /api/palmas/lote/:lote',
        byEstado: 'GET /api/palmas/estado/:estado',
        nearby: 'GET /api/palmas/nearby',
        byZona: 'GET /api/palmas/zona/:zona',
        byCodigo: 'GET /api/palmas/codigo/:codigo',
        countByEstado: 'GET /api/palmas/count/estado',
        latest: 'GET /api/palmas/latest',
      },
      enfermedades: {
        create: 'POST /api/enfermedades (requiere token)',
        all: 'GET /api/enfermedades (requiere token)',
        stats: 'GET /api/enfermedades/stats (requiere token)',
        heatmap: 'GET /api/enfermedades/heatmap (requiere token)',
        withPalma: 'GET /api/enfermedades/with-palma (requiere token)',
        byId: 'GET /api/enfermedades/:id (requiere token)',
        update: 'PUT /api/enfermedades/:id (requiere token)',
        delete: 'DELETE /api/enfermedades/:id (requiere token)',
        byTipo: 'GET /api/enfermedades/tipo/:tipo (requiere token)',
        bySeveridad:
          'GET /api/enfermedades/severidad/:severidad (requiere token)',
        byFecha: 'GET /api/enfermedades/fecha/:fecha (requiere token)',
        byPalma: 'GET /api/enfermedades/palma/:palma_id (requiere token)',
      },
      plagas: {
        create: 'POST /api/plagas (requiere token)',
        all: 'GET /api/plagas (requiere token)',
        stats: 'GET /api/plagas/stats (requiere token)',
        heatmap: 'GET /api/plagas/heatmap (requiere token)',
        withPalma: 'GET /api/plagas/with-palma (requiere token)',
        byId: 'GET /api/plagas/:id (requiere token)',
        update: 'PUT /api/plagas/:id (requiere token)',
        delete: 'DELETE /api/plagas/:id (requiere token)',
        byTipo: 'GET /api/plagas/tipo/:tipo (requiere token)',
        byNivel: 'GET /api/plagas/nivel/:nivel (requiere token)',
        byEstadoBiologico:
          'GET /api/plagas/estado-biologico/:estado (requiere token)',
        byFecha: 'GET /api/plagas/fecha/:fecha (requiere token)',
        byPalma: 'GET /api/plagas/palma/:palma_id (requiere token)',
      },
      catalogo: {
        enfermedades: {
          all: 'GET /api/catalogo/enfermedades',
          byId: 'GET /api/catalogo/enfermedades/:id',
          create: 'POST /api/catalogo/enfermedades (solo admin)',
          update: 'PUT /api/catalogo/enfermedades/:id (solo admin)',
          delete: 'DELETE /api/catalogo/enfermedades/:id (solo admin)',
        },
        plagas: {
          all: 'GET /api/catalogo/plagas',
          byId: 'GET /api/catalogo/plagas/:id',
          create: 'POST /api/catalogo/plagas (solo admin)',
          update: 'PUT /api/catalogo/plagas/:id (solo admin)',
          delete: 'DELETE /api/catalogo/plagas/:id (solo admin)',
        },
      },
    },
  });
});

// ============================================
// MANEJO DE ERRORES
// ============================================

// Error 404 - Ruta no encontrada
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
});

// Error general
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    error: err.message,
  });
});

// ============================================
// INICIAR SERVIDOR
// ============================================
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}`);
  console.log(`📊 Base de datos: ${process.env.DB_NAME}`);
  console.log(`🌐 Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log(`\n📋 Endpoints disponibles:`);
  console.log(`\n  🔐 Autenticación:`);
  console.log(`    POST /api/auth/login`);
  console.log(`    POST /api/auth/register (solo admin)`);
  console.log(`    GET  /api/auth/profile`);
  console.log(`    GET  /api/auth/users (solo admin)`);
  console.log(`    DELETE /api/auth/users/:id (solo admin)`);
  console.log(`\n  🌴 Palmas:`);
  console.log(`    GET  /api/palmas`);
  console.log(`    GET  /api/palmas/:id`);
  console.log(`    GET  /api/palmas/search`);
  console.log(`    GET  /api/stats`);
  console.log(`    POST /api/import-csv`);
  console.log(`\n  🦠 Enfermedades (reportes):`);
  console.log(`    POST /api/enfermedades`);
  console.log(`    GET  /api/enfermedades`);
  console.log(`    GET  /api/enfermedades/stats`);
  console.log(`    GET  /api/enfermedades/heatmap`);
  console.log(`    GET  /api/enfermedades/with-palma`);
  console.log(`\n  🐛 Plagas (reportes):`);
  console.log(`    POST /api/plagas`);
  console.log(`    GET  /api/plagas`);
  console.log(`    GET  /api/plagas/stats`);
  console.log(`    GET  /api/plagas/heatmap`);
  console.log(`    GET  /api/plagas/with-palma`);
  console.log(`\n  📚 Catálogos (solo admin):`);
  console.log(`    GET  /api/catalogo/enfermedades`);
  console.log(`    POST /api/catalogo/enfermedades`);
  console.log(`    PUT  /api/catalogo/enfermedades/:id`);
  console.log(`    DELETE /api/catalogo/enfermedades/:id`);
  console.log(`    GET  /api/catalogo/plagas`);
  console.log(`    POST /api/catalogo/plagas`);
  console.log(`    PUT  /api/catalogo/plagas/:id`);
  console.log(`    DELETE /api/catalogo/plagas/:id`);
  console.log(`\n  📌 Ruta de inicialización:`);
  console.log(
    `    GET /init-db (inicializa la base de datos y crea usuario admin)`,
  );
  console.log(`  📌 Ruta de mantenimiento:`);
  console.log(
    `    GET /add-column (agrega columnas faltantes a la tabla palmas)`,
  );
  console.log(`  📌 Ruta de diagnóstico:`);
  console.log(
    `    GET /table-structure (muestra la estructura de la tabla palmas)`,
  );
  console.log(`\n✅ Servidor listo para usar\n`);
});

module.exports = app;
