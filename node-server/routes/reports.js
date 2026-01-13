const express = require('express'); // Import express
const router = express.Router(); // Buat router baru
const reportController = require('../controllers/reportController'); // Import reportController
// const { addUserData, isAdmin } = require('../middleware/permisionMiddleware'); // Import middleware untuk menambahkan data user dummy dan memeriksa admin
const { authenticateToken, requireAdmin } = require('../middleware/authMiddleware'); // Import middleware untuk autentikasi JWT dan memeriksa admin
router.use(authenticateToken); // Gunakan middleware untuk autentikasi JWT
// router.get('/daily', [addUserData, isAdmin], reportController.getDailyReport); // Route untuk mendapatkan laporan harian, hanya untuk admin
router.get('/daily', requireAdmin, reportController.getDailyReport);
module.exports = router; // Ekspor router untuk digunakan di file lain