const Enfermedad = require('../models/Enfermedad');
const pool = require('../config/database');

// ============================================
// CREAR REGISTRO DE ENFERMEDAD
// ============================================
exports.create = async (req, res) => {
  try {
    const {
      palma_id,
      enfermedad,
      fecha_deteccion,
      severidad,
      observaciones,
      latitud,
      longitud,
    } = req.body;

    if (!palma_id || !enfermedad) {
      return res.status(400).json({
        success: false,
        message: 'Palma ID y enfermedad son requeridos',
      });
    }

    const registro = await Enfermedad.create({
      palma_id,
      enfermedad,
      fecha_deteccion,
      severidad,
      observaciones,
      latitud,
      longitud,
    });

    res.status(201).json({
      success: true,
      message: 'Registro de enfermedad creado exitosamente',
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
    const query = `
      SELECT 
        e.*,
        p.lote,
        p.linea,
        p.palma as palma_numero,
        p.estado,
        p.descarte
      FROM enfermedades e
      LEFT JOIN palmas p ON e.palma_id = p.id
      ORDER BY e.created_at DESC
    `;
    const result = await pool.query(query);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
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
    const query = `
      SELECT 
        enfermedad,
        COUNT(*) as total,
        COUNT(DISTINCT palma_id) as palmas_afectadas,
        MAX(fecha_deteccion) as ultimo_registro
      FROM enfermedades
      GROUP BY enfermedad
      ORDER BY total DESC
    `;
    const result = await pool.query(query);
    res.json({
      success: true,
      data: result.rows,
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
    const data = await Enfermedad.getHeatmapData();
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
// OBTENER ENFERMEDADES CON DATOS DE LA PALMA
// ============================================
exports.getWithPalmaData = async (req, res) => {
  try {
    const query = `
      SELECT 
        e.id,
        e.palma_id,
        e.enfermedad,
        e.fecha_deteccion,
        e.severidad,
        e.observaciones,
        e.latitud,
        e.longitud,
        e.created_at,
        p.lote,
        p.linea,
        p.palma as palma_numero,
        p.estado,
        p.descarte,
        p.codigo_estado
      FROM enfermedades e
      LEFT JOIN palmas p ON e.palma_id = p.id
      ORDER BY e.created_at DESC
    `;
    const result = await pool.query(query);
    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener enfermedades con datos de palma:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER ENFERMEDAD POR ID
// ============================================
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        e.*,
        p.lote,
        p.linea,
        p.palma as palma_numero,
        p.estado,
        p.descarte
      FROM enfermedades e
      LEFT JOIN palmas p ON e.palma_id = p.id
      WHERE e.id = $1
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
    console.error('Error al obtener enfermedad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el registro',
      error: error.message,
    });
  }
};

// ============================================
// ACTUALIZAR REGISTRO DE ENFERMEDAD
// ============================================
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      enfermedad,
      fecha_deteccion,
      severidad,
      observaciones,
      latitud,
      longitud,
    } = req.body;

    const query = `
      UPDATE enfermedades 
      SET 
        enfermedad = $1,
        fecha_deteccion = $2,
        severidad = $3,
        observaciones = $4,
        latitud = $5,
        longitud = $6,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $7
      RETURNING *
    `;

    const result = await pool.query(query, [
      enfermedad,
      fecha_deteccion,
      severidad,
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
    console.error('Error al actualizar enfermedad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el registro',
      error: error.message,
    });
  }
};

// ============================================
// ELIMINAR REGISTRO DE ENFERMEDAD
// ============================================
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    const query = 'DELETE FROM enfermedades WHERE id = $1 RETURNING *';
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
    console.error('Error al eliminar enfermedad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar el registro',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER ENFERMEDADES POR TIPO
// ============================================
exports.getByTipo = async (req, res) => {
  try {
    const { tipo } = req.params;
    const query = `
      SELECT 
        e.*,
        p.lote,
        p.linea,
        p.palma as palma_numero,
        p.estado,
        p.descarte
      FROM enfermedades e
      LEFT JOIN palmas p ON e.palma_id = p.id
      WHERE e.enfermedad = $1
      ORDER BY e.created_at DESC
    `;
    const result = await pool.query(query, [tipo]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener enfermedades por tipo:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los registros',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER ENFERMEDADES POR SEVERIDAD
// ============================================
exports.getBySeveridad = async (req, res) => {
  try {
    const { severidad } = req.params;
    const query = `
      SELECT 
        e.*,
        p.lote,
        p.linea,
        p.palma as palma_numero,
        p.estado,
        p.descarte
      FROM enfermedades e
      LEFT JOIN palmas p ON e.palma_id = p.id
      WHERE e.severidad = $1
      ORDER BY e.created_at DESC
    `;
    const result = await pool.query(query, [severidad]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener enfermedades por severidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los registros',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER ENFERMEDADES POR FECHA
// ============================================
exports.getByFecha = async (req, res) => {
  try {
    const { fecha } = req.params;
    const query = `
      SELECT 
        e.*,
        p.lote,
        p.linea,
        p.palma as palma_numero,
        p.estado,
        p.descarte
      FROM enfermedades e
      LEFT JOIN palmas p ON e.palma_id = p.id
      WHERE DATE(e.fecha_deteccion) = $1
      ORDER BY e.created_at DESC
    `;
    const result = await pool.query(query, [fecha]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener enfermedades por fecha:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los registros',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER ENFERMEDADES POR PALMA
// ============================================
exports.getByPalma = async (req, res) => {
  try {
    const { palma_id } = req.params;
    const query = `
      SELECT 
        e.*,
        p.lote,
        p.linea,
        p.palma as palma_numero,
        p.estado,
        p.descarte
      FROM enfermedades e
      LEFT JOIN palmas p ON e.palma_id = p.id
      WHERE e.palma_id = $1
      ORDER BY e.created_at DESC
    `;
    const result = await pool.query(query, [palma_id]);

    res.json({
      success: true,
      count: result.rows.length,
      data: result.rows,
    });
  } catch (error) {
    console.error('Error al obtener enfermedades por palma:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener los registros',
      error: error.message,
    });
  }
};
