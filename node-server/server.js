const express = require('express'); // Import express
const cors = require('cors'); // Import cors untuk mengizinkan request dari browser
const app = express(); // Buat aplikasi express
const port = 3001; // Tentukan port server
const morgan = require('morgan'); // Import morgan untuk logging request
const path = require('path'); // Import path untuk manipulasi path file
const iotRoutes = require('./routes/iot'); // Import routes IoT

const presensiRoutes = require('./routes/presensi'); // Import routes presensi
const reportRoutes = require('./routes/reports'); // Import routes laporan

const authRoutes = require('./routes/auth'); // Import routes autentikasi

const cookieParser = require('cookie-parser');

app.use(cors()); // izinkan request dari browser (menghindari CORS)
app.use(cookieParser()); // untuk parsing cookie
app.use(express.json()); // untuk parsing application/json
app.use(morgan('dev')); // logging request ke console

// Middleware untuk serve file statis (foto presensi)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use((req, res, next) => { // Middleware logging sederhana
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`); // Log waktu, metode, dan URL request
  next(); // Lanjut ke middleware atau route handler berikutnya
});

app.get('/', (req, res) => { // Route dasar
  res.send('Selamat datang di API Presensi Karyawan!'); // Kirim pesan sambutan
});

app.use('/api/presensi', presensiRoutes); // Gunakan routes presensi
app.use('/api/reports', reportRoutes); // Gunakan routes laporan
app.use('/api/auth', authRoutes); // Gunakan routes autentikasi
app.use('/api/iot', iotRoutes); // Gunakan routes IoT

app.listen(port, '0.0.0.0', () => { 
  console.log(`Express server running on port ${port}`);
});
