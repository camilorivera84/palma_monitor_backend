// backend/import-fixed.js
const fs = require('fs');
const csv = require('csv-parser');
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'palma_monitor',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

async function importCSV() {
  try {
    const filePath =
      'C:/Users/ASUS/desktop/AN_Y_DES_DE_SOFTWARE/proyecto/COORDENADAS_PALMAS.csv';
    const results = [];
    let inserted = 0;
    let errors = [];
    let rowCount = 0;

    console.log('📂 Leyendo archivo CSV...');

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(
          csv({
            separator: ',',
            headers: true,
            skipLines: 0,
          }),
        )
        .on('data', (data) => {
          if (rowCount === 0) {
            console.log('📋 Encabezados detectados:', Object.keys(data));
            console.log('📋 Primera fila:', data);
          }
          results.push(data);
          rowCount++;
        })
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`📊 ${results.length} registros encontrados`);

    for (const row of results) {
      try {
        // Mapeo CORRECTO según el orden del header:
        // _0 = Id
        // _1 = LINEA
        // _2 = PALMA
        // _3 = ESTADO
        // _4 = CODESTADO
        // _5 = LOTE
        // _6 = DESCARTE
        // _7 = LATITUD
        // _8 = LONGITUD
        // _9 = NORTE
        // _10 = ESTE

        const id = parseInt(row._0) || 0;
        const linea = String(row._1 || '').trim() || '0';
        const palma = parseInt(row._2) || 0;
        const estado = String(row._3 || '').trim() || 'DESCONOCIDO';
        const codigo_estado = parseInt(row._4) || 0;
        const lote = String(row._5 || '').trim() || 'SIN LOTE';
        const descarte = String(row._6 || '').trim() || '0';
        const latitud = parseFloat(row._7) || 0;
        const longitud = parseFloat(row._8) || 0;
        const norte = parseFloat(row._9) || 0;
        const este = parseFloat(row._10) || 0;

        // Validar datos
        if (id <= 0) {
          errors.push(`ID inválido: ${id}`);
          continue;
        }

        if (latitud === 0 || longitud === 0) {
          errors.push(`Coordenadas inválidas para ID ${id}`);
          continue;
        }

        if (inserted === 0) {
          console.log('📋 Primera fila procesada:', {
            id,
            linea,
            palma,
            estado,
            codigo_estado,
            lote,
            descarte,
            latitud,
            longitud,
            norte,
            este,
          });
        }

        const query = `
                    INSERT INTO public.palmas 
                    (id, lote, linea, palma, estado, codigo_estado, descarte, 
                     latitud, longitud, norte, este, geom)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 
                            ST_SetSRID(ST_MakePoint($9, $8), 4326))
                    ON CONFLICT (id) DO UPDATE SET
                        lote = EXCLUDED.lote,
                        linea = EXCLUDED.linea,
                        palma = EXCLUDED.palma,
                        estado = EXCLUDED.estado,
                        codigo_estado = EXCLUDED.codigo_estado,
                        descarte = EXCLUDED.descarte,
                        latitud = EXCLUDED.latitud,
                        longitud = EXCLUDED.longitud,
                        norte = EXCLUDED.norte,
                        este = EXCLUDED.este,
                        geom = EXCLUDED.geom
                `;

        await pool.query(query, [
          id,
          lote,
          linea,
          palma,
          estado,
          codigo_estado,
          descarte,
          latitud,
          longitud,
          norte,
          este,
        ]);

        inserted++;
        if (inserted % 100 === 0) {
          console.log(`✅ ${inserted} registros insertados...`);
        }
      } catch (err) {
        errors.push(`Error: ${err.message}`);
        if (errors.length <= 5) {
          console.error('❌ Error:', err.message);
        }
      }
    }

    console.log(`\n✅ Importación completada:`);
    console.log(`   Total: ${results.length} registros`);
    console.log(`   Insertados: ${inserted}`);
    console.log(`   Errores: ${errors.length}`);

    if (errors.length > 0 && errors.length <= 10) {
      console.log('\n⚠️  Errores:');
      errors.forEach((e, i) => {
        console.log(`   ${i + 1}. ${e}`);
      });
    }

    const stats = await pool.query(
      'SELECT COUNT(*) as total FROM public.palmas',
    );
    console.log(`\n📊 Total en base de datos: ${stats.rows[0].total}`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

importCSV();
