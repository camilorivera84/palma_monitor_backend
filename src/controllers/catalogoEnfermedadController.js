const CatalogoEnfermedad = require('../models/CatalogoEnfermedad');

// Obtener todas las enfermedades
exports.getAll = async (req, res) => {
  try {
    const enfermedades = await CatalogoEnfermedad.getAll();
    res.json({
      success: true,
      count: enfermedades.length,
      data: enfermedades,
    });
  } catch (error) {
    console.error('Error al obtener enfermedades:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener enfermedades',
      error: error.message,
    });
  }
};

// Obtener enfermedad por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const enfermedad = await CatalogoEnfermedad.getById(id);
    if (!enfermedad) {
      return res.status(404).json({
        success: false,
        message: 'Enfermedad no encontrada',
      });
    }
    res.json({
      success: true,
      data: enfermedad,
    });
  } catch (error) {
    console.error('Error al obtener enfermedad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener enfermedad',
      error: error.message,
    });
  }
};

// Crear nueva enfermedad (solo admin)
exports.create = async (req, res) => {
  try {
    const { nombre, descripcion = '' } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la enfermedad es requerido',
      });
    }

    const enfermedad = await CatalogoEnfermedad.create(
      nombre.trim(),
      descripcion,
    );
    res.status(201).json({
      success: true,
      message: 'Enfermedad creada exitosamente',
      data: enfermedad,
    });
  } catch (error) {
    console.error('Error al crear enfermedad:', error);
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Esta enfermedad ya existe en el catálogo',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al crear enfermedad',
      error: error.message,
    });
  }
};

// Actualizar enfermedad (solo admin)
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la enfermedad es requerido',
      });
    }

    const enfermedad = await CatalogoEnfermedad.update(
      id,
      nombre.trim(),
      descripcion || '',
    );
    if (!enfermedad) {
      return res.status(404).json({
        success: false,
        message: 'Enfermedad no encontrada',
      });
    }
    res.json({
      success: true,
      message: 'Enfermedad actualizada exitosamente',
      data: enfermedad,
    });
  } catch (error) {
    console.error('Error al actualizar enfermedad:', error);
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una enfermedad con este nombre',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al actualizar enfermedad',
      error: error.message,
    });
  }
};

// Eliminar enfermedad (solo admin)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const enfermedad = await CatalogoEnfermedad.delete(id);
    if (!enfermedad) {
      return res.status(404).json({
        success: false,
        message: 'Enfermedad no encontrada',
      });
    }
    res.json({
      success: true,
      message: `Enfermedad "${enfermedad.nombre}" eliminada exitosamente`,
      data: enfermedad,
    });
  } catch (error) {
    console.error('Error al eliminar enfermedad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar enfermedad',
      error: error.message,
    });
  }
};
