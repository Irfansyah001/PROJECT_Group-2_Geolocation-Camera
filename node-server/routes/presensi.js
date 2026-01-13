const express = require('express'); // Import express
const router = express.Router(); // Buat router baru
const presensiController = require('../controllers/presensiController'); // Import presensiController
// const { addUserData } = require('../middleware/permisionMiddleware'); // Import middleware untuk menambahkan data user dummy
const { authenticateToken } = require('../middleware/authMiddleware'); // Import middleware untuk autentikasi JWT
const { validatePresensiUpdate } = require('../validators/presensi'); // Import validator untuk update presensi
// router.use(addUserData); // Gunakan middleware untuk menambahkan data user dummy

router.use(authenticateToken); // Gunakan middleware untuk autentikasi JWT

// single('buktiFoto') nama field file yang dipakai di FormData React
router.post(
  '/check-in',
  presensiController.upload.single('buktiFoto'),
  presensiController.CheckIn
); // Route untuk check-in
router.post('/check-out', presensiController.CheckOut); // Route untuk check-out
router.delete('/:id', presensiController.deletePresensi); // Route untuk menghapus data presensi berdasarkan ID
router.put('/:id', validatePresensiUpdate, presensiController.updatePresensi); // Route untuk memperbarui data presensi dengan validasi

module.exports = router; // Ekspor router untuk digunakan di file lain