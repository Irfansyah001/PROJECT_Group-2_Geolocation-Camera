import React, { useEffect, useState, useCallback, useRef } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import api from "../api";
import Webcam from "react-webcam";

// Komponen dari React Leaflet
import { MapContainer, TileLayer, Marker, Popup, Circle } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Import file PNG icon Leaflet
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

// Fix path icon default
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function PresensiPage() {
  const [user, setUser] = useState(null);

  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [lastRecord, setLastRecord] = useState(null);

  const [loading, setLoading] = useState(false);

  // ====== STATE UNTUK GEOLOCATION ======
  const [coords, setCoords] = useState(null); // { lat, lng, accuracy }
  const [locStatus, setLocStatus] = useState("idle"); 
  // idle | pending | ok | error | unsupported

  // ====== STATE UNTUK MANUAL COORDINATES (DEV/TESTING) ======
  const [showManualInput, setShowManualInput] = useState(false);
  const [manualLat, setManualLat] = useState("");
  const [manualLng, setManualLng] = useState("");

  // ====== STATE UNTUK GEOFENCE ======
  const [activeGeofence, setActiveGeofence] = useState(null);
  const [insideGeofence, setInsideGeofence] = useState(null);
  const [distanceFromCenter, setDistanceFromCenter] = useState(null);

  // ====== STATE UNTUK KAMERA / SELFIE ======
  const [image, setImage] = useState(null); // dataURL selfie
  const webcamRef = useRef(null);

  // Threshold akurasi GPS (meter) - lebih dari ini dianggap tidak akurat
  const GPS_ACCURACY_THRESHOLD = 100; // 100 meter
  const isGpsAccuracyPoor = coords?.accuracy > GPS_ACCURACY_THRESHOLD;

  const navigate = useNavigate();

  // ====== CEK TOKEN & SET USER ======
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const payload = jwtDecode(token);
      setUser(payload);
    } catch (err) {
      console.error("Gagal decode token di PresensiPage:", err);
      localStorage.removeItem("token");
      navigate("/login");
    }
  }, [navigate]);

  // ====== FETCH ACTIVE GEOFENCE ======
  useEffect(() => {
    const fetchGeofence = async () => {
      try {
        const res = await api.get('/api/geofences/active');
        setActiveGeofence(res.data.data);
      } catch (err) {
        console.log('No active geofence:', err.response?.data?.message);
      }
    };
    fetchGeofence();
  }, []);

  // ====== CALCULATE DISTANCE FROM GEOFENCE (CLIENT-SIDE PREVIEW) ======
  useEffect(() => {
    if (coords && activeGeofence) {
      // Simple Haversine calculation for preview
      const R = 6371000;
      const toRad = (deg) => deg * (Math.PI / 180);
      const dLat = toRad(parseFloat(activeGeofence.centerLat) - coords.lat);
      const dLng = toRad(parseFloat(activeGeofence.centerLng) - coords.lng);
      const a = 
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(coords.lat)) * Math.cos(toRad(parseFloat(activeGeofence.centerLat))) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distance = Math.round(R * c);
      
      setDistanceFromCenter(distance);
      setInsideGeofence(distance <= activeGeofence.radiusM);
    }
  }, [coords, activeGeofence]);

  // ====== FUNGSI SET MANUAL COORDINATES ======
  const setManualCoordinates = () => {
    const lat = parseFloat(manualLat);
    const lng = parseFloat(manualLng);
    
    if (isNaN(lat) || isNaN(lng)) {
      setError("Koordinat tidak valid. Masukkan angka yang benar.");
      return;
    }
    
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      setError("Koordinat di luar jangkauan valid.");
      return;
    }
    
    setCoords({
      lat: lat,
      lng: lng,
      accuracy: 10, // Manual input dianggap akurat
    });
    setLocStatus("ok");
    setShowManualInput(false);
    setError(null);
  };

  // ====== FUNGSI AMBIL LOKASI ======
  const getLocation = () => {
    if (!("geolocation" in navigator)) {
      setLocStatus("unsupported");
      setError("Geolocation tidak didukung oleh browser ini.");
      return;
    }

    setLocStatus("pending");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy, // Add accuracy
        });
        setLocStatus("ok");
      },
      (err) => {
        console.error("Geolocation error:", err);
        setLocStatus("error");
        setError("Gagal mendapatkan lokasi: " + err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0,
      }
    );
  };

  // Ambil lokasi sekali saat komponen pertama kali dimuat
  useEffect(() => {
    getLocation();
  }, []);

  // ====== FUNGSI AMBIL FOTO DARI KAMERA ======
  const capture = useCallback(() => {
    setError(null);
    if (!webcamRef.current) return;

    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) {
      setError("Gagal mengambil gambar dari kamera.");
      return;
    }

    setImage(imageSrc);
  }, []);

  // ====== HANDLE CHECK-IN (LOKASI + FOTO) ======
  const handleCheckIn = async () => {
    setError(null);
    setMessage(null);

    // Di materi asisten: kalau belum ada lokasi, jangan izinkan check-in
    if (!coords) {
      setError(
        "Lokasi belum didapatkan. Mohon izinkan akses lokasi di browser lalu coba lagi."
      );
      return;
    }

    // Pastikan sudah ada foto selfie
    if (!image) {
      setError("Silakan ambil foto selfie terlebih dahulu.");
      return;
    }

    try {
      setLoading(true);

      // Ubah dataURL (base64) → Blob
      const blob = await (await fetch(image)).blob();

      // Buat FormData untuk dikirim ke backend
      const formData = new FormData();
      formData.append("latitude", coords.lat);
      formData.append("longitude", coords.lng);
      formData.append("accuracy", coords.accuracy || 0); // Send accuracy
      formData.append("clientTimestamp", new Date().toISOString()); // Send client timestamp
      // nama field HARUS sama dengan upload.single('buktiFoto') di backend
      formData.append("buktiFoto", blob, "selfie.jpg");

      const res = await api.post(
        `/api/presensi/check-in`,
        formData
      );

      // Show detailed status feedback
      const data = res.data?.data;
      let statusMsg = res.data?.message || "Check-in berhasil.";
      if (data) {
        if (data.status === 'VALID') {
          statusMsg = `Check-in berhasil - Status: VALID. Jarak: ${data.distanceM}m (dalam geofence)`;
        } else if (data.status === 'INVALID') {
          statusMsg = `Check-in tercatat - Status: INVALID. Jarak: ${data.distanceM}m. Alasan: ${data.statusReason}`;
        } else if (data.status === 'PENDING') {
          statusMsg = `Check-in tercatat - Status: PENDING. Menunggu verifikasi admin. Jarak: ${data.distanceM}m`;
        }
      }

      setMessage(statusMsg);
      setLastRecord(data || null);
      // Optional: kalau mau reset foto setelah check-in
      // setImage(null);
    } catch (err) {
      console.error("CheckIn error:", err);
      setLastRecord(null);
      setError(
        err.response?.data?.message || "Terjadi kesalahan saat check-in."
      );
    } finally {
      setLoading(false);
    }
  };

  // ====== HANDLE CHECK-OUT ======
  const handleCheckOut = async () => {
    setError(null);
    setMessage(null);

    try {
      setLoading(true);

      const res = await api.post(
        `/api/presensi/check-out`,
        {}
      );

      setMessage(res.data?.message || "Check-out berhasil.");
      setLastRecord(res.data?.data || null);
    } catch (err) {
      console.error("CheckOut error:", err);
      setLastRecord(null);
      setError(
        err.response?.data?.message || "Terjadi kesalahan saat check-out."
      );
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-300">
          <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm">Memuat halaman presensi...</span>
        </div>
      </div>
    );
  }

  const firstName = user.nama?.split(" ")[0] || "User";

  return (
    <div className="min-h-screen text-slate-50 flex flex-col">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 sm:py-10">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400">Check-In / Check-Out</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Presensi</h1>
          <p className="text-sm text-slate-400 mt-1">
            Lakukan presensi dengan validasi GPS dan foto selfie
          </p>
        </div>

        {/* ====== PETA (OSM) DI ATAS KARTU ====== */}
        {coords && (
          <div className="mb-6 rounded-2xl overflow-hidden glass-card">
            <MapContainer
              center={[coords.lat, coords.lng]}
              zoom={16}
              style={{ height: "220px", width: "100%" }}
              className="sm:!h-[280px]"
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
              />
              {/* Geofence circle */}
              {activeGeofence && (
                <Circle
                  center={[parseFloat(activeGeofence.centerLat), parseFloat(activeGeofence.centerLng)]}
                  radius={activeGeofence.radiusM}
                  pathOptions={{
                    color: insideGeofence ? '#22c55e' : '#ef4444',
                    fillColor: insideGeofence ? '#22c55e' : '#ef4444',
                    fillOpacity: 0.2,
                    weight: 2
                  }}
                >
                  <Popup>
                    <strong>{activeGeofence.name}</strong><br/>
                    Radius: {activeGeofence.radiusM}m
                  </Popup>
                </Circle>
              )}
              <Marker position={[coords.lat, coords.lng]}>
                <Popup>Lokasi Anda saat ini.</Popup>
              </Marker>
            </MapContainer>
          </div>
        )}

        {/* Geofence status indicator */}
        {coords && activeGeofence && (
          <div className={`mb-6 p-4 rounded-xl border ${
            insideGeofence 
              ? 'bg-emerald-500/10 border-emerald-500/30' 
              : 'bg-rose-500/10 border-rose-500/30'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                insideGeofence ? 'bg-emerald-500/20' : 'bg-rose-500/20'
              }`}>
                <svg className={`w-5 h-5 ${insideGeofence ? 'text-emerald-400' : 'text-rose-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {insideGeofence ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  )}
                </svg>
              </div>
              <div>
                <p className={`font-semibold ${insideGeofence ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {insideGeofence ? 'Dalam Area Geofence' : 'Di Luar Area Geofence'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Jarak: {distanceFromCenter}m dari pusat | Radius: {activeGeofence.radiusM}m | Akurasi: {Math.round(coords.accuracy || 0)}m
                </p>
              </div>
            </div>
          </div>
        )}

        {!activeGeofence && (
          <div className="mb-6 p-4 rounded-xl border bg-amber-500/10 border-amber-500/30">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-sm text-amber-300">Tidak ada geofence aktif. Hubungi administrator untuk mengaktifkan geofence.</p>
            </div>
          </div>
        )}

        {/* Warning: GPS Accuracy Poor */}
        {isGpsAccuracyPoor && coords && (
          <div className="mb-6 p-4 rounded-xl border bg-orange-500/10 border-orange-500/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="font-semibold text-orange-300">Akurasi GPS Rendah ({Math.round(coords.accuracy)}m)</p>
                <p className="text-xs text-slate-400 mt-1">
                  Lokasi yang terdeteksi mungkin tidak akurat. Ini biasanya terjadi karena:
                </p>
                <ul className="text-xs text-slate-400 mt-1 list-disc list-inside space-y-0.5">
                  <li>Menggunakan desktop/laptop tanpa sensor GPS</li>
                  <li>Browser menggunakan IP-based geolocation</li>
                  <li>Sinyal GPS terhalang (dalam ruangan/gedung)</li>
                </ul>
                <p className="text-xs text-slate-400 mt-2">
                  <strong className="text-orange-300">Tips:</strong> Gunakan perangkat mobile (HP/tablet) untuk akurasi GPS yang lebih baik.
                </p>
                
                {/* Manual coordinate input for testing */}
                <button
                  onClick={() => setShowManualInput(!showManualInput)}
                  className="mt-3 text-xs text-orange-300 hover:text-orange-200 underline transition-colors"
                >
                  {showManualInput ? 'Sembunyikan input manual' : 'Gunakan koordinat manual (untuk testing)'}
                </button>
                
                {showManualInput && (
                  <div className="mt-3 p-3 bg-slate-800/50 rounded-lg space-y-3">
                    <p className="text-xs text-slate-300">
                      Masukkan koordinat dari Google Maps (klik kanan pada lokasi untuk copy koordinat):
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Latitude</label>
                        <input
                          type="text"
                          value={manualLat}
                          onChange={(e) => setManualLat(e.target.value)}
                          placeholder="-7.2575"
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-slate-400 block mb-1">Longitude</label>
                        <input
                          type="text"
                          value={manualLng}
                          onChange={(e) => setManualLng(e.target.value)}
                          placeholder="112.7521"
                          className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-orange-500"
                        />
                      </div>
                    </div>
                    <button
                      onClick={setManualCoordinates}
                      className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Terapkan Koordinat Manual
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Status lokasi */}
        <div className="flex items-center gap-2 text-xs text-slate-400 mb-6">
          <span>Status lokasi:</span>
          {locStatus === "pending" && (
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse"></span>
              Mengambil lokasi...
            </span>
          )}
          {locStatus === "ok" && (
            <span className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 bg-emerald-400 rounded-full"></span>
              Lokasi berhasil didapatkan (akurasi: {Math.round(coords?.accuracy || 0)}m)
            </span>
          )}
          {locStatus === "error" && (
            <span className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 bg-rose-400 rounded-full"></span>
              Gagal mendapatkan lokasi
            </span>
          )}
          {locStatus === "unsupported" && (
            <span className="text-rose-400">Browser tidak mendukung geolocation</span>
          )}
        </div>

        {/* ====== LAYOUT KARTU PRESENSI + INFO ====== */}
        <div className="grid lg:grid-cols-[1.2fr,1fr] gap-4 sm:gap-6">
          {/* Kartu kiri: aksi presensi */}
          <section className="glass-card rounded-2xl p-5 sm:p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-white">
                  Halo, {firstName}!
                </h2>
                <p className="text-xs text-slate-400">Siap untuk presensi hari ini?</p>
              </div>
            </div>

            {/* Pesan sukses / error */}
            <div className="space-y-2 text-sm mb-4">
              {message && (
                <div className="flex items-start gap-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 px-4 py-3">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-emerald-200 text-sm">{message}</span>
                </div>
              )}
              {error && (
                <div className="flex items-start gap-3 rounded-xl bg-rose-500/10 border border-rose-500/30 px-4 py-3">
                  <svg className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-rose-200 text-sm">{error}</span>
                </div>
              )}
            </div>

            {/* Kamera / Selfie */}
            <div>
              <p className="text-sm font-medium text-slate-300 mb-2">
                📸 Foto Selfie
              </p>
              <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-700/50">
                {image ? (
                  <img src={image} alt="Selfie" className="w-full aspect-video object-cover" />
                ) : (
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full aspect-video object-cover"
                    videoConstraints={{ facingMode: "user" }}
                  />
                )}
              </div>

              <div className="flex gap-3 mt-3">
                {!image ? (
                  <button
                    type="button"
                    onClick={capture}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-700/50 hover:bg-slate-700 text-sm font-medium text-white px-4 py-3 rounded-xl transition-all border border-slate-600/50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Ambil Foto
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="flex-1 flex items-center justify-center gap-2 bg-slate-700/50 hover:bg-slate-700 text-sm font-medium text-white px-4 py-3 rounded-xl transition-all border border-slate-600/50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Foto Ulang
                  </button>
                )}
              </div>
            </div>

            {/* Tombol aksi */}
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={handleCheckIn}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-xl btn-premium text-sm sm:text-base font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                )}
                Check-In
              </button>
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="flex items-center justify-center gap-2 py-3.5 sm:py-4 rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-400 hover:to-rose-500 text-sm sm:text-base font-semibold text-white shadow-lg shadow-rose-500/30 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
              >
                {loading ? (
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                )}
                Check-Out
              </button>
            </div>

            {/* Riwayat terakhir */}
            <div className="mt-5 rounded-xl bg-slate-800/50 border border-slate-700/50 p-4 text-sm">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-slate-300">Presensi Terakhir</span>
              </div>
              {lastRecord ? (
                <div className="text-xs text-slate-400 space-y-1">
                  <p className="flex items-center gap-2">
                    <span className="text-emerald-400">●</span>
                    Check-In: {new Date(lastRecord.checkIn).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className={lastRecord.checkOut ? "text-rose-400" : "text-slate-500"}>●</span>
                    Check-Out: {lastRecord.checkOut ? new Date(lastRecord.checkOut).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }) : "Belum check-out"}
                  </p>
                </div>
              ) : (
                <p className="text-xs text-slate-500">Belum ada data presensi</p>
              )}
            </div>
          </section>

          {/* Kartu kanan: penjelasan / informasi user */}
          <aside className="glass-card rounded-2xl p-5 sm:p-6 text-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-white">{user.nama}</p>
                <p className="text-xs text-slate-400">{user.email}</p>
              </div>
            </div>

            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50 text-xs mb-4">
              <span className={`w-2 h-2 rounded-full ${user.role === 'admin' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
              <span className="text-slate-300 capitalize">{user.role}</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                <p className="font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Cara Kerja
                </p>
                <ul className="space-y-1.5 text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">1.</span>
                    Ambil foto selfie sebagai bukti
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">2.</span>
                    Pastikan lokasi GPS aktif
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">3.</span>
                    Klik Check-In untuk memulai
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 mt-0.5">4.</span>
                    Klik Check-Out saat selesai
                  </li>
                </ul>
              </div>

              <div className="p-3 rounded-xl bg-slate-800/50 border border-slate-700/30">
                <p className="font-medium text-slate-300 mb-2 flex items-center gap-2">
                  <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Keamanan
                </p>
                <p className="text-slate-400">
                  Token JWT otomatis dikirim di setiap request. Lokasi & foto disimpan sebagai bukti kehadiran.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default PresensiPage;
