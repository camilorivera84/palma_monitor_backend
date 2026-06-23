const CatalogoPlaga = require('../models/CatalogoPlaga');

// Obtener todas las plagas
exports.getAll = async (req, res) => {
  try {
    const plagas = await CatalogoPlaga.getAll();
    res.json({
      success: true,
      count: plagas.length,
      data: plagas,
    });
  } catch (error) {
    console.error('Error al obtener plagas:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener plagas',
      error: error.message,
    });
  }
};

// Obtener plaga por ID
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const plaga = await CatalogoPlaga.getById(id);
    if (!plaga) {
      return res.status(404).json({
        success: false,
        message: 'Plaga no encontrada',
      });
    }
    res.json({
      success: true,
      data: plaga,
    });
  } catch (error) {
    console.error('Error al obtener plaga:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener plaga',
      error: error.message,
    });
  }
};

// Crear nueva plaga (solo admin)
exports.create = async (req, res) => {
  try {
    const { nombre, nombre_cientifico = '' } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la plaga es requerido',
      });
    }

    const plaga = await CatalogoPlaga.create(
      nombre.trim(),
      nombre_cientifico.trim(),
    );
    res.status(201).json({
      success: true,
      message: 'Plaga creada exitosamente',
      data: plaga,
    });
  } catch (error) {
    console.error('Error al crear plaga:', error);
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Esta plaga ya existe en el catálogo',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al crear plaga',
      error: error.message,
    });
  }
};

// Actualizar plaga (solo admin)
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, nombre_cientifico } = req.body;

    if (!nombre || nombre.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'El nombre de la plaga es requerido',
      });
    }

    const plaga = await CatalogoPlaga.update(
      id,
      nombre.trim(),
      nombre_cientifico || '',
    );
    if (!plaga) {
      return res.status(404).json({
        success: false,
        message: 'Plaga no encontrada',
      });
    }
    res.json({
      success: true,
      message: 'Plaga actualizada exitosamente',
      data: plaga,
    });
  } catch (error) {
    console.error('Error al actualizar plaga:', error);
    if (error.code === '23505') {
      return res.status(400).json({
        success: false,
        message: 'Ya existe una plaga con este nombre',
      });
    }
    res.status(500).json({
      success: false,
      message: 'Error al actualizar plaga',
      error: error.message,
    });
  }
};

// Eliminar plaga (solo admin)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const plaga = await CatalogoPlaga.delete(id);
    if (!plaga) {
      return res.status(404).json({
        success: false,
        message: 'Plaga no encontrada',
      });
    }
    res.json({
      success: true,
      message: `Plaga "${plaga.nombre}" eliminada exitosamente`,
      data: plaga,
    });
  } catch (error) {
    console.error('Error al eliminar plaga:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar plaga',
      error: error.message,
    });
  }
};
