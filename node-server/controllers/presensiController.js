const { Presensi, User } = require("../models");
const { format } = require("date-fns-tz");
const { matchedData } = require("express-validator");
const multer = require("multer");
const path = require("path");
const timeZone = "Asia/Jakarta";

// === Konfigurasi Multer untuk upload bukti foto presensi ===
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // simpan ke folder "uploads/" di root backend
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Nama file: userId-timestamp.ext
    const userId = req.user?.id || "anon";
    const ext = path.extname(file.originalname) || ".jpg";
    cb(null, `${userId}-${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype && file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Hanya file gambar yang diperbolehkan!"), false);
  }
};

// instance Multer yang akan dipakai di route
const upload = multer({ storage, fileFilter });

// export supaya bisa digunakan di routes/presensi.js
exports.upload = upload;

exports.CheckIn = async (req, res) => {
  try {
    const { id: userId, nama: userName } = req.user || {};
    if (!userId) {
      return res.status(401).json({
        message: "Tidak ada identitas user. Pastikan Authorization: Bearer <token>.",
      });
    }

    // ambil lokasi (boleh kosong jika user menolak izin)
    const { latitude, longitude } = req.body || {};

    const waktuSekarang = new Date();

    // Cek apakah masih ada check-in aktif (belum check-out)
    const existingRecord = await Presensi.findOne({
      where: { userId, checkOut: null },
    });

    if (existingRecord) {
      return res
        .status(400)
        .json({ message: "Anda sudah melakukan check-in hari ini." });
    }

    // Jika ada file yang diupload oleh Multer
    let buktiFoto = null;
    if (req.file) {
      // Simpan sebagai path relatif yang bisa langsung dipakai React:
      // baseURL + buktiFoto
      buktiFoto = `/uploads/${req.file.filename}`;
    }

    // Simpan ke database
    const newRecord = await Presensi.create({
      userId,
      checkIn: waktuSekarang,
      checkOut: null,
      latitude: latitude || null,
      longitude: longitude || null,
      buktiFoto,
    });

    // ambil lagi beserta relasi user
    const withUser = await Presensi.findByPk(newRecord.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "nama", "email", "role"],
        },
      ],
    });

    const formattedData = {
      id: withUser.id,
      userId: withUser.userId,
      checkIn: format(withUser.checkIn, "yyyy-MM-dd HH:mm:ssXXX", { timeZone }),
      checkOut: null,
      latitude: withUser.latitude,
      longitude: withUser.longitude,
      buktiFoto: withUser.buktiFoto,
      user: withUser.user,
    };

    console.log(
      `CHECK-IN: User ${withUser?.user?.nama ?? userId} (${userId}) @ ${
        formattedData.checkIn
      } | foto: ${formattedData.buktiFoto ?? "-"}`
    );

    res.status(201).json({
      message: `Halo ${
        userName || "User"
      }, check-in Anda berhasil pada pukul ${format(waktuSekarang, "HH:mm:ss", {
        timeZone,
      })} WIB`,
      data: formattedData,
    });
  } catch (error) {
    console.error("CheckIn error:", error);
    res.status(500).json({
      message: "Terjadi kesalahan pada server",
      error: error.message,
    });
  }
};

exports.CheckOut = async (req, res) => {
  try {
    const { id: userId, nama: userName } = req.user || {};
    if (!userId) {
      return res.status(401).json({ message: "Tidak ada identitas user. Pastikan Authorization: Bearer <token>." });
    }

    const waktuSekarang = new Date();

    const recordToUpdate = await Presensi.findOne({
      where: { userId, checkOut: null },
      include: [{ model: User, as: "user", attributes: ["id", "nama", "email", "role"] }],
    });

    if (!recordToUpdate) {
      return res.status(400).json({
        message: "Tidak ada catatan check-in aktif untuk Anda.",
      });
    }

    recordToUpdate.checkOut = waktuSekarang;
    await recordToUpdate.save();

    const formattedData = {
      id: recordToUpdate.id,
      userId: recordToUpdate.userId,
      checkIn: format(recordToUpdate.checkIn, "yyyy-MM-dd HH:mm:ssXXX", { timeZone }),
      checkOut: format(recordToUpdate.checkOut, "yyyy-MM-dd HH:mm:ssXXX", { timeZone }),
      user: recordToUpdate.user,
    };

    console.log(
      `CHECK-OUT: User ${recordToUpdate?.user?.nama ?? userId} (${userId}) @ ${formattedData.checkOut}`
    );

    res.json({
      message: `Selamat jalan ${userName ?? "User"}, check-out Anda berhasil pada pukul ${format(
        waktuSekarang,
        "HH:mm:ss",
        { timeZone }
      )} WIB`,
      data: formattedData,
    });
  } catch (error) {
    console.error("CheckOut error:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
  }
};

exports.deletePresensi = async (req, res) => {
  try {
    const { id: userId } = req.user || {};
    if (!userId) {
      return res.status(401).json({ message: "Tidak ada identitas user. Pastikan Authorization: Bearer <token>." });
    }

    const presensiId = req.params.id;
    const recordToDelete = await Presensi.findByPk(presensiId);

    if (!recordToDelete) {
      return res.status(404).json({ message: "Data presensi tidak ditemukan." });
    }

    if (recordToDelete.userId !== userId) {
      return res.status(403).json({ message: "Anda tidak berhak menghapus data ini." });
    }

    await recordToDelete.destroy();
    res.status(200).json({ message: "Data presensi berhasil dihapus." });
  } catch (error) {
    console.error("deletePresensi error:", error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan pada server", error: error.message });
  }
};

exports.updatePresensi = async (req, res) => {
  try {
    const { id: userId, role } = req.user || {};
    if (!userId) {
      return res.status(401).json({ message: "Tidak ada identitas user. Pastikan Authorization: Bearer <token>." });
    }

    const data = matchedData(req, { includeOptionals: true });

    const { waktuCheckIn, waktuCheckOut } = data;

    if (waktuCheckIn == null && waktuCheckOut == null) {
      return res.status(400).json({ message: "Tidak ada data yang diberikan untuk diperbarui." });
    }

    const presensiId = req.params.id;
    const recordToUpdate = await Presensi.findByPk(presensiId);

    if (!recordToUpdate) {
      return res.status(404).json({ message: "Catatan presensi tidak ditemukan." });
    }

    if (recordToUpdate.userId !== userId && role !== "admin") {
      return res.status(403).json({ message: "Anda tidak berhak memperbarui data ini." });
    }

    const updates = {};
    if (waktuCheckIn)  updates.checkIn  = new Date(waktuCheckIn);
    if (waktuCheckOut) updates.checkOut = new Date(waktuCheckOut);

    await recordToUpdate.update(updates);

    const toWIB = (d) =>
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Jakarta",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
      })
        .format(new Date(d))
        .replace(", ", " ") + "+07:00";

    res.json({
      message: "Data presensi berhasil diperbarui.",
      data: {
        id: recordToUpdate.id,
        userId: recordToUpdate.userId,
        checkIn:  recordToUpdate.checkIn  ? toWIB(recordToUpdate.checkIn)  : null,
        checkOut: recordToUpdate.checkOut ? toWIB(recordToUpdate.checkOut) : null,
        createdAt: toWIB(recordToUpdate.createdAt),
        updatedAt: toWIB(recordToUpdate.updatedAt),
      },
    });
  } catch (error) {
    console.error("updatePresensi error:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server", error: error.message });
  }
};