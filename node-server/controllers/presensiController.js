const { Presensi, User, Geofence } = require("../models");
const { format } = require("date-fns-tz");
const { matchedData } = require("express-validator");
const multer = require("multer");
const path = require("path");
const { Op } = require("sequelize");
const { checkInsideGeofence, validateCoordinates, calculateSpeed } = require("../utils/geolocation");

const timeZone = "Asia/Jakarta";

// === Konfigurasi Multer untuk upload bukti foto presensi ===
const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE_MB || '5') * 1024 * 1024; // Default 5MB

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    // Generate safe filename: userId-timestamp-random.ext
    const userId = req.user?.id || "anon";
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const ext = path.extname(file.originalname).toLowerCase() || ".jpg";
    // Sanitize extension
    const safeExt = ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext) ? ext : '.jpg';
    cb(null, `${userId}-${timestamp}-${random}${safeExt}`);
  },
});

const fileFilter = (req, file, cb) => {
  // Strict MIME type validation
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  if (file.mimetype && allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Hanya file gambar (JPEG, PNG, GIF, WebP) yang diperbolehkan!"), false);
  }
};

// Multer instance with size limit
const upload = multer({ 
  storage, 
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE
  }
});

exports.upload = upload;

// === Helper: Get MAX_GPS_ACCURACY_M from env ===
const getMaxAccuracy = () => parseInt(process.env.MAX_GPS_ACCURACY_M || '100');

// === Helper: Check for anomalous speed ===
async function checkAnomalousSpeed(userId, currentLat, currentLng) {
  try {
    // Get user's last attendance
    const lastAttendance = await Presensi.findOne({
      where: { 
        userId,
        latitude: { [Op.ne]: null },
        longitude: { [Op.ne]: null }
      },
      order: [['checkIn', 'DESC']]
    });

    if (!lastAttendance) {
      return { isAnomalous: false };
    }

    const speedResult = calculateSpeed(
      { latitude: lastAttendance.latitude, longitude: lastAttendance.longitude, checkIn: lastAttendance.checkIn },
      { latitude: currentLat, longitude: currentLng, checkIn: new Date() }
    );

    return speedResult;
  } catch (error) {
    console.error("checkAnomalousSpeed error:", error);
    return { isAnomalous: false };
  }
}

exports.CheckIn = async (req, res) => {
  try {
    const { id: userId, nama: userName } = req.user || {};
    if (!userId) {
      return res.status(401).json({
        message: "Tidak ada identitas user. Pastikan Authorization: Bearer <token>.",
      });
    }

    // Get location data from request
    const { latitude, longitude, accuracy, clientTimestamp } = req.body || {};
    const serverTimestamp = new Date();

    // Cek apakah masih ada check-in aktif (belum check-out)
    const existingRecord = await Presensi.findOne({
      where: { userId, checkOut: null },
    });

    if (existingRecord) {
      return res
        .status(400)
        .json({ message: "Anda sudah melakukan check-in hari ini." });
    }

    // Validate coordinates
    const coordValidation = validateCoordinates(latitude, longitude);
    if (!coordValidation.isValid) {
      return res.status(400).json({
        message: coordValidation.error,
        code: 'INVALID_COORDINATES'
      });
    }

    // Get accuracy value
    const accuracyM = parseFloat(accuracy) || null;
    const maxAccuracy = getMaxAccuracy();

    // Prepare audit data
    let geofenceId = null;
    let distanceM = null;
    let insideGeofence = null;
    let status = 'PENDING';
    let statusReason = null;
    let suspiciousFlag = false;
    let suspiciousReason = null;

    // Get active geofence
    const activeGeofence = await Geofence.findOne({
      where: { isActive: true }
    });

    if (!activeGeofence) {
      // No active geofence - still allow check-in but mark as pending
      statusReason = "Tidak ada geofence aktif, presensi perlu verifikasi manual";
    } else {
      geofenceId = activeGeofence.id;

      // Calculate distance from geofence center
      const geoResult = checkInsideGeofence(
        coordValidation.latitude,
        coordValidation.longitude,
        parseFloat(activeGeofence.centerLat),
        parseFloat(activeGeofence.centerLng),
        activeGeofence.radiusM
      );

      distanceM = geoResult.distanceM;
      insideGeofence = geoResult.isInside;

      // Determine status based on geofence and accuracy
      if (!insideGeofence) {
        status = 'INVALID';
        statusReason = `Di luar area geofence (jarak: ${distanceM}m, radius: ${geoResult.radiusM}m)`;
      } else if (accuracyM && accuracyM > maxAccuracy) {
        status = 'PENDING';
        statusReason = `Akurasi GPS rendah (${accuracyM}m > ${maxAccuracy}m), perlu verifikasi`;
      } else {
        status = 'VALID';
        statusReason = `Di dalam area geofence (jarak: ${distanceM}m)`;
      }
    }

    // Check for anomalous speed (potential GPS spoofing)
    const speedCheck = await checkAnomalousSpeed(userId, coordValidation.latitude, coordValidation.longitude);
    if (speedCheck.isAnomalous) {
      suspiciousFlag = true;
      suspiciousReason = speedCheck.reason;
      status = 'PENDING';
      statusReason = `${statusReason || ''} - Terdeteksi anomali kecepatan`;
    }

    // Get photo if uploaded
    let buktiFoto = null;
    if (req.file) {
      buktiFoto = `/uploads/${req.file.filename}`;
    }

    // Create attendance record with all audit fields
    const newRecord = await Presensi.create({
      userId,
      checkIn: serverTimestamp,
      checkOut: null,
      latitude: coordValidation.latitude,
      longitude: coordValidation.longitude,
      buktiFoto,
      accuracyM,
      distanceM,
      insideGeofence,
      status,
      statusReason,
      geofenceId,
      serverTimestamp,
      clientTimestamp: clientTimestamp ? new Date(clientTimestamp) : null,
      suspiciousFlag,
      suspiciousReason
    });

    // Reload with associations
    const withUser = await Presensi.findByPk(newRecord.id, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "nama", "email", "role"],
        },
        {
          model: Geofence,
          as: "geofence",
          attributes: ["id", "name", "radiusM"]
        }
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
      accuracyM: withUser.accuracyM,
      distanceM: withUser.distanceM,
      insideGeofence: withUser.insideGeofence,
      status: withUser.status,
      statusReason: withUser.statusReason,
      suspiciousFlag: withUser.suspiciousFlag,
      geofence: withUser.geofence,
      user: withUser.user,
    };

    console.log(
      `CHECK-IN: User ${withUser?.user?.nama ?? userId} (${userId}) @ ${
        formattedData.checkIn
      } | Status: ${status} | Inside: ${insideGeofence} | Distance: ${distanceM}m`
    );

    // Build response message based on status
    let responseMessage = `Halo ${userName || "User"}, check-in Anda berhasil pada pukul ${format(serverTimestamp, "HH:mm:ss", { timeZone })} WIB.`;
    
    if (status === 'VALID') {
      responseMessage += ` Anda berada di dalam area geofence.`;
    } else if (status === 'INVALID') {
      responseMessage += ` PERHATIAN: Anda di luar area yang diizinkan!`;
    } else if (status === 'PENDING') {
      responseMessage += ` Presensi Anda memerlukan verifikasi admin.`;
    }

    res.status(201).json({
      message: responseMessage,
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

/**
 * Get user's own attendance history
 * GET /api/presensi/history
 */
exports.getMyHistory = async (req, res) => {
  try {
    const { id: userId } = req.user || {};
    if (!userId) {
      return res.status(401).json({ message: "Tidak ada identitas user." });
    }

    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Presensi.findAndCountAll({
      where: { userId },
      include: [
        {
          model: Geofence,
          as: "geofence",
          attributes: ["id", "name", "radiusM"]
        }
      ],
      order: [["checkIn", "DESC"]],
      limit: parseInt(limit),
      offset
    });

    res.json({
      message: "Riwayat presensi berhasil diambil",
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      },
      data: rows
    });
  } catch (error) {
    console.error("getMyHistory error:", error);
    res.status(500).json({ message: "Gagal mengambil riwayat presensi", error: error.message });
  }
};

/**
 * Get single attendance detail
 * GET /api/presensi/:id
 */
exports.getPresensiById = async (req, res) => {
  try {
    const { id: userId, role } = req.user || {};
    const presensiId = req.params.id;

    const record = await Presensi.findByPk(presensiId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "nama", "email", "role"]
        },
        {
          model: Geofence,
          as: "geofence",
          attributes: ["id", "name", "centerLat", "centerLng", "radiusM"]
        },
        {
          model: User,
          as: "verifier",
          attributes: ["id", "nama", "email"]
        }
      ]
    });

    if (!record) {
      return res.status(404).json({ message: "Data presensi tidak ditemukan" });
    }

    // Only allow user to see their own data, or admin can see all
    if (record.userId !== userId && role !== "admin") {
      return res.status(403).json({ message: "Anda tidak berhak melihat data ini" });
    }

    res.json({
      message: "Data presensi ditemukan",
      data: record
    });
  } catch (error) {
    console.error("getPresensiById error:", error);
    res.status(500).json({ message: "Gagal mengambil data presensi", error: error.message });
  }
};

/**
 * Admin: Verify/approve/reject attendance
 * PATCH /api/presensi/:id/verify
 */
exports.verifyPresensi = async (req, res) => {
  try {
    const { id: adminId } = req.user || {};
    const presensiId = req.params.id;
    const { status, note } = req.body;

    // Validate status
    const validStatuses = ['APPROVED', 'REJECTED'];
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Status harus salah satu dari: ${validStatuses.join(', ')}`
      });
    }

    const record = await Presensi.findByPk(presensiId);
    if (!record) {
      return res.status(404).json({ message: "Data presensi tidak ditemukan" });
    }

    // Update verification fields
    record.status = status;
    record.verifiedBy = adminId;
    record.verifiedAt = new Date();
    record.verificationNote = note || null;
    record.statusReason = status === 'APPROVED' 
      ? 'Disetujui oleh admin' 
      : `Ditolak oleh admin${note ? ': ' + note : ''}`;

    await record.save();

    // Reload with associations
    const updatedRecord = await Presensi.findByPk(presensiId, {
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "nama", "email"]
        },
        {
          model: User,
          as: "verifier",
          attributes: ["id", "nama", "email"]
        }
      ]
    });

    res.json({
      message: `Presensi berhasil di-${status === 'APPROVED' ? 'setujui' : 'tolak'}`,
      data: updatedRecord
    });
  } catch (error) {
    console.error("verifyPresensi error:", error);
    res.status(500).json({ message: "Gagal memverifikasi presensi", error: error.message });
  }
};

/**
 * Admin: Get all attendance records (with filters)
 * GET /api/presensi/admin/all
 */
exports.getAllPresensi = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, startDate, endDate, userId, suspicious } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const where = {};

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = parseInt(userId);
    }

    if (suspicious === 'true') {
      where.suspiciousFlag = true;
    }

    if (startDate || endDate) {
      where.checkIn = {};
      if (startDate) {
        where.checkIn[Op.gte] = new Date(`${startDate}T00:00:00.000+07:00`);
      }
      if (endDate) {
        where.checkIn[Op.lte] = new Date(`${endDate}T23:59:59.999+07:00`);
      }
    }

    const { count, rows } = await Presensi.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "nama", "email", "role"]
        },
        {
          model: Geofence,
          as: "geofence",
          attributes: ["id", "name", "radiusM"]
        },
        {
          model: User,
          as: "verifier",
          attributes: ["id", "nama", "email"]
        }
      ],
      order: [["checkIn", "DESC"]],
      limit: parseInt(limit),
      offset
    });

    res.json({
      message: "Daftar presensi berhasil diambil",
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / parseInt(limit))
      },
      data: rows
    });
  } catch (error) {
    console.error("getAllPresensi error:", error);
    res.status(500).json({ message: "Gagal mengambil daftar presensi", error: error.message });
  }
};