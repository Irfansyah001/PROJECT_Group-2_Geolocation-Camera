// src/components/LoginPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

import { API_BASE_URL } from '../api';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
        email,
        password,
      });

      const token = response.data.token;
      localStorage.setItem('token', token);

      navigate('/dashboard');
    } catch (err) {
      const msg = err.response?.data?.message || 'Login gagal. Periksa kembali email / password.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl" />

      {/* Content */}
      <main className="relative flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-5xl glass-card rounded-3xl overflow-hidden animate-fade-in">
          <div className="grid lg:grid-cols-2 gap-0">
            {/* Left panel */}
            <section className="hidden lg:flex flex-col justify-between p-10 xl:p-12 relative overflow-hidden">
              {/* Gradient background */}
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 via-emerald-400 to-cyan-400" />
              <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
              
              <div className="relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-900/20 backdrop-blur rounded-full mb-6">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                  <span className="text-xs font-semibold text-slate-900">Presensi • Realtime</span>
                </div>
                
                <h1 className="text-3xl xl:text-4xl font-black leading-tight text-slate-900">
                  Kelola presensi<br />
                  dengan <span className="underline decoration-4 decoration-slate-900/30">GeoProof</span>
                </h1>

                <p className="mt-5 text-base text-slate-900/70 leading-relaxed">
                  Sistem presensi modern dengan validasi lokasi GPS dan foto. Login untuk mengakses dashboard terintegrasi.
                </p>
              </div>

              <ul className="relative z-10 mt-8 space-y-4">
                {[
                  { num: '1', title: 'Autentikasi JWT', desc: 'Token aman untuk setiap request API' },
                  { num: '2', title: 'Role Based Access', desc: 'Hak akses berbeda admin & mahasiswa' },
                  { num: '3', title: 'GPS Verification', desc: 'Validasi lokasi dengan geofence' },
                ].map((item) => (
                  <li key={item.num} className="flex items-start gap-4 p-3 bg-slate-900/10 backdrop-blur rounded-xl">
                    <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-900 text-emerald-400 text-sm font-bold shadow-lg">
                      {item.num}
                    </span>
                    <div>
                      <span className="font-bold text-slate-900">{item.title}</span>
                      <span className="text-slate-900/70"> — {item.desc}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            {/* Right panel – form */}
            <section className="px-6 py-8 sm:px-10 sm:py-12 bg-slate-950/80 backdrop-blur-xl flex flex-col justify-center">
              <div className="max-w-sm mx-auto w-full">
                {/* Mobile Logo */}
                <div className="lg:hidden flex items-center gap-3 mb-8">
                  <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-emerald-500/25">
                    GP
                  </div>
                  <div>
                    <h1 className="font-bold text-white text-xl">GeoProof</h1>
                    <p className="text-xs text-slate-400">Attendance System</p>
                  </div>
                </div>

                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                  Selamat Datang!
                </h2>
                <p className="mt-2 text-sm sm:text-base text-slate-400">
                  Masuk ke akun Anda untuk melanjutkan
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
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
                        placeholder="••••••••"
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

                  {error && (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30">
                      <svg className="w-5 h-5 text-red-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span className="text-sm text-red-300">{error}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 sm:py-4 text-sm sm:text-base font-semibold text-white btn-premium rounded-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
                        Masuk
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                      </>
                    )}
                  </button>
                </form>

                <p className="mt-8 text-sm text-slate-400 text-center">
                  Belum punya akun?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                  >
                    Daftar sekarang
                  </Link>
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}

export default LoginPage;
