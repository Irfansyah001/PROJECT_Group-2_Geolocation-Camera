const express = require('express');
const router = express.Router();
const presensiController = require('../controllers/presensiController');
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware');
const { validatePresensiUpdate } = require('../validators/presensi');

// All routes require authentication
router.use(authenticateToken);

// ===== Student Routes =====
// Get user's own history
router.get('/history', presensiController.getMyHistory);

// Check-in with photo and location
router.post(
  '/check-in',
  presensiController.upload.single('buktiFoto'),
  presensiController.CheckIn
);

// Check-out
router.post('/check-out', presensiController.CheckOut);

// Get single presensi by ID (user can only see their own, admin can see all)
router.get('/:id', presensiController.getPresensiById);

// Delete presensi (user can only delete their own)
router.delete('/:id', presensiController.deletePresensi);

// Update presensi
router.put('/:id', validatePresensiUpdate, presensiController.updatePresensi);

// ===== Admin Routes =====
// Get all attendance records (admin only)
router.get('/admin/all', requireAdmin, presensiController.getAllPresensi);

// Verify/approve/reject attendance (admin only)
router.patch('/:id/verify', requireAdmin, presensiController.verifyPresensi);

module.exports = router;