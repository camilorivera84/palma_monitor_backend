const fs = require('fs');
const csv = require('csv-parser');

async function testCSV() {
  try {
    // Ruta absoluta a tu archivo CSV
    const filePath =
      'C:/Users/ASUS/desktop/AN_Y_DES_DE_SOFTWARE/proyecto/COORDENADAS_PALMAS.csv';
    let firstRow = true;
    let rowCount = 0;

    console.log('📂 Leyendo archivo CSV...');
    console.log('📂 Ruta:', filePath);

    await new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(
          csv({
            separator: ',',
          }),
        )
        .on('data', (data) => {
          rowCount++;
          if (firstRow) {
            console.log('📋 Columnas disponibles:', Object.keys(data));
            console.log('📋 Primera fila completa:', data);
            console.log('📋 Cantidad de columnas:', Object.keys(data).length);

            // Mostrar cada columna con su valor
            console.log('\n📋 Detalle de la primera fila:');
            Object.keys(data).forEach((key, index) => {
              console.log(`   Columna ${index}: ${key} = ${data[key]}`);
            });

            firstRow = false;
          }
        })
        .on('end', () => {
          console.log(`\n✅ Total de filas: ${rowCount}`);
          resolve();
        })
        .on('error', (err) => {
          console.error('❌ Error al leer el archivo:', err.message);
          reject(err);
        });
    });

    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

testCSV();
