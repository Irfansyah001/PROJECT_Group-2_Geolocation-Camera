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
    <div className="min-h-screen text-slate-50 flex flex-col">
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full mb-3">
            <div className="w-2 h-2 bg-amber-400 rounded-full" />
            <span className="text-xs font-semibold text-amber-400">Admin Only</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Laporan Presensi Harian
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Lihat dan filter data presensi harian seluruh mahasiswa
          </p>
        </div>

        {/* Form pencarian + filter tanggal */}
        <form
          onSubmit={handleSearchSubmit}
          className="mb-6 glass-card rounded-2xl p-4 sm:p-5"
        >
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="sm:col-span-2 lg:col-span-1">
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Cari berdasarkan nama
              </label>
              <input
                type="text"
                placeholder="Nama Mahasiswa"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-premium w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Dari tanggal
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="input-premium w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">
                Sampai tanggal
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="input-premium w-full text-sm"
              />
            </div>

            <div className="flex items-end">
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-premium text-white px-4 py-2.5 rounded-xl font-semibold text-sm touch-target disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Memuat...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    Terapkan Filter
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Error message */}
        {error && (
          <div className="mb-4 flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Tabel data */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Mobile Cards View */}
          <div className="sm:hidden divide-y divide-slate-700/50">
            {reports.length > 0 ? (
              reports.map((presensi) => {
                const photoUrl = getPhotoUrl(presensi.buktiFoto);
                return (
                  <div key={presensi.id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-white">{presensi.user ? presensi.user.nama : "N/A"}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {presensi.checkIn
                            ? new Date(presensi.checkIn).toLocaleDateString("id-ID", { timeZone: "Asia/Jakarta" })
                            : "-"}
                        </p>
                      </div>
                      {photoUrl && (
                        <button
                          type="button"
                          onClick={() => setSelectedPhoto(photoUrl)}
                          className="flex-shrink-0"
                        >
                          <img
                            src={photoUrl}
                            alt="Bukti presensi"
                            className="h-12 w-12 rounded-lg object-cover border-2 border-slate-700 hover:border-emerald-400 transition-colors"
                          />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500">Check In</span>
                        <p className="text-emerald-400 font-medium">
                          {presensi.checkIn
                            ? new Date(presensi.checkIn).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", timeStyle: "short" })
                            : "-"}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Check Out</span>
                        <p className={presensi.checkOut ? "text-rose-400 font-medium" : "text-amber-400"}>
                          {presensi.checkOut
                            ? new Date(presensi.checkOut).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta", timeStyle: "short" })
                            : "Belum"}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-slate-400">Tidak ada data yang ditemukan</p>
              </div>
            )}
          </div>

          {/* Desktop Table View */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-800/30">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-slate-300">
                    Nama
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-slate-300">
                    Check-In
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-slate-300">
                    Check-Out
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium uppercase tracking-wide text-slate-300">
                    Bukti Foto
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {reports.length > 0 ? (
                  reports.map((presensi) => {
                    const photoUrl = getPhotoUrl(presensi.buktiFoto);

                    return (
                      <tr key={presensi.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-white font-medium">
                          {presensi.user ? presensi.user.nama : "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-emerald-400">
                          {presensi.checkIn
                            ? new Date(presensi.checkIn).toLocaleString("id-ID", {
                                timeZone: "Asia/Jakarta",
                              })
                            : "-"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {presensi.checkOut
                            ? <span className="text-rose-400">{new Date(presensi.checkOut).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" })}</span>
                            : <span className="text-amber-400">Belum Check-Out</span>}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {photoUrl ? (
                            <button
                              type="button"
                              onClick={() => setSelectedPhoto(photoUrl)}
                              className="group inline-flex items-center gap-2"
                            >
                              <img
                                src={photoUrl}
                                alt="Bukti presensi"
                                className="h-10 w-10 rounded-lg object-cover border-2 border-slate-700 group-hover:border-emerald-400 transition-colors"
                              />
                              <span className="text-xs text-cyan-400 group-hover:text-cyan-300">
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
                      className="px-6 py-12 text-center text-slate-400"
                    >
                      Tidak ada data yang ditemukan.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Modal tampilan foto buktiFoto */}
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm animate-fade-in">
            <div className="relative max-w-3xl max-h-[90vh] mx-4">
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="absolute -top-3 -right-3 h-10 w-10 rounded-full bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 flex items-center justify-center transition-colors z-10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <img
                src={selectedPhoto}
                alt="Bukti presensi penuh"
                className="max-h-[85vh] rounded-2xl shadow-2xl border border-slate-700"
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default ReportPage;
