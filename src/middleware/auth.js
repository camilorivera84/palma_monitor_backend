const jwt = require('jsonwebtoken');

// ============================================
// VERIFICAR TOKEN
// ============================================
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      message: 'No hay token, autorización denegada',
    });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Formato de token inválido',
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'mi_secreto_super_seguro',
    );
    req.userId = decoded.id;
    req.username = decoded.username;
    req.userRole = decoded.role || 'user';
    next();
  } catch (error) {
    console.error('Error al verificar token:', error);
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
    });
  }
};

// ============================================
// MIDDLEWARE PARA VERIFICAR SI ES ADMIN
// ============================================
exports.isAdmin = async (req, res, next) => {
  try {
    const User = require('../models/User');
    const user = await User.findById(req.userId);

    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador',
      });
    }
    next();
  } catch (error) {
    console.error('Error al verificar admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error al verificar permisos',
      error: error.message,
    });
  }
};
