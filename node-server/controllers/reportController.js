const { Presensi, User } = require("../models"); // Import model Presensi
const { Op } = require("sequelize"); // Import Op untuk operator Sequelize

const JKT_TZ = "Asia/Jakarta"; // Zona waktu Jakarta
const JKT_OFFSET = "+07:00"; // Offset waktu Jakarta

exports.getDailyReport = async (req, res) => { // Fungsi untuk mendapatkan laporan harian
  try {
    const { filterBy, nama, tanggalMulai, tanggalSelesai } = req.query; // Ambil parameter query
    const where = {}; // Objek untuk kondisi where di Sequelize

    // --- MODE EXPLISIT ---
    if (filterBy === "nama") { // Filter berdasarkan nama
      if (!nama) return res.status(400).json({ message: "Parameter nama wajib untuk filterBy=nama" }); // Validasi nama
      where['$user.nama$'] = { [Op.like]: `%${nama}%` }; // Gunakan operator like untuk pencarian nama

    } else if (filterBy === "tanggal") { // Filter berdasarkan tanggal
      if (!(tanggalMulai || tanggalSelesai)) { // Validasi tanggal
        return res.status(400).json({ message: "tanggalMulai/tanggalSelesai wajib untuk filterBy=tanggal" }); // Validasi tanggal
      }
      const startStr = tanggalMulai || tanggalSelesai; // Ambil tanggal mulai atau selesai
      const endStr   = tanggalSelesai || tanggalMulai; // Ambil tanggal selesai atau mulai

      // Buat rentang harian di WIB (UTC+7) tanpa perlu date-fns-tz
      const start = new Date(`${startStr}T00:00:00.000${JKT_OFFSET}`); // Awal hari
      const end   = new Date(`${endStr}T23:59:59.999${JKT_OFFSET}`); // Akhir hari
      if (isNaN(start) || isNaN(end)) { // Validasi format tanggal
        return res.status(400).json({ message: "Format tanggal harus YYYY-MM-DD" }); // Validasi tanggal
      }
      if (start > end) return res.status(400).json({ message: "tanggalMulai harus <= tanggalSelesai" }); // Validasi urutan tanggal

      // Pilih satu kolom acuan, mis. checkIn
      where.checkIn = { [Op.between]: [start, end] }; // Gunakan operator between untuk rentang tanggal

    // --- MODE IMPLISIT (tanpa filterBy) ---
    } else { // Jika tidak ada filterBy
      const hasName = !!nama; // Cek apakah ada parameter nama
      const hasDate = !!(tanggalMulai || tanggalSelesai); // Cek apakah ada parameter tanggalMulai atau tanggalSelesai

      if (hasName && hasDate) { // Jika kedua parameter ada
        return res.status(400).json({ // Validasi agar tidak digabung
          message: "Gunakan filterBy=nama atau filterBy=tanggal agar filter terpisah (tidak digabung)." // Pesan validasi
        });
      }
      if (hasName) { // Jika ada parameter nama
        where['$user.nama$'] = { [Op.like]: `%${nama}%` }; // Gunakan operator like untuk pencarian nama
      } else if (hasDate) { // Jika ada parameter tanggalMulai atau tanggalSelesai
        const startStr = tanggalMulai || tanggalSelesai; // Ambil tanggal mulai atau selesai
        const endStr   = tanggalSelesai || tanggalMulai; // Ambil tanggal selesai atau mulai
        const start = new Date(`${startStr}T00:00:00.000${JKT_OFFSET}`); // Awal hari
        const end   = new Date(`${endStr}T23:59:59.999${JKT_OFFSET}`); // Akhir hari
        if (start > end) return res.status(400).json({ message: "tanggalMulai harus <= tanggalSelesai" }); // Validasi urutan tanggal
        where.checkIn = { [Op.between]: [start, end] }; // Gunakan operator between untuk rentang tanggal
      }
    }

    const records = await Presensi.findAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "nama", "email", "role"],
        },
      ],
      order: [["checkIn", "ASC"]],
    });


    res.json({ // Kirim respons JSON
      mode: filterBy || (nama ? "nama" : (tanggalMulai || tanggalSelesai) ? "tanggal" : "none"), // Mode filter yang digunakan
      reportDate: new Date().toLocaleDateString("en-CA", { timeZone: JKT_TZ }), // Tanggal laporan dalam format YYYY-MM-DD
      filters: { nama, tanggalMulai, tanggalSelesai }, // Parameter filter yang digunakan
      count: records.length, // Jumlah data yang ditemukan
      data: records, // Data presensi yang ditemukan
    });
  } catch (error) {
    res.status(500).json({ message: "Gagal mengambil laporan", error: error.message }); // Kirim respons error jika terjadi kesalahan
  }
};
