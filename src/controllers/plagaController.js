const Plaga = require('../models/Plaga');
const pool = require('../config/database');

// ============================================
// CREAR REGISTRO DE PLAGA
// ============================================
exports.create = async (req, res) => {
  try {
    const {
      palma_id,
      plaga,
      nombre_cientifico,
      estado_biologico,
      fecha_deteccion,
      nivel_infestacion,
      observaciones,
      latitud,
      longitud,
    } = req.body;

    if (!palma_id || !plaga) {
      return res.status(400).json({
        success: false,
        message: 'Palma ID y plaga son requeridos',
      });
    }

    const registro = await Plaga.create({
      palma_id,
      plaga,
      nombre_cientifico,
      estado_biologico,
      fecha_deteccion,
      nivel_infestacion,
      observaciones,
      latitud,
      longitud,
    });

    res.status(201).json({
      success: true,
      message: 'Registro de plaga creado exitosamente',
      data: registro,
    });
  } catch (error) {
    console.error('Error al crear registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear registro',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER TODOS LOS REGISTROS
// ============================================
exports.getAll = async (req, res) => {
  try {
    const registros = await Plaga.getAll();
    res.json({
      success: true,
      count: registros.length,
      data: registros,
    });
  } catch (error) {
    console.error('Error al obtener registros:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener registros',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER ESTADÍSTICAS
// ============================================
exports.getStats = async (req, res) => {
  try {
    const stats = await Plaga.getStats();
    res.json({
      success: true,
      data: stats,
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
// OBTENER DATOS PARA MAPA DE CALOR
// ============================================
exports.getHeatmap = async (req, res) => {
  try {
    const data = await Plaga.getHeatmapData();
    res.json({
      success: true,
      count: data.length,
      data: data,
    });
  } catch (error) {
    console.error('Error al obtener datos para mapa de calor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos para mapa de calor',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER PLAGAS CON DATOS DE LA PALMA
// ============================================
exports.getWithPalmaData = async (req, res) => {
  try {
    const query = `
      SELECT 
        p.id,
        p.palma_id,
        p.plaga,
        p.nombre_cientifico,
        p.estado_biologico,
        p.fecha_deteccion,
        p.nivel_infestacion,
        p.observaciones,
        p.latitud,
        p.longitud,
        p.created_at,
        pa.lote,
        pa.linea,
        pa.palma as palma_numero,
        pa.estado,
        pa.descarte,
        pa.codigo_estado
      FROM plagas p
      LEFT JOIN palmas pa ON p.palma_id = pa.id
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener plagas con datos de palma:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER PLAGA POR ID
// ============================================
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        p.*,
        pa.lote,
        pa.linea,
        pa.palma as palma_numero,
        pa.estado,
        pa.descarte
      FROM plagas p
      LEFT JOIN palmas pa ON p.palma_id = pa.id
      WHERE p.id = $1
    `;
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado',
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al obtener plaga:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el registro',
      error: error.message,
    });
  }
};

// ============================================
// ACTUALIZAR REGISTRO DE PLAGA
// ============================================
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      plaga,
      nombre_cientifico,
      estado_biologico,
      fecha_deteccion,
      nivel_infestacion,
      observaciones,
      latitud,
      longitud,
    } = req.body;

    const query = `
      UPDATE plagas 
      SET 
        plaga = $1,
        nombre_cientifico = $2,
        estado_biologico = $3,
        fecha_deteccion = $4,
        nivel_infestacion = $5,
        observaciones = $6,
        latitud = $7,
        longitud = $8,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $9
      RETURNING *
    `;

    const result = await pool.query(query, [
      plaga,
      nombre_cientifico,
      estado_biologico,
      fecha_deteccion,
      nivel_infestacion,
      observaciones,
      latitud,
      longitud,
      id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Registro actualizado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al actualizar plaga:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el registro',
      error: error.message,
    });
  }
};

// ============================================
// ELIMINAR REGISTRO DE PLAGA
// ============================================
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM plagas WHERE id = $1 RETURNING *';
    const result = await pool.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado',
      });
    }

    res.json({
      success: true,
      message: 'Registro eliminado exitosamente',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Error al eliminar plaga:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el registro',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER PLAGAS POR TIPO
// ============================================
exports.getByTipo = async (req, res) => {
  try {
    const { tipo } = req.params;
    const query = `
      SELECT 
        p.*,
        pa.lote,
        pa.linea,
        pa.palma as palma_numero,
        pa.estado,
        pa.descarte
      FROM plagas p
      LEFT JOIN palmas pa ON p.palma_id = pa.id
      WHERE p.plaga = $1
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query, [tipo]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener plagas por tipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los registros',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER PLAGAS POR NIVEL DE INFESTACIÓN
// ============================================
exports.getByNivel = async (req, res) => {
  try {
    const { nivel } = req.params;
    const query = `
      SELECT 
        p.*,
        pa.lote,
        pa.linea,
        pa.palma as palma_numero,
        pa.estado,
        pa.descarte
      FROM plagas p
      LEFT JOIN palmas pa ON p.palma_id = pa.id
      WHERE p.nivel_infestacion = $1
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query, [nivel]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener plagas por nivel:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los registros',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER PLAGAS POR ESTADO BIOLÓGICO
// ============================================
exports.getByEstadoBiologico = async (req, res) => {
  try {
    const { estado } = req.params;
    const query = `
      SELECT 
        p.*,
        pa.lote,
        pa.linea,
        pa.palma as palma_numero,
        pa.estado,
        pa.descarte
      FROM plagas p
      LEFT JOIN palmas pa ON p.palma_id = pa.id
      WHERE p.estado_biologico = $1
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query, [estado]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener plagas por estado biológico:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los registros',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER PLAGAS POR FECHA
// ============================================
exports.getByFecha = async (req, res) => {
  try {
    const { fecha } = req.params;
    const query = `
      SELECT 
        p.*,
        pa.lote,
        pa.linea,
        pa.palma as palma_numero,
        pa.estado,
        pa.descarte
      FROM plagas p
      LEFT JOIN palmas pa ON p.palma_id = pa.id
      WHERE DATE(p.fecha_deteccion) = $1
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query, [fecha]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener plagas por fecha:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los registros',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER PLAGAS POR PALMA
// ============================================
exports.getByPalma = async (req, res) => {
  try {
    const { palma_id } = req.params;
    const query = `
      SELECT 
        p.*,
        pa.lote,
        pa.linea,
        pa.palma as palma_numero,
        pa.estado,
        pa.descarte
      FROM plagas p
      LEFT JOIN palmas pa ON p.palma_id = pa.id
      WHERE p.palma_id = $1
      ORDER BY p.created_at DESC
    `;
    const result = await pool.query(query, [palma_id]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener plagas por palma:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los registros',
      error: error.message,
    });
  }
};
