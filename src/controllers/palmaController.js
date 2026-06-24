const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const pool = require('../config/database');

// ============================================
// IMPORTAR CSV
// ============================================
exports.importCSV = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No se subió ningún archivo',
      });
    }

    const filePath = req.file.path;
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
        const lote = `LOTE ${row.field2}` || '';
        const linea = `LINEA ${row.field3}` || '';
        const palma = parseInt(row.field0) || 0;
        const estado = row.field4 || '';
        const codigo_estado = parseInt(row.field5) || 0;
        const descarte = row.field6 || '';
        const latitud = parseFloat(row.field8) || 0;
        const longitud = parseFloat(row.field9) || 0;
        const norte = parseFloat(row.field10) || 0;
        const este = parseFloat(row.field11) || 0;

        const query = `
          INSERT INTO public.palmas 
          (id, lote, linea, palma, estado, codigo_estado, descarte, 
           latitud, longitud, norte, este)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
            este = EXCLUDED.este
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
        errors.push({
          row: row,
          error: err.message,
        });
        console.error('❌ Error en fila:', err.message);
      }
    }

    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      console.warn('No se pudo eliminar el archivo temporal:', err.message);
    }

    console.log(`✅ Importación completada: ${inserted} registros`);

    res.json({
      success: true,
      message: `Importación completada. ${inserted} registros insertados.`,
      total: results.length,
      inserted: inserted,
      errors: errors.length,
      errorDetails: errors.slice(0, 10),
    });
  } catch (error) {
    console.error('Error en importación:', error);
    res.status(500).json({
      success: false,
      message: 'Error al importar el archivo',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER TODAS LAS PALMAS
// ============================================
exports.getAll = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
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
        este
      FROM public.palmas
      ORDER BY id
    `);

    // Agregar campo geom para compatibilidad con el frontend
    const data = result.rows.map((row) => ({
      ...row,
      geom:
        row.latitud && row.longitud
          ? {
              type: 'Point',
              coordinates: [row.longitud, row.latitud],
            }
          : null,
    }));

    res.json({
      success: true,
      count: data.length,
      data: data,
    });
  } catch (error) {
    console.error('Error al obtener palmas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los datos',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER PALMA POR ID
// ============================================
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      `
      SELECT 
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
        este
      FROM public.palmas
      WHERE id = $1
      `,
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Palma no encontrada',
      });
    }

    const row = result.rows[0];
    const data = {
      ...row,
      geom:
        row.latitud && row.longitud
          ? {
              type: 'Point',
              coordinates: [row.longitud, row.latitud],
            }
          : null,
    };

    res.json({
      success: true,
      data: data,
    });
  } catch (error) {
    console.error('Error al obtener palma:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el dato',
      error: error.message,
    });
  }
};

// ============================================
// ACTUALIZAR PALMA
// ============================================
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
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
    } = req.body;

    const result = await pool.query(
      `
      UPDATE public.palmas
      SET 
        lote = $1, 
        linea = $2, 
        palma = $3, 
        estado = $4,
        codigo_estado = $5, 
        descarte = $6, 
        latitud = $7,
        longitud = $8, 
        norte = $9, 
        este = $10
      WHERE id = $11
      RETURNING *
      `,
      [
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
        id,
      ],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Palma no encontrada',
      });
    }

    res.json({
      success: true,
      message: 'Palma actualizada correctamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al actualizar palma:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el dato',
      error: error.message,
    });
  }
};

// ============================================
// ELIMINAR PALMA
// ============================================
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      'DELETE FROM public.palmas WHERE id = $1 RETURNING *',
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Palma no encontrada',
      });
    }

    res.json({
      success: true,
      message: 'Palma eliminada correctamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al eliminar palma:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el dato',
      error: error.message,
    });
  }
};

// ============================================
// BUSCAR PALMAS POR FILTROS
// ============================================
exports.search = async (req, res) => {
  try {
    const { lote, linea, estado, palma, id } = req.query;
    let query = 'SELECT * FROM public.palmas WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (id) {
      query += ` AND id = $${paramCount}`;
      params.push(parseInt(id));
      paramCount++;
    }

    if (lote) {
      query += ` AND lote ILIKE $${paramCount}`;
      params.push(`%${lote}%`);
      paramCount++;
    }

    if (linea) {
      query += ` AND linea ILIKE $${paramCount}`;
      params.push(`%${linea}%`);
      paramCount++;
    }

    if (palma) {
      query += ` AND palma ILIKE $${paramCount}`;
      params.push(`%${palma}%`);
      paramCount++;
    }

    if (estado) {
      query += ` AND estado ILIKE $${paramCount}`;
      params.push(`%${estado}%`);
      paramCount++;
    }

    query += ' ORDER BY id';

    const result = await pool.query(query, params);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error en búsqueda:', error);
    res.status(500).json({
      success: false,
      message: 'Error en la búsqueda',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER ESTADÍSTICAS
// ============================================
exports.getStats = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_palmas,
        COUNT(DISTINCT lote) as total_lotes,
        COUNT(DISTINCT linea) as total_lineas,
        COUNT(DISTINCT estado) as total_estados,
        COUNT(DISTINCT descarte) as total_descartes
      FROM public.palmas
    `);

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER PALMAS POR LOTE
// ============================================
exports.getByLote = async (req, res) => {
  try {
    const { lote } = req.params;

    const result = await pool.query(
      `
      SELECT 
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
        este
      FROM public.palmas
      WHERE lote = $1
      ORDER BY id
      `,
      [lote],
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener palmas por lote:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los datos',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER PALMAS POR ESTADO
// ============================================
exports.getByEstado = async (req, res) => {
  try {
    const { estado } = req.params;

    const result = await pool.query(
      `
      SELECT 
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
        este
      FROM public.palmas
      WHERE estado = $1
      ORDER BY id
      `,
      [estado],
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener palmas por estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los datos',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER PALMAS CERCANAS
// ============================================
exports.getNearby = async (req, res) => {
  try {
    const { lat, lng, radius = 1000 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren latitud y longitud',
      });
    }

    const latNum = parseFloat(lat);
    const lngNum = parseFloat(lng);
    const radiusNum = parseFloat(radius) / 111320; // Convertir metros a grados (aproximado)

    const result = await pool.query(
      `
      SELECT 
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
        SQRT(POW(latitud - $1, 2) + POW(longitud - $2, 2)) as distancia
      FROM public.palmas
      WHERE SQRT(POW(latitud - $1, 2) + POW(longitud - $2, 2)) <= $3
      ORDER BY distancia
      `,
      [latNum, lngNum, radiusNum],
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener palmas cercanas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los datos',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER PALMAS POR CÓDIGO DE ESTADO
// ============================================
exports.getByCodigoEstado = async (req, res) => {
  try {
    const { codigo } = req.params;

    const result = await pool.query(
      `
      SELECT 
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
        este
      FROM public.palmas
      WHERE codigo_estado = $1
      ORDER BY id
      `,
      [codigo],
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener palmas por código:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los datos',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER PALMAS POR ZONA (DESCARTE)
// ============================================
exports.getByZona = async (req, res) => {
  try {
    const { zona } = req.params;

    const result = await pool.query(
      `
      SELECT 
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
        este
      FROM public.palmas
      WHERE descarte = $1
      ORDER BY id
      `,
      [zona],
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener palmas por zona:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los datos',
      error: error.message,
    });
  }
};

// ============================================
// CONTAR PALMAS POR ESTADO
// ============================================
exports.countByEstado = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        estado,
        COUNT(*) as total
      FROM public.palmas
      GROUP BY estado
      ORDER BY total DESC
    `);

    res.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al contar palmas por estado:', error);
    res.status(500).json({
      success: false,
      message: 'Error al contar los datos',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER ÚLTIMAS PALMAS REGISTRADAS
// ============================================
exports.getLatest = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const result = await pool.query(
      `
      SELECT 
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
        este
      FROM public.palmas
      ORDER BY id DESC
      LIMIT $1
      `,
      [limit],
    );

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener últimas palmas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los datos',
      error: error.message,
    });
  }
};
