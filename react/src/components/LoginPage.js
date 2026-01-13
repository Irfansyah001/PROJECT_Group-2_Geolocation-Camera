// src/components/LoginPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

import { API_BASE_URL } from '../api';

function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col">

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl bg-slate-950/40 border border-slate-800 rounded-2xl shadow-2xl shadow-black/60 overflow-hidden backdrop-blur-lg">
          <div className="grid md:grid-cols-2 gap-0">
            {/* Left panel */}
            <section className="hidden md:flex flex-col justify-between px-10 py-10 bg-gradient-to-br from-emerald-500 via-emerald-400 to-cyan-400 text-slate-900">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em]">
                  Presensi • Realtime
                </p>
                <h1 className="mt-3 text-3xl font-black leading-tight">
                  Kelola presensi karyawan
                  <br />
                  secara aman.
                </h1>

                <p className="mt-4 text-sm text-slate-900/70">
                  Login dengan akun terverifikasi untuk mengakses dashboard, monitoring presensi,
                  dan laporan harian yang terintegrasi dengan API Node.js.
                </p>
              </div>

              <ul className="mt-8 space-y-3 text-sm">
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-emerald-300 text-xs font-bold">
                    1
                  </span>
                  <span>
                    <span className="font-semibold">Autentikasi JWT</span> — token aman untuk
                    setiap request ke API backend.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-emerald-300 text-xs font-bold">
                    2
                  </span>
                  <span>
                    <span className="font-semibold">Role based access</span> — beda hak akses
                    antara admin dan mahasiswa/karyawan.
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="mt-0.5 inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-900 text-emerald-300 text-xs font-bold">
                    3
                  </span>
                  <span>
                    <span className="font-semibold">Terintegrasi React</span> — SPA dengan
                    pengalaman yang cepat tanpa full reload.
                  </span>
                </li>
              </ul>
            </section>

            {/* Right panel – form */}
            <section className="px-8 py-10 bg-slate-950 text-slate-50 flex flex-col justify-center">
              <div className="max-w-sm mx-auto w-full">
                <h2 className="text-2xl font-bold tracking-tight text-slate-50">
                  Login ke Akun Anda
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Masuk menggunakan email dan password yang sudah terdaftar. Token JWT akan
                  otomatis disimpan di browser.
                </p>

                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  <div>
                    <label
                      htmlFor="email"
                      className="block text-xs font-semibold uppercase tracking-wide text-slate-300"
                    >
                      Email
                    </label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm
                                 text-slate-50 placeholder:text-slate-500
                                 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="nama@contoh.com"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="password"
                      className="block text-xs font-semibold uppercase tracking-wide text-slate-300"
                    >
                      Password
                    </label>
                    <input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-900/60 px-3 py-2.5 text-sm
                                 text-slate-50 placeholder:text-slate-500
                                 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="••••••••"
                    />
                  </div>

                  {error && (
                    <div className="rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-emerald-500 px-4 py-2.5
                               text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/30
                               hover:bg-emerald-400 disabled:opacity-60 disabled:cursor-not-allowed
                               transition-colors"
                  >
                    {loading ? 'Memproses...' : 'Login'}
                  </button>
                </form>

                <p className="mt-6 text-xs text-slate-400 text-center">
                  Belum punya akun?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-emerald-400 hover:text-emerald-300"
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
