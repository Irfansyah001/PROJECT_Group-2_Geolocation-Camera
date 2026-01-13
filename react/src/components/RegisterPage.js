// src/components/RegisterPage.js
import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

import { API_BASE_URL } from '../api';

function RegisterPage() {
  const [nama, setNama] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('mahasiswa');

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
        role,
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
    <div className="min-h-screen bg-slate-950 flex flex-col">

      {/* Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr,1fr] gap-10">
          {/* Text / benefits */}
          <section className="hidden lg:flex flex-col justify-center text-slate-100">
            <h1 className="text-3xl font-black leading-tight">
              Satu akun untuk
              <span className="text-blue-400"> mengelola presensi</span> secara
              terintegrasi.
            </h1>
            <p className="mt-4 text-sm text-slate-300">
              Daftarkan akun baru untuk mengakses sistem presensi. Role{' '}
              <span className="font-semibold text-slate-100">Admin</span> dapat
              mengelola laporan, sedangkan{' '}
              <span className="font-semibold text-slate-100">Mahasiswa</span>{' '}
              hanya melakukan check-in / check-out.
            </p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-slate-300 font-semibold">
                  🔐 Password di-hash
                </p>
                <p className="mt-1 text-slate-400">
                  Password tidak disimpan dalam bentuk plain text. Backend
                  menggunakan <span className="font-semibold">bcrypt</span>.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
                <p className="text-slate-300 font-semibold">
                  🎫 Token JWT aman
                </p>
                <p className="mt-1 text-slate-400">
                  Setelah login, sistem mengeluarkan token JWT untuk autentikasi
                  tiap request.
                </p>
              </div>
            </div>
          </section>

          {/* Form card */}
          <section className="bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl shadow-black/50 p-8">
            <h2 className="text-2xl font-bold text-slate-50 text-center">
              Register Akun Baru
            </h2>
            <p className="mt-2 text-xs text-slate-400 text-center">
              Isi data dengan benar sesuai identitas kampus / perusahaan.
            </p>

            <form onSubmit={handleSubmit} className="mt-7 space-y-4">
              {/* Nama */}
              <div>
                <label
                  htmlFor="nama"
                  className="block text-xs font-semibold uppercase tracking-wide text-slate-300"
                >
                  Nama Lengkap
                </label>
                <input
                  id="nama"
                  type="text"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                  className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm
                             text-slate-50 placeholder:text-slate-500
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nama Anda"
                />
              </div>

              {/* Email */}
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
                  className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm
                             text-slate-50 placeholder:text-slate-500
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="nama@contoh.com"
                />
              </div>

              {/* Password */}
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
                  className="mt-2 block w-full rounded-lg border border-slate-700 bg-slate-950/60 px-3 py-2.5 text-sm
                             text-slate-50 placeholder:text-slate-500
                             focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Minimal 6 karakter"
                />
              </div>

              {/* Role */}
              <div>
                <span className="block text-xs font-semibold uppercase tracking-wide text-slate-300 mb-2">
                  Role
                </span>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => setRole('mahasiswa')}
                    className={
                      'rounded-lg border px-3 py-2 text-center transition-colors ' +
                      (role === 'mahasiswa'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                        : 'border-slate-700 bg-slate-950/40 text-slate-300 hover:border-blue-500/60')
                    }
                  >
                    Mahasiswa
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={
                      'rounded-lg border px-3 py-2 text-center transition-colors ' +
                      (role === 'admin'
                        ? 'border-amber-400 bg-amber-500/10 text-amber-200'
                        : 'border-slate-700 bg-slate-950/40 text-slate-300 hover:border-amber-400/70')
                    }
                  >
                    Admin
                  </button>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  Pilih <span className="font-semibold">Admin</span> hanya untuk
                  dosen / supervisor yang berhak mengakses laporan penuh.
                </p>
              </div>

              {/* Alert */}
              {error && (
                <div className="rounded-md border border-red-500/60 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                  {error}
                </div>
              )}
              {successMsg && (
                <div className="rounded-md border border-emerald-500/60 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-300">
                  {successMsg}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="mt-1 inline-flex w-full items-center justify-center rounded-lg bg-blue-500 px-4 py-2.5
                           text-sm font-semibold text-slate-50 shadow-lg shadow-blue-500/30
                           hover:bg-blue-400 disabled:opacity-60 disabled:cursor-not-allowed
                           transition-colors"
              >
                {loading ? 'Memproses...' : 'Daftar'}
              </button>
            </form>

            <p className="mt-6 text-xs text-center text-slate-400">
              Sudah punya akun?{' '}
              <Link
                to="/login"
                className="font-semibold text-blue-400 hover:text-blue-300"
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
