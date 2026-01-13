const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');

// ===== Public Routes =====
// Register - hanya bisa buat akun mahasiswa
router.post('/register', authController.register);

// Login
router.post('/login', authController.login);

// ===== Authenticated Routes =====
// Delete own account (semua user bisa hapus akun sendiri)
router.delete('/me', authenticateToken, authController.deleteOwnAccount);

// ===== Admin Only Routes - User Management =====
// Get all users
router.get('/users', authenticateToken, requireAdmin, authController.getAllUsers);

// Get user statistics
router.get('/users/stats', authenticateToken, requireAdmin, authController.getUserStats);

// Get single user
router.get('/users/:id', authenticateToken, requireAdmin, authController.getUserById);

// Create user (admin bisa buat admin/mahasiswa)
router.post('/users', authenticateToken, requireAdmin, authController.createUserByAdmin);

// Update user
router.put('/users/:id', authenticateToken, requireAdmin, authController.updateUser);

// Delete user (hanya bisa hapus mahasiswa)
router.delete('/users/:id', authenticateToken, requireAdmin, authController.deleteUser);

module.exports = router;