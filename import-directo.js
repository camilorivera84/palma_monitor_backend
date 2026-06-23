// backend/import-directo.js
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const pool = require('./src/config/database');

async function importCSV() {
  try {
    const filePath =
      'C:/Users/ASUS/desktop/AN_Y_DES_DE_SOFTWARE/proyecto/COORDENADAS_PALMAS.csv';
    const results = [];
    let inserted = 0;
    let errors = [];

    console.log('📂 Leyendo archivo CSV...');

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(
          csv({
            separator: ',',
            headers: false,
            skipLines: 0,
          }),
        )
        .on('data', (data) => results.push(data))
        .on('end', resolve)
        .on('error', reject);
    });

    console.log(`📊 ${results.length} registros encontrados`);

    for (const row of results) {
      try {
        const id = parseInt(row.field1) || 0;
        const lote = `LOTE ${row.field2}`;
        const linea = `LINEA ${row.field3}`;
        const palma = `PALMA ${id}`;
        const estado = row.field4;
        const codigo_estado = parseInt(row.field5) || 0;
        const descarte = row.field6;
        const latitud = parseFloat(row.field8) || 0;
        const longitud = parseFloat(row.field9) || 0;
        const norte = parseFloat(row.field10) || 0;
        const este = parseFloat(row.field11) || 0;

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
        errors.push({ row, error: err.message });
        console.error('❌ Error en fila:', err.message);
      }
    }

    console.log(`\n✅ Importación completada:`);
    console.log(`   Total: ${results.length} registros`);
    console.log(`   Insertados: ${inserted}`);
    console.log(`   Errores: ${errors.length}`);

    if (errors.length > 0) {
      console.log('\n⚠️  Primeros errores:');
      errors.slice(0, 5).forEach((e, i) => {
        console.log(`   ${i + 1}. ${e.error}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

importCSV();
