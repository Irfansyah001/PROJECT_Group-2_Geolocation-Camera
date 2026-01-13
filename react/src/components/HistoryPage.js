// src/components/HistoryPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api, { API_BASE_URL } from '../api';

function HistoryPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Check auth
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const payload = jwtDecode(token);
      setUser(payload);
    } catch (err) {
      console.error('Token decode failed:', err);
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  // Fetch history
  const fetchHistory = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/api/presensi/history?page=${page}&limit=10`);
      setHistory(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengambil riwayat presensi');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchHistory(1);
    }
  }, [user, fetchHistory]);

  // Get status badge
  const getStatusBadge = (status) => {
    const styles = {
      VALID: 'bg-emerald-500/20 text-emerald-400',
      INVALID: 'bg-rose-500/20 text-rose-400',
      PENDING: 'bg-amber-500/20 text-amber-400',
      APPROVED: 'bg-emerald-500/20 text-emerald-400',
      REJECTED: 'bg-rose-500/20 text-rose-400'
    };
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${styles[status] || 'bg-slate-500/20 text-slate-400'}`}>
        {status}
      </span>
    );
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-300">
          <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm">Memuat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-50">
      <main className="max-w-5xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 animate-fade-in">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-3">
              <div className="w-2 h-2 bg-cyan-400 rounded-full" />
              <span className="text-xs font-semibold text-cyan-400">Riwayat Presensi</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Riwayat Anda</h1>
            <p className="text-sm text-slate-400 mt-1">
              Daftar presensi beserta status validasinya
            </p>
          </div>
          <Link
            to="/presensi"
            className="btn-premium text-white px-5 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 sm:w-auto"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Presensi Baru
          </Link>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 flex items-center gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* History - Mobile Cards + Desktop Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {loading ? (
            <div className="p-8 flex items-center justify-center gap-3 text-slate-400">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Memuat...
            </div>
          ) : history.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <p className="text-slate-400">Belum ada riwayat presensi</p>
              <Link to="/presensi" className="text-emerald-400 hover:text-emerald-300 text-sm mt-2 inline-block">
                Lakukan presensi pertama →
              </Link>
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="sm:hidden divide-y divide-slate-700/50">
                {history.map((item) => (
                  <div key={item.id} className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-white">
                        {new Date(item.checkIn).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta', dateStyle: 'medium' })}
                      </span>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.status)}
                        {item.suspiciousFlag && (
                          <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center" title="Mencurigakan">
                            <svg className="w-3 h-3 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500">Check In</span>
                        <p className="text-emerald-400 font-medium">
                          {new Date(item.checkIn).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', timeStyle: 'short' })}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Check Out</span>
                        <p className={item.checkOut ? 'text-rose-400 font-medium' : 'text-amber-400'}>
                          {item.checkOut 
                            ? new Date(item.checkOut).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', timeStyle: 'short' })
                            : 'Belum'
                          }
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Jarak</span>
                        <p className={item.insideGeofence ? 'text-emerald-400' : 'text-rose-400'}>
                          {item.distanceM !== null ? `${item.distanceM}m` : '-'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Foto</span>
                        <p>
                          {item.buktiFoto ? (
                            <a href={`${API_BASE_URL}${item.buktiFoto}`} target="_blank" rel="noopener noreferrer" className="text-cyan-400">
                              Lihat Foto
                            </a>
                          ) : <span className="text-slate-500">-</span>}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800/30">
                    <tr>
                      <th className="text-left p-4 font-medium text-slate-300">Tanggal</th>
                      <th className="text-left p-4 font-medium text-slate-300">Check In</th>
                      <th className="text-left p-4 font-medium text-slate-300">Check Out</th>
                      <th className="text-left p-4 font-medium text-slate-300">Status</th>
                      <th className="text-left p-4 font-medium text-slate-300">Jarak</th>
                      <th className="text-left p-4 font-medium text-slate-300">Lokasi</th>
                      <th className="text-left p-4 font-medium text-slate-300">Foto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {history.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                        <td className="p-4">
                          {new Date(item.checkIn).toLocaleDateString('id-ID', { timeZone: 'Asia/Jakarta' })}
                        </td>
                        <td className="p-4 text-emerald-400">
                          {new Date(item.checkIn).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', timeStyle: 'short' })}
                        </td>
                        <td className="p-4">
                          {item.checkOut 
                            ? <span className="text-rose-400">{new Date(item.checkOut).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', timeStyle: 'short' })}</span>
                            : <span className="text-amber-400">Belum</span>
                          }
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(item.status)}
                            {item.suspiciousFlag && (
                              <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center" title="Mencurigakan">
                                <svg className="w-3 h-3 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-4">
                          {item.distanceM !== null ? (
                            <span className={item.insideGeofence ? 'text-emerald-400' : 'text-rose-400'}>
                              {item.distanceM}m
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-4">
                          {item.insideGeofence !== null ? (
                            item.insideGeofence 
                              ? <span className="text-emerald-400 text-xs">Dalam Area</span>
                              : <span className="text-rose-400 text-xs">Luar Area</span>
                          ) : <span className="text-slate-500">-</span>}
                        </td>
                        <td className="p-4">
                          {item.buktiFoto ? (
                            <a
                              href={`${API_BASE_URL}${item.buktiFoto}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Lihat
                            </a>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="p-4 border-t border-slate-700/50 bg-slate-800/20 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p className="text-xs text-slate-400 order-2 sm:order-1">
                    Halaman {pagination.page} dari {pagination.totalPages} ({pagination.total} data)
                  </p>
                  <div className="flex gap-2 order-1 sm:order-2">
                    <button
                      onClick={() => fetchHistory(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-target flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                      Prev
                    </button>
                    <span className="px-4 py-2 text-sm bg-slate-800/50 rounded-lg text-slate-300">
                      {pagination.page} / {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => fetchHistory(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-target flex items-center gap-1"
                    >
                      Next
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Status Legend */}
        <div className="mt-6 glass-card rounded-2xl p-5 animate-fade-in">
          <h3 className="font-semibold text-sm text-white mb-4 flex items-center gap-2">
            <svg className="w-4 h-4 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Keterangan Status
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-sm">
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/30">
              {getStatusBadge('VALID')}
              <span className="text-slate-400 text-xs">Dalam geofence, GPS baik</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/30">
              {getStatusBadge('INVALID')}
              <span className="text-slate-400 text-xs">Di luar area geofence</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/30">
              {getStatusBadge('PENDING')}
              <span className="text-slate-400 text-xs">Menunggu verifikasi</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/30">
              {getStatusBadge('APPROVED')}
              <span className="text-slate-400 text-xs">Disetujui admin</span>
            </div>
            <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800/30">
              {getStatusBadge('REJECTED')}
              <span className="text-slate-400 text-xs">Ditolak admin</span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default HistoryPage;
