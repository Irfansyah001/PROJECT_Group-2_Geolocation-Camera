const { User } = require('../models');
const bcrypt = require('bcryptjs'); // Untuk hashing password
const jwt = require('jsonwebtoken');
const { Op } = require('sequelize');

// JWT Secret from environment variable (required)
const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables!');
  console.error('Please create a .env file with JWT_SECRET=your-secret-key');
  process.exit(1);
}

// Register publik - HANYA untuk mahasiswa
exports.register = async (req, res) => {
    try {
        const { nama, email, password } = req.body;

        if (!nama || !email || !password) {
            return res.status(400).json({ message: "Nama, email, dan password harus diisi" });
        }

        // Registrasi publik SELALU membuat akun mahasiswa
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            nama,
            email,
            password: hashedPassword,
            role: 'mahasiswa' // Selalu mahasiswa untuk registrasi publik
        });

        res.status(201).json({
            message: "Registrasi berhasil",
            data: { id: newUser.id, nama: newUser.nama, email: newUser.email, role: newUser.role }
        });

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: "Email sudah terdaftar" });
        }
        res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
    }
};

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await User.findOne({ where: { email }});

        if (!user) {
            return res.status(404).json({ message: "Email tidak ditemukan" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(401).json({ message: "Password salah" });
        }

        const payload = {
            id : user.id,
            nama: user.nama,
            email: user.email,
            role: user.role
        };

        const token = jwt.sign(payload, JWT_SECRET, {
            expiresIn: '1h'
        });

        res.json({
            message: "Login berhasil",
            token: token
        });

    } catch (error) {
        return res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
    }
};

// =============================================
// USER MANAGEMENT (Admin Only)
// =============================================

// Get all users (Admin only)
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'nama', 'email', 'role', 'createdAt', 'updatedAt'],
            order: [['createdAt', 'DESC']]
        });

        res.json({
            message: "Daftar user berhasil diambil",
            data: users
        });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
    }
};

// Get single user by ID (Admin only)
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User.findByPk(id, {
            attributes: ['id', 'nama', 'email', 'role', 'createdAt', 'updatedAt']
        });

        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        res.json({
            message: "User berhasil diambil",
            data: user
        });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
    }
};

// Create user by Admin - bisa buat admin atau mahasiswa
exports.createUserByAdmin = async (req, res) => {
    try {
        const { nama, email, password, role } = req.body;

        if (!nama || !email || !password) {
            return res.status(400).json({ message: "Nama, email, dan password harus diisi" });
        }

        if (role && !['mahasiswa', 'admin'].includes(role)) {
            return res.status(400).json({ message: "Role tidak valid. Harus 'mahasiswa' atau 'admin'" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = await User.create({
            nama,
            email,
            password: hashedPassword,
            role: role || 'mahasiswa'
        });

        res.status(201).json({
            message: `User ${role || 'mahasiswa'} berhasil dibuat`,
            data: { id: newUser.id, nama: newUser.nama, email: newUser.email, role: newUser.role }
        });

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: "Email sudah terdaftar" });
        }
        res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
    }
};

// Update user (Admin only)
exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nama, email, password, role } = req.body;
        const adminId = req.user.id;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        // Jika mengubah role admin lain, tidak diizinkan
        if (user.role === 'admin' && user.id !== adminId && role && role !== user.role) {
            return res.status(403).json({ message: "Tidak dapat mengubah role admin lain" });
        }

        // Prepare update data
        const updateData = {};
        if (nama) updateData.nama = nama;
        if (email) updateData.email = email;
        if (role && ['mahasiswa', 'admin'].includes(role)) updateData.role = role;
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        await user.update(updateData);

        res.json({
            message: "User berhasil diupdate",
            data: { id: user.id, nama: user.nama, email: user.email, role: user.role }
        });

    } catch (error) {
        if (error.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({ message: "Email sudah terdaftar" });
        }
        res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
    }
};

// Delete user (Admin only) - TIDAK BISA hapus admin
exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const adminId = req.user.id;

        const user = await User.findByPk(id);

        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        // Tidak bisa hapus diri sendiri melalui endpoint ini
        if (user.id === adminId) {
            return res.status(403).json({ 
                message: "Tidak dapat menghapus akun sendiri melalui menu ini. Gunakan fitur 'Hapus Akun Saya'." 
            });
        }

        // Tidak bisa hapus admin lain
        if (user.role === 'admin') {
            return res.status(403).json({ 
                message: "Tidak dapat menghapus akun admin. Admin hanya bisa menghapus akun mahasiswa." 
            });
        }

        await user.destroy();

        res.json({
            message: "User berhasil dihapus",
            data: { id: user.id, nama: user.nama, email: user.email }
        });

    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
    }
};

// Delete own account (untuk admin hapus akun sendiri)
exports.deleteOwnAccount = async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ message: "Password diperlukan untuk konfirmasi" });
        }

        const user = await User.findByPk(userId);

        if (!user) {
            return res.status(404).json({ message: "User tidak ditemukan" });
        }

        // Verifikasi password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Password salah" });
        }

        await user.destroy();

        res.json({
            message: "Akun Anda berhasil dihapus",
            data: { id: user.id, nama: user.nama, email: user.email }
        });

    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
    }
};

// Get user statistics (Admin only)
exports.getUserStats = async (req, res) => {
    try {
        const totalUsers = await User.count();
        const totalMahasiswa = await User.count({ where: { role: 'mahasiswa' } });
        const totalAdmin = await User.count({ where: { role: 'admin' } });

        res.json({
            message: "Statistik user berhasil diambil",
            data: {
                total: totalUsers,
                mahasiswa: totalMahasiswa,
                admin: totalAdmin
            }
        });
    } catch (error) {
        res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
    }
};