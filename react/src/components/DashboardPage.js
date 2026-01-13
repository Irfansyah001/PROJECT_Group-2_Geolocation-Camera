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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (!user) {
    // state loading singkat saat decode token
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">
        <p className="text-sm text-slate-300 animate-pulse">
          Memuat dashboard...
        </p>
      </div>
    );
  }

  const isAdmin = user.role === 'admin';

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">

      {/* main */}
      <main className="flex-1 flex flex-col lg:flex-row">
        {/* left - main card */}
        <section className="flex-1 flex items-center justify-center px-4 py-8">
          <div className="w-full max-w-xl bg-slate-900/80 rounded-2xl border border-slate-800 shadow-2xl shadow-black/60 p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-400">
              Dashboard
            </p>
            <h1 className="mt-3 text-3xl font-black text-slate-50">
              Login Sukses, {user.nama.split(' ')[0]}!
            </h1>
            <p className="mt-2 text-sm text-slate-300">
              Anda saat ini masuk sebagai{' '}
              <span className="font-semibold text-emerald-300">
                {isAdmin ? 'Admin' : 'User'}
              </span>
              . Semua request ke API presensi akan dilindungi oleh token JWT
              yang tersimpan di browser.
            </p>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-slate-300 font-semibold">Status Akun</p>
                <p className="mt-1 text-emerald-300 font-semibold">
                  {isAdmin ? 'Admin Aktif' : 'User Aktif'}
                </p>
                <p className="mt-1 text-slate-400">
                  Token JWT akan kadaluarsa sesuai konfigurasi backend.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-slate-300 font-semibold">Keamanan</p>
                <p className="mt-1 text-slate-200">JWT + Bcrypt</p>
                <p className="mt-1 text-slate-400">
                  Password di-hash, token diverifikasi di setiap request
                  backend.
                </p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <p className="text-slate-300 font-semibold">Role Akses</p>
                <p className="mt-1 text-slate-200 capitalize">{user.role}</p>
                <p className="mt-1 text-slate-400">
                  Hak akses API presensi ditentukan oleh peran Anda.
                </p>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap gap-3 text-xs">
              {/* Tombol ini boleh muncul untuk semua user */}
              <button
                onClick={() => navigate('/presensi')}
                className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/60
                          px-4 py-2 text-emerald-300 hover:bg-emerald-500/20 text-xs"
              >
                Buka Halaman Presensi
              </button>

              {!isAdmin && (
                <p className="mt-2 text-[11px] text-slate-500">
                  Akses laporan harian hanya tersedia untuk akun Admin.
                </p>
              )}

              {/* Tombol laporan hanya muncul jika role = admin, dan sekarang AKTIF ke /reports */}
              {isAdmin && (
                <button
                  onClick={() => navigate('/reports')}
                  className="inline-flex items-center gap-2 rounded-full bg-sky-500/10 border border-sky-500/60
                            px-4 py-2 text-sky-300 hover:bg-sky-500/20 text-xs transition-colors"
                >
                  Lihat Laporan Harian (Admin)
                </button>
              )}
            </div>
          </div>
        </section>

        {/* right - side panel */}
        <aside className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950/80 px-4 py-6">
          <div className="max-w-xs mx-auto space-y-5 text-xs text-slate-300">
            <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4">
              <p className="text-slate-200 font-semibold">
                Informasi Token (client-side)
              </p>
              <p className="mt-1 text-slate-400">
                Token JWT Anda saat ini disimpan di{' '}
                <span className="font-semibold">localStorage</span> dengan key{' '}
                <code className="bg-slate-800 px-1 rounded">"token"</code>.
              </p>
              <p className="mt-2 text-slate-400">
                Frontend menggunakan token ini untuk mengakses endpoint
                terlindungi seperti <code>/api/presensi</code> dan{' '}
                <code>/api/reports</code>.
              </p>
            </div>

            <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
              <p className="text-slate-200 font-semibold">
                Tips pengujian (untuk laporan tugas)
              </p>
              <ul className="mt-2 list-disc list-inside space-y-1 text-slate-400">
                <li>Buka DevTools → Application → Local Storage.</li>
                <li>Lihat dan salin nilai token JWT.</li>
                <li>
                  Coba panggil API presensi via Postman dengan header{' '}
                  <code>Authorization: Bearer &lt;token&gt;</code>.
                </li>
              </ul>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

export default DashboardPage;
