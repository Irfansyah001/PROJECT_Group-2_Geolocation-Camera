// src/components/DashboardPage.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function DashboardPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null); // {id, nama, email, role}

  useEffect(() => {
    const token = localStorage.getItem('token');

    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const payload = jwtDecode(token);
      setUser({
        id: payload.id,
        nama: payload.nama,
        email: payload.email,
        role: payload.role,
      });
    } catch (err) {
      console.error('Gagal decode token:', err);
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-300">
          <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm">Memuat dashboard...</span>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';
  const firstName = user.nama.split(' ')[0];
  const currentHour = new Date().getHours();
  const greeting = currentHour < 12 ? 'Selamat Pagi' : currentHour < 18 ? 'Selamat Siang' : 'Selamat Malam';

  return (
    <div className="min-h-screen flex flex-col">
      {/* Main Content */}
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="mb-8 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full mb-4">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-emerald-400">
                {isAdmin ? 'Administrator' : 'Mahasiswa'}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white">
              {greeting}, {firstName}!
            </h1>
            <p className="mt-2 text-base sm:text-lg text-slate-400">
              Selamat datang kembali di <span className="text-emerald-400 font-semibold">GeoProof</span>
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
            {/* Status Card */}
            <div className="glass-card glass-card-hover rounded-2xl p-6 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Status Akun</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-400">
                    {isAdmin ? 'Admin' : 'Aktif'}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">Token aktif & terverifikasi</p>
            </div>

            {/* Security Card */}
            <div className="glass-card glass-card-hover rounded-2xl p-6 transition-all duration-300">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Keamanan</p>
                  <p className="mt-2 text-2xl font-bold text-cyan-400">JWT + Bcrypt</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">Password terenkripsi aman</p>
            </div>

            {/* Role Card */}
            <div className="glass-card glass-card-hover rounded-2xl p-6 transition-all duration-300 sm:col-span-2 lg:col-span-1">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-400">Role Akses</p>
                  <p className="mt-2 text-2xl font-bold text-amber-400 capitalize">{user.role}</p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                {isAdmin ? 'Akses penuh ke semua fitur' : 'Akses presensi & riwayat'}
              </p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 mb-8">
            <h2 className="text-lg sm:text-xl font-bold text-white mb-6">Aksi Cepat</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Presensi Button */}
              <button
                onClick={() => navigate('/presensi')}
                className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <span className="font-semibold text-white">Presensi</span>
                <span className="text-xs text-slate-400">Lakukan presensi</span>
              </button>

              {/* History Button */}
              <button
                onClick={() => navigate('/history')}
                className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 hover:border-cyan-500/40 transition-all duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <svg className="w-7 h-7 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <span className="font-semibold text-white">Riwayat</span>
                <span className="text-xs text-slate-400">Lihat riwayat</span>
              </button>

              {isAdmin && (
                <>
                  {/* Reports Button - Admin Only */}
                  <button
                    onClick={() => navigate('/reports')}
                    className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-7 h-7 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <span className="font-semibold text-white">Laporan</span>
                    <span className="text-xs text-slate-400">Lihat laporan</span>
                  </button>

                  {/* User Management - Admin Only */}
                  <button
                    onClick={() => navigate('/admin/users')}
                    className="group flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 hover:border-amber-500/40 transition-all duration-300"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <svg className="w-7 h-7 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    </div>
                    <span className="font-semibold text-white">Kelola User</span>
                    <span className="text-xs text-slate-400">Manage users</span>
                  </button>
                </>
              )}
            </div>

            {!isAdmin && (
              <p className="mt-6 text-sm text-slate-500 text-center">
                💡 Fitur laporan dan manajemen user hanya tersedia untuk Administrator
              </p>
            )}
          </div>

          {/* Info Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-white">Informasi Token</h3>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed">
                Token JWT Anda tersimpan di <code className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 text-xs">localStorage</code> dengan key "token". 
                Frontend menggunakan token ini untuk mengakses endpoint terlindungi seperti <code className="px-2 py-0.5 rounded bg-slate-800 text-emerald-400 text-xs">/api/presensi</code>.
              </p>
            </div>

            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-700/50 flex items-center justify-center">
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-white">Tips</h3>
              </div>
              <ul className="text-sm text-slate-400 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  Buka DevTools → Application → Local Storage untuk melihat token
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400">•</span>
                  Gunakan GPS di device mobile untuk akurasi lokasi terbaik
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DashboardPage;
