const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'palma_monitor',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'tu_contraseña',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});

// Probar conexión
pool.connect((err, client, release) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.stack);
    } else {
        console.log('✅ Conectado a PostgreSQL');
        release();
    }
});

module.exports = pool;