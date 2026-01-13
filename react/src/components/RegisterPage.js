// src/components/RegisterPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

import { API_BASE_URL } from '../api';

function RegisterPage() {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/register`, {
        nama,
        email,
        password,
        // role tidak dikirim - backend otomatis set sebagai mahasiswa
      });

      setSuccessMsg(response.data.message || 'Registrasi berhasil.');

      setTimeout(() => {
        navigate('/login');
      }, 900);
    } catch (err) {
      const msg =
        err.response?.data?.message || 'Registrasi gagal. Silakan coba lagi.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-1/4 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl" />

      {/* Content */}
      <main className="relative flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr,1fr] gap-8 lg:gap-12 animate-fade-in">
          {/* Text / benefits */}
          <section className="hidden lg:flex flex-col justify-center text-slate-100">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-cyan-500/10 border border-cyan-500/20 rounded-full mb-6 w-fit">
              <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
              <span className="text-xs font-semibold text-cyan-400">Buat Akun Baru</span>
            </div>
            
            <h1 className="text-4xl font-black leading-tight">
              Satu akun untuk
              <span className="gradient-text"> mengelola presensi</span> secara
              terintegrasi.
            </h1>
            <p className="mt-5 text-base text-slate-400 leading-relaxed">
              Daftarkan akun baru untuk mengakses sistem presensi sebagai{' '}
              <span className="font-semibold text-white">Mahasiswa</span>.
              Untuk akun Admin, hubungi administrator sistem.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-4">
              {[
                {
                  icon: '🔐',
                  title: 'Password di-hash',
                  desc: 'Password tidak disimpan plain text. Backend menggunakan bcrypt.',
                  color: 'emerald'
                },
                {
                  icon: '🎫',
                  title: 'Token JWT aman',
                  desc: 'Setelah login, sistem mengeluarkan token JWT untuk autentikasi.',
                  color: 'cyan'
                },
                {
                  icon: '📍',
                  title: 'Verifikasi GPS',
                  desc: 'Lokasi presensi divalidasi dengan sistem geofence.',
                  color: 'amber'
                }
              ].map((item, idx) => (
                <div key={idx} className="glass-card glass-card-hover rounded-2xl p-5 transition-all duration-300 cursor-default">
                  <div className="flex items-start gap-4">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="text-white font-semibold">{item.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{item.desc}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Form card */}
          <section className="glass-card rounded-3xl p-6 sm:p-8 lg:p-10">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-3 mb-8">
              <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-cyan-400 via-cyan-500 to-emerald-500 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-cyan-500/25">
                GP
              </div>
              <div>
                <h1 className="font-bold text-white text-xl">GeoProof</h1>
                <p className="text-xs text-slate-400">Buat Akun Baru</p>
              </div>
            </div>

            <h2 className="text-2xl sm:text-3xl font-bold text-white">
              Daftar Akun ✨
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-400">
              Isi data dengan benar sesuai identitas Anda
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5">
              {/* Nama */}
              <div>
                <label
                  htmlFor="nama"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Nama Lengkap
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <input
                    id="nama"
                    type="text"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    required
                    className="block w-full pl-12 pr-4 py-3.5 rounded-xl input-premium text-white placeholder:text-slate-500 text-sm sm:text-base"
                    placeholder="Nama Anda"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="block w-full pl-12 pr-4 py-3.5 rounded-xl input-premium text-white placeholder:text-slate-500 text-sm sm:text-base"
                    placeholder="nama@contoh.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-slate-300 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="block w-full pl-12 pr-12 py-3.5 rounded-xl input-premium text-white placeholder:text-slate-500 text-sm sm:text-base"
                    placeholder="Minimal 6 karakter"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Alert */}
              {error && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30">
                  <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-red-300">{error}</span>
                </div>
              )}
              {successMsg && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                  <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-sm text-emerald-300">{successMsg}</span>
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 sm:py-4 text-sm sm:text-base font-semibold text-white bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 rounded-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 transition-all duration-300"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memproses...
                  </>
                ) : (
                  <>
                    Daftar Sekarang
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </form>

            <p className="mt-8 text-sm text-center text-slate-400">
              Sudah punya akun?{' '}
              <Link
                to="/login"
                className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                Login di sini
              </Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}

export default RegisterPage;
