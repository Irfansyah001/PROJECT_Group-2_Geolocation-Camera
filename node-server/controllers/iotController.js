const { SensorLog } = require("../models");

exports.testConnection = (req, res) => {
  const { message, deviceId } = req.body;
  console.log(`📡 [IOT] Pesan dari ${deviceId}: ${message}`);
  res.status(200).json({ status: "ok", reply: "Server menerima koneksi!" });
};

exports.receiveSensorData = async (req, res) => {
  try {
    // 1. Tangkap data dari body request (dikirim oleh ESP32)
    const { suhu, kelembaban, cahaya } = req.body;

    // 2. Validasi sederhana (opsional tapi disarankan)
    if (suhu === undefined || kelembaban === undefined) {
      return res.status(400).json({
        status: "error",
        message: "Data suhu atau kelembaban tidak valid",
      });
    }

    // 3. Simpan ke Database
    const newData = await SensorLog.create({
      suhu: parseFloat(suhu),
      kelembaban: parseFloat(kelembaban),
      cahaya: parseInt(cahaya) || 0, // Default 0 jika LDR tidak kirim data
    });

    // Log agar terlihat di terminal
    console.log(`💾 [SAVED] Suhu: ${suhu}°C | Lembab: ${kelembaban}% | Cahaya: ${cahaya}`);

    // 4. Beri respon sukses ke ESP32
    res.status(201).json({ status: "ok", message: "Data berhasil disimpan" });
  } catch (error) {
    console.error("Gagal menyimpan data:", error);
    res.status(500).json({ status: "error", message: error.message });
  }
};