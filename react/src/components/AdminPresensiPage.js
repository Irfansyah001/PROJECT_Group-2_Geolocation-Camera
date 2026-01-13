// src/components/AdminPresensiPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api, { API_BASE_URL } from '../api';

function AdminPresensiPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, totalPages: 1, total: 0 });

  // Filters
  const [filters, setFilters] = useState({
    status: '',
    startDate: '',
    endDate: '',
    suspicious: false
  });

  // Verification modal
  const [verifyModal, setVerifyModal] = useState({ show: false, record: null });
  const [verifyData, setVerifyData] = useState({ status: 'APPROVED', note: '' });

  // Photo modal
  const [photoModal, setPhotoModal] = useState({ show: false, url: null });

  // Check auth and admin role
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const payload = jwtDecode(token);
      if (payload.role !== 'admin') {
        navigate('/dashboard');
        return;
      }
      setUser(payload);
    } catch (err) {
      console.error('Token decode failed:', err);
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  // Fetch records
  const fetchRecords = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 20);

      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.suspicious) params.append('suspicious', 'true');

      const res = await api.get(`/api/presensi/admin/all?${params.toString()}`);
      setRecords(res.data.data || []);
      setPagination(res.data.pagination || { page: 1, totalPages: 1, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengambil data presensi');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (user) {
      fetchRecords(1);
    }
  }, [user, fetchRecords]);

  // Handle verification
  const handleVerify = async () => {
    if (!verifyModal.record) return;

    try {
      setLoading(true);
      await api.patch(`/api/presensi/${verifyModal.record.id}/verify`, {
        status: verifyData.status,
        note: verifyData.note
      });
      setSuccess(`Presensi berhasil di-${verifyData.status === 'APPROVED' ? 'setujui' : 'tolak'}`);
      setVerifyModal({ show: false, record: null });
      setVerifyData({ status: 'APPROVED', note: '' });
      fetchRecords(pagination.page);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal memverifikasi presensi');
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  const applyFilters = (e) => {
    e.preventDefault();
    fetchRecords(1);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({ status: '', startDate: '', endDate: '', suspicious: false });
  };

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
      <main className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
        {/* Header */}
        <div className="mb-6 animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full mb-3">
            <div className="w-2 h-2 bg-purple-400 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-purple-400">Monitoring Real-time</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">Monitoring Presensi</h1>
          <p className="text-sm text-slate-400 mt-1">
            Lihat dan verifikasi semua data presensi mahasiswa
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 flex items-center justify-between gap-3 p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {error}
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-rose-300 p-1 rounded-lg hover:bg-rose-500/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        {success && (
          <div className="mb-4 flex items-center justify-between gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-sm animate-fade-in">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {success}
            </div>
            <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-300 p-1 rounded-lg hover:bg-emerald-500/20">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {/* Filters */}
        <form onSubmit={applyFilters} className="mb-6 glass-card rounded-2xl p-4 sm:p-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
                className="input-premium w-full text-sm"
              >
                <option value="">Semua</option>
                <option value="VALID">VALID</option>
                <option value="INVALID">INVALID</option>
                <option value="PENDING">PENDING</option>
                <option value="APPROVED">APPROVED</option>
                <option value="REJECTED">REJECTED</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Dari Tanggal</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="input-premium w-full text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1.5">Sampai Tanggal</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="input-premium w-full text-sm"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/50 w-full">
                <input
                  type="checkbox"
                  checked={filters.suspicious}
                  onChange={(e) => setFilters(prev => ({ ...prev, suspicious: e.target.checked }))}
                  className="rounded border-slate-600 bg-slate-700 text-emerald-500 focus:ring-emerald-500/50"
                />
                <span className="text-xs sm:text-sm text-slate-300">Mencurigakan</span>
              </label>
            </div>
            <div className="flex items-end gap-2 col-span-2 sm:col-span-1">
              <button
                type="submit"
                className="flex-1 btn-premium text-white px-4 py-2.5 rounded-xl font-semibold text-sm touch-target"
              >
                Filter
              </button>
              <button
                type="button"
                onClick={resetFilters}
                className="px-4 py-2.5 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm touch-target transition-colors"
              >
                Reset
              </button>
            </div>
          </div>
        </form>

        {/* Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {loading && records.length === 0 ? (
            <div className="p-8 flex items-center justify-center gap-3 text-slate-400">
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Memuat data...
            </div>
          ) : records.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-slate-800/50 flex items-center justify-center">
                <svg className="w-8 h-8 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-400">Tidak ada data presensi yang sesuai filter</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="lg:hidden divide-y divide-slate-700/50">
                {records.map((item) => (
                  <div key={item.id} className={`p-4 ${item.suspiciousFlag ? 'bg-rose-500/5' : ''}`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-medium text-white">{item.user?.nama || 'Unknown'}</p>
                        <p className="text-xs text-slate-400">{item.user?.email}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(item.status)}
                        {item.suspiciousFlag && (
                          <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center" title={item.suspiciousReason || 'Mencurigakan'}>
                            <svg className="w-3 h-3 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                      <div>
                        <span className="text-slate-500">Check In</span>
                        <p className="text-emerald-400 font-medium">
                          {new Date(item.checkIn).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', timeStyle: 'short' })}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Jarak</span>
                        <p className={item.insideGeofence ? 'text-emerald-400' : 'text-rose-400'}>
                          {item.distanceM !== null ? `${item.distanceM}m` : '-'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Akurasi</span>
                        <p className="text-slate-300">{item.accuracyM !== null ? `${item.accuracyM}m` : '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex gap-2">
                        {item.buktiFoto && (
                          <button
                            onClick={() => setPhotoModal({ show: true, url: `${API_BASE_URL}${item.buktiFoto}` })}
                            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            Foto
                          </button>
                        )}
                      </div>
                      {(item.status === 'PENDING' || item.status === 'INVALID') && (
                        <button
                          onClick={() => {
                            setVerifyModal({ show: true, record: item });
                            setVerifyData({ status: 'APPROVED', note: '' });
                          }}
                          className="btn-premium text-white text-xs px-3 py-2 rounded-lg font-medium touch-target"
                        >
                          Verifikasi
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-800/30">
                    <tr>
                      <th className="text-left p-4 font-medium text-slate-300">User</th>
                      <th className="text-left p-4 font-medium text-slate-300">Check In</th>
                      <th className="text-left p-4 font-medium text-slate-300">Status</th>
                      <th className="text-left p-4 font-medium text-slate-300">Jarak</th>
                      <th className="text-left p-4 font-medium text-slate-300">Akurasi</th>
                      <th className="text-left p-4 font-medium text-slate-300">Geofence</th>
                      <th className="text-left p-4 font-medium text-slate-300">Foto</th>
                      <th className="text-left p-4 font-medium text-slate-300">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {records.map((item) => (
                      <tr key={item.id} className={`hover:bg-slate-800/20 transition-colors ${item.suspiciousFlag ? 'bg-rose-500/5' : ''}`}>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-white">{item.user?.nama || 'Unknown'}</p>
                            <p className="text-xs text-slate-400">{item.user?.email}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          {new Date(item.checkIn).toLocaleString('id-ID', { 
                            timeZone: 'Asia/Jakarta',
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            {getStatusBadge(item.status)}
                            {item.suspiciousFlag && (
                              <span className="w-5 h-5 rounded-full bg-rose-500/20 flex items-center justify-center" title={item.suspiciousReason || 'Mencurigakan'}>
                                <svg className="w-3 h-3 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                </svg>
                              </span>
                            )}
                          </div>
                          {item.statusReason && (
                            <p className="text-xs text-slate-500 mt-1 max-w-[200px] truncate" title={item.statusReason}>
                              {item.statusReason}
                            </p>
                          )}
                        </td>
                        <td className="p-4">
                          {item.distanceM !== null ? (
                            <span className={item.insideGeofence ? 'text-emerald-400' : 'text-rose-400'}>
                              {item.distanceM}m
                            </span>
                          ) : '-'}
                        </td>
                        <td className="p-4">
                          {item.accuracyM !== null ? `${item.accuracyM}m` : '-'}
                        </td>
                        <td className="p-4">
                          {item.geofence?.name || '-'}
                        </td>
                        <td className="p-4">
                          {item.buktiFoto ? (
                            <button
                              onClick={() => setPhotoModal({ show: true, url: `${API_BASE_URL}${item.buktiFoto}` })}
                              className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                              Lihat
                            </button>
                          ) : '-'}
                        </td>
                        <td className="p-4">
                          {(item.status === 'PENDING' || item.status === 'INVALID') && (
                            <button
                              onClick={() => {
                                setVerifyModal({ show: true, record: item });
                                setVerifyData({ status: 'APPROVED', note: '' });
                              }}
                              className="text-xs bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 px-3 py-1.5 rounded-lg transition-colors"
                            >
                              Verifikasi
                            </button>
                          )}
                          {item.verifier && (
                            <p className="text-xs text-slate-500 mt-1">
                              oleh {item.verifier.nama}
                            </p>
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
                      onClick={() => fetchRecords(pagination.page - 1)}
                      disabled={pagination.page <= 1}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-target flex items-center gap-1"
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
                      onClick={() => fetchRecords(pagination.page + 1)}
                      disabled={pagination.page >= pagination.totalPages}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors touch-target flex items-center gap-1"
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

        {/* Verification Modal */}
        {verifyModal.show && verifyModal.record && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="glass-card rounded-2xl p-6 max-w-md w-full animate-slide-up">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <svg className="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-white">Verifikasi Presensi</h3>
              </div>
              <div className="bg-slate-800/50 rounded-xl p-3 mb-4">
                <p className="text-sm text-slate-300">
                  <span className="text-white font-medium">{verifyModal.record.user?.nama}</span>
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  {new Date(verifyModal.record.checkIn).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })}
                </p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Status</label>
                  <select
                    value={verifyData.status}
                    onChange={(e) => setVerifyData(prev => ({ ...prev, status: e.target.value }))}
                    className="input-premium w-full text-sm"
                  >
                    <option value="APPROVED">APPROVED (Setujui)</option>
                    <option value="REJECTED">REJECTED (Tolak)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Catatan (Opsional)</label>
                  <textarea
                    value={verifyData.note}
                    onChange={(e) => setVerifyData(prev => ({ ...prev, note: e.target.value }))}
                    rows={3}
                    className="input-premium w-full text-sm"
                    placeholder="Catatan verifikasi..."
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setVerifyModal({ show: false, record: null })}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl text-sm transition-colors touch-target"
                >
                  Batal
                </button>
                <button
                  onClick={handleVerify}
                  disabled={loading}
                  className="flex-1 btn-premium text-white px-4 py-3 rounded-xl font-semibold text-sm disabled:opacity-50 touch-target"
                >
                  {loading ? 'Menyimpan...' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Photo Modal */}
        {photoModal.show && photoModal.url && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in" onClick={() => setPhotoModal({ show: false, url: null })}>
            <button
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-slate-800/80 hover:bg-slate-700 flex items-center justify-center text-white transition-colors"
              onClick={() => setPhotoModal({ show: false, url: null })}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="max-w-3xl max-h-[85vh]">
              <img src={photoModal.url} alt="Bukti foto" className="max-h-[85vh] rounded-2xl shadow-2xl" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminPresensiPage;
