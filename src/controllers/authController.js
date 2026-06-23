const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// ============================================
// REGISTRO DE USUARIO (SOLO ADMIN)
// ============================================
exports.register = async (req, res) => {
  try {
    // Verificar que el usuario que hace la petición es admin
    const requestingUser = await User.findById(req.userId);
    if (!requestingUser || requestingUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para registrar nuevos usuarios',
      });
    }

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array(),
      });
    }

    const { username, email, password, role = 'user' } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario ya está en uso',
      });
    }

    const existingEmail = await User.findByEmail(email);
    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: 'El email ya está registrado',
      });
    }

    const user = await User.create({ username, email, password, role });

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message,
    });
  }
};

// ============================================
// LOGIN DE USUARIO
// ============================================
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos',
      });
    }

    const user = await User.findByUsername(username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos',
      });
    }

    const isMatch = await User.comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos',
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'mi_secreto_super_seguro',
      { expiresIn: '7d' },
    );

    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER PERFIL DEL USUARIO
// ============================================
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message,
    });
  }
};

// ============================================
// VALIDAR TOKEN
// ============================================
exports.validateToken = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al validar token',
      error: error.message,
    });
  }
};

// ============================================
// OBTENER TODOS LOS USUARIOS (SOLO ADMIN)
// ============================================
exports.getAllUsers = async (req, res) => {
  try {
    const requestingUser = await User.findById(req.userId);
    if (!requestingUser || requestingUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver los usuarios',
      });
    }

    const users = await User.getAll();
    res.json({
      success: true,
      count: users.length,
      data: users,
    });
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener usuarios',
      error: error.message,
    });
  }
};

// ============================================
// ELIMINAR USUARIO (SOLO ADMIN)
// ============================================
exports.deleteUser = async (req, res) => {
  try {
    const requestingUser = await User.findById(req.userId);
    if (!requestingUser || requestingUser.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar usuarios',
      });
    }

    const { id } = req.params;

    // No permitir eliminar al propio admin
    if (parseInt(id) === req.userId) {
      return res.status(400).json({
        success: false,
        message: 'No puedes eliminar tu propio usuario',
      });
    }

    const user = await User.delete(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    res.json({
      success: true,
      message: `Usuario ${user.username} eliminado exitosamente`,
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar usuario',
      error: error.message,
    });
  }
};
