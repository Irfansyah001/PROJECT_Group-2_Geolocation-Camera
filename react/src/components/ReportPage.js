import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { API_BASE_URL } from "../api";

function ReportPage() {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [startDate, setStartDate] = useState(""); // yyyy-mm-dd
  const [endDate, setEndDate] = useState("");     // yyyy-mm-dd

  const navigate = useNavigate();

  // helper untuk mengubah path buktiFoto jadi URL penuh
  const getPhotoUrl = (path) => {
    if (!path) return null;
    // kalau path sudah full URL, langsung pakai
    if (path.startsWith("http://") || path.startsWith("https://")) {
      return path;
    }
    // default: gabungkan dengan API_BASE_URL, contoh: http://localhost:3308 + /uploads/xxx.jpg
    return `${API_BASE_URL}${path}`;
  };

  // Cek token + role admin lalu ambil data pertama kali
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const payload = jwtDecode(token);
      if (payload.role !== "admin") {
        // bukan admin, kembalikan ke dashboard
        navigate("/dashboard");
        return;
      }
    } catch (err) {
      console.error("Gagal decode token di /reports:", err);
      localStorage.removeItem("token");
      navigate("/login");
      return;
    }

    // pertama kali load tanpa filter
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchReports = async (opts = {}) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();

      if (opts.nama) {
        params.append("nama", opts.nama);
        params.append("filterBy", "nama");
      }

      if (opts.startDate) {
        params.append("tanggalMulai", opts.startDate);   // <─ sesuaikan nama param
      }

      if (opts.endDate) {
        params.append("tanggalSelesai", opts.endDate);   // <─ sesuaikan nama param
      }

      // kalau ada tanggal (mulai atau selesai) dan belum ada filterBy
      if (!opts.nama && (opts.startDate || opts.endDate)) {
        params.append("filterBy", "tanggal");
      }

      const queryString = params.toString() ? `?${params.toString()}` : "";

      const res = await axios.get(
        `${API_BASE_URL}/api/reports/daily${queryString}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      // backend bisa mengembalikan { data: [...] } atau langsung array
      const data = Array.isArray(res.data) ? res.data : res.data.data;
      setReports(data || []);
    } catch (err) {
      console.error("fetchReports error:", err);
      setReports([]);
      setError(
        err.response?.data?.message || "Gagal mengambil data laporan presensi."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();

    const trimmedName = searchTerm.trim();
    const hasName = !!trimmedName;
    const hasDate = !!(startDate || endDate);

    // kalau dua-duanya diisi, kita stop di frontend saja
    if (hasName && hasDate) {
      setError("Pilih salah satu: filter berdasarkan nama ATAU berdasarkan rentang tanggal.");
      setReports([]);
      return;
    }

    setError(null);

    fetchReports({
      nama: trimmedName || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-2">
          Laporan Presensi Harian
        </h1>
        <p className="text-sm text-slate-400 mb-6">
          Halaman ini hanya dapat diakses oleh{" "}
          <span className="font-semibold text-emerald-300">Admin</span>.
          Data diambil dari endpoint{" "}
          <code className="bg-slate-800 px-1 rounded">
            GET /api/reports/daily
          </code>{" "}
          dengan token JWT.
        </p>

        {/* Form pencarian + filter tanggal */}
        <form
          onSubmit={handleSearchSubmit}
          className="mb-6 grid gap-3 md:grid-cols-[2fr,1.1fr,1.1fr,auto] items-end bg-slate-900/60 border border-slate-800 rounded-xl p-4"
        >
          <div className="flex flex-col">
            <label className="text-xs font-semibold mb-1 text-slate-300">
              Cari berdasarkan nama
            </label>
            <input
              type="text"
              placeholder="Contoh: Irfansyah"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-950/70
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500
                         placeholder:text-slate-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold mb-1 text-slate-300">
              Dari tanggal
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-950/70
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-semibold mb-1 text-slate-300">
              Sampai tanggal
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-700 bg-slate-950/70
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2.5 text-sm font-semibold rounded-lg bg-emerald-500 text-slate-950
                       shadow-lg shadow-emerald-500/30 hover:bg-emerald-400
                       disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Memuat..." : "Terapkan Filter"}
          </button>
        </form>

        {/* Error message */}
        {error && (
          <p className="text-red-300 bg-red-900/40 border border-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </p>
        )}

        {/* Tabel data */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-800">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Nama
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Check-In
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Check-Out
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-300">
                  Bukti Foto
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {reports.length > 0 ? (
                reports.map((presensi) => {
                  const photoUrl = getPhotoUrl(presensi.buktiFoto);

                  return (
                    <tr key={presensi.id}>
                      <td className="px-6 py-3 whitespace-nowrap text-slate-50">
                        {presensi.user ? presensi.user.nama : "N/A"}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-slate-300">
                        {presensi.checkIn
                          ? new Date(presensi.checkIn).toLocaleString("id-ID", {
                              timeZone: "Asia/Jakarta",
                            })
                          : "-"}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-slate-300">
                        {presensi.checkOut
                          ? new Date(presensi.checkOut).toLocaleString("id-ID", {
                              timeZone: "Asia/Jakarta",
                            })
                          : "Belum Check-Out"}
                      </td>
                      <td className="px-6 py-3 whitespace-nowrap text-slate-300">
                        {photoUrl ? (
                          <button
                            type="button"
                            onClick={() => setSelectedPhoto(photoUrl)}
                            className="group inline-flex items-center gap-2"
                          >
                            <img
                              src={photoUrl}
                              alt="Bukti presensi"
                              className="h-10 w-10 rounded-md object-cover border border-slate-600 group-hover:border-emerald-400"
                            />
                            <span className="text-xs text-emerald-300 group-hover:underline">
                              Lihat
                            </span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-500">
                            Tidak ada bukti
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="4"
                    className="px-6 py-4 text-center text-slate-400 text-sm"
                  >
                    Tidak ada data yang ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Modal tampilan foto buktiFoto */}
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
            <div className="relative max-w-3xl max-h-[90vh] mx-4">
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-slate-900 text-slate-100 border border-slate-700 flex items-center justify-center hover:bg-slate-800"
              >
                ✕
              </button>
              <img
                src={selectedPhoto}
                alt="Bukti presensi penuh"
                className="max-h-[90vh] rounded-lg shadow-xl border border-slate-700"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ReportPage;
