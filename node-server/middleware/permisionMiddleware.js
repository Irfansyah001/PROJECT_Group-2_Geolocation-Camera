exports.addUserData = (req, res, next) => { // Middleware untuk menambahkan data user dummy
    console.log('Middleware: Menambahkan data user dummy...'); // Log untuk debugging
    req.user = { // Menambahkan properti user ke objek req
        id: 123, // ID unik untuk user
        nama: 'User Karyawan', // Nama user
        role: 'admin' // role bisa 'karyawan' atau 'admin'
    };
    next(); // Lanjut ke middleware atau route handler berikutnya
};

exports.isAdmin = (req, res, next) => { // Middleware untuk memeriksa apakah user adalah admin
    if (req.user && req.user.role === 'admin') { // Cek apakah user ada dan role-nya admin
        console.log('Middleware: Izin admin diberikan.'); // Log untuk debugging
        next(); // Lanjut ke middleware atau route handler berikutnya
    } else { // Jika bukan admin
        console.log('Middleware: Gagal! Pengguna bukan admin.'); // Log untuk debugging
        return res.status(403).json({ message: 'Akses ditolak: Hanya untuk admin.' }); // Kirim respons akses ditolak
    }
};