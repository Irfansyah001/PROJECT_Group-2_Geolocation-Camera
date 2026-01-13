import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../api";
import Webcam from "react-webcam";

// Komponen dari React Leaflet
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
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
  const [coords, setCoords] = useState(null); // { lat, lng }
  const [locStatus, setLocStatus] = useState("idle"); 
  // idle | pending | ok | error | unsupported

  // ====== STATE UNTUK KAMERA / SELFIE ======
  const [image, setImage] = useState(null); // dataURL selfie
  const webcamRef = useRef(null);

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
        timeout: 10000,
      }
    );
  };

  // Ambil lokasi sekali saat komponen pertama kali dimuat
  useEffect(() => {
    getLocation();
  }, []);

  // Helper header Authorization
  const getAuthHeader = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return {};
    }
    return { Authorization: `Bearer ${token}` };
  };

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
      // nama field HARUS sama dengan upload.single('buktiFoto') di backend
      formData.append("buktiFoto", blob, "selfie.jpg");

      const res = await axios.post(
        `${API_BASE_URL}/api/presensi/check-in`,
        formData,
        {
          headers: getAuthHeader(), // hanya Authorization, biarkan axios set Content-Type sendiri
        }
      );

      setMessage(res.data?.message || "Check-in berhasil.");
      setLastRecord(res.data?.data || null);
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

      const res = await axios.post(
        `${API_BASE_URL}/api/presensi/check-out`,
        {},
        {
          headers: getAuthHeader(),
        }
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
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">
        <p className="text-sm text-slate-300 animate-pulse">
          Memuat halaman presensi...
        </p>
      </div>
    );
  }

  const firstName = user.nama?.split(" ")[0] || "User";

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold mb-2">Presensi</h1>
        <p className="text-sm text-slate-400 mb-4">
          Lakukan check-in dan check-out presensi yang terintegrasi dengan
          backend Node.js. Lokasi akan direkam menggunakan Geolocation API dan selfie digunakan sebagai bukti kehadiran.
        </p>

        {/* ====== PETA (OSM) DI ATAS KARTU ====== */}
        {coords && (
          <div className="mb-6 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/60">
            <MapContainer
              center={[coords.lat, coords.lng]}
              zoom={16}
              style={{ height: "280px", width: "100%" }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://osm.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[coords.lat, coords.lng]}>
                <Popup>Lokasi presensi Anda saat ini.</Popup>
              </Marker>
            </MapContainer>
          </div>
        )}

        {/* Status lokasi kecil di bawah peta */}
        <p className="text-xs text-slate-500 mb-6">
          Status lokasi:{" "}
          {locStatus === "pending" && "mengambil lokasi..."}
          {locStatus === "ok" && "lokasi berhasil didapatkan ✅"}
          {locStatus === "error" && "gagal mendapatkan lokasi ❌"}
          {locStatus === "unsupported" && "browser tidak mendukung geolocation."}
        </p>

        {/* ====== LAYOUT KARTU PRESENSI + INFO ====== */}
        <div className="grid lg:grid-cols-[1.2fr,1fr] gap-6">
          {/* Kartu kiri: aksi presensi */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl shadow-black/40 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-400">
              Presensi
            </p>
            <h2 className="mt-3 text-2xl font-black text-slate-50">
              Lakukan Presensi, {firstName}.
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Gunakan tombol di bawah untuk melakukan{" "}
              <span className="font-semibold text-emerald-300">Check-In</span>{" "}
              dan <span className="font-semibold text-rose-300">Check-Out</span>{" "}
              ke sistem presensi terintegrasi Node.js.
            </p>

            {/* Pesan sukses / error */}
            <div className="mt-4 space-y-2 text-sm">
              {message && (
                <div className="rounded-lg border border-emerald-500/70 bg-emerald-500/10 px-4 py-2 text-emerald-200">
                  {message}
                </div>
              )}
              {error && (
                <div className="rounded-lg border border-rose-500/70 bg-rose-500/10 px-4 py-2 text-rose-200">
                  {error}
                </div>
              )}
            </div>

            {/* Kamera / Selfie */}
            <div className="mt-5">
              <p className="text-xs font-semibold text-slate-300 mb-1">
                Selfie sebagai bukti kehadiran
              </p>
              <div className="my-2 border border-slate-800 rounded-xl overflow-hidden bg-black">
                {image ? (
                  <img src={image} alt="Selfie" className="w-full" />
                ) : (
                  <Webcam
                    audio={false}
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full"
                    videoConstraints={{ facingMode: "user" }}
                  />
                )}
              </div>

              <div className="flex gap-3">
                {!image ? (
                  <button
                    type="button"
                    onClick={capture}
                    className="flex-1 bg-blue-500 hover:bg-blue-400 text-sm font-semibold text-slate-50 px-4 py-2.5 rounded-lg transition-colors"
                  >
                    Ambil Foto 📸
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setImage(null)}
                    className="flex-1 bg-slate-600 hover:bg-slate-500 text-sm font-semibold text-slate-50 px-4 py-2.5 rounded-lg transition-colors"
                  >
                    Foto Ulang 🔁
                  </button>
                )}
              </div>
            </div>

            {/* Tombol aksi */}
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={handleCheckIn}
                disabled={loading}
                className="inline-flex flex-1 items-center justify-center rounded-full bg-emerald-500 px-4 py-2.5
                           text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30
                           hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Memproses..." : "Check-In"}
              </button>
              <button
                onClick={handleCheckOut}
                disabled={loading}
                className="inline-flex flex-1 items-center justify-center rounded-full bg-rose-500 px-4 py-2.5
                           text-sm font-semibold text-slate-50 shadow-lg shadow-rose-500/30
                           hover:bg-rose-400 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Memproses..." : "Check-Out"}
              </button>
            </div>

            {/* Riwayat terakhir */}
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/70 px-4 py-3 text-xs text-slate-300">
              <p className="font-semibold text-slate-200 mb-1">
                Riwayat presensi terakhir:
              </p>
              {lastRecord ? (
                <>
                  <p>
                    Check-In:{" "}
                    {new Date(lastRecord.checkIn).toLocaleString("id-ID", {
                      timeZone: "Asia/Jakarta",
                    })}
                  </p>
                  <p>
                    Check-Out:{" "}
                    {lastRecord.checkOut
                      ? new Date(lastRecord.checkOut).toLocaleString("id-ID", {
                          timeZone: "Asia/Jakarta",
                        })
                      : "Belum check-out"}
                  </p>
                </>
              ) : (
                <p>Belum ada data presensi yang tercatat pada sesi ini.</p>
              )}
            </div>
          </section>

          {/* Kartu kanan: penjelasan / informasi user */}
          <aside className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6 text-sm text-slate-300">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-400">
              Identitas Pengguna
            </p>
            <p className="mt-2 text-slate-100 font-semibold">
              {user.nama}{" "}
              <span className="text-xs text-slate-400">({user.email})</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Role:{" "}
              <span className="font-semibold capitalize">{user.role}</span>
            </p>

            <div className="mt-5 text-xs space-y-2">
              <p className="font-semibold text-slate-200 mb-1">
                Cara kerja tombol presensi:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>
                  Frontend mengirim request{" "}
                  <code className="bg-slate-800 px-1 rounded text-[11px]">
                    POST /api/presensi/check-in
                  </code>{" "}
                  atau{" "}
                  <code className="bg-slate-800 px-1 rounded text-[11px]">
                    /check-out
                  </code>
                  .
                </li>
                <li>
                  Header{" "}
                  <code className="bg-slate-800 px-1 rounded text-[11px]">
                    Authorization: Bearer &lt;token&gt;
                  </code>{" "}
                  dikirim otomatis dari browser.
                </li>
                <li>
                  Saat check-in, koordinat{" "}
                  <span className="font-mono text-[11px]">
                    latitude / longitude
                  </span>{" "}
                  ikut dikirim ke backend dan disimpan di tabel{" "}
                  <code className="bg-slate-800 px-1 rounded text-[11px]">
                    presensis
                  </code>
                  .
                </li>
                <li>
                  Saat check-in, koordinat <code>latitude / longitude</code> dan path
                  <code>buktiFoto</code> (selfie) disimpan di tabel <code>presensis</code>.
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default PresensiPage;
