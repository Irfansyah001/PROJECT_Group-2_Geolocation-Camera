import React, { useMemo } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();

  // Baca token dari localStorage dan decode user.nama + user.role
  const { isAuthenticated, nama, role } = useMemo(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      return { isAuthenticated: false, nama: null, role: null };
    }

    try {
      const payload = jwtDecode(token);

      return {
        isAuthenticated: true,
        nama: payload.nama || payload.name || 'User',
        role: payload.role || null,
      };
    } catch (err) {
      console.error('Gagal decode token di Navbar:', err);
      // kalau token rusak, anggap belum login
      return { isAuthenticated: false, nama: null, role: null };
    }
  }, [location.key]); // dihitung ulang setiap pindah halaman

  const handleLogout = () => {
    // hapus token
    localStorage.removeItem('token');
    // redirect ke halaman login
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="w-full bg-slate-900 text-slate-100 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        {/* Brand / Logo */}
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-full bg-emerald-500 flex items-center justify-center text-xs font-bold">
            PK
          </div>
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-sm sm:text-base">
              Presensi Karyawan
            </span>
            <span className="text-[11px] sm:text-xs text-slate-400">
              Full-Stack Attendance System
            </span>
          </div>
        </Link>

        {/* Menu kanan */}
        <nav className="flex items-center gap-4 text-sm">

          {/* Kalau BELUM login: tampilkan Login & Register */}
          {!isAuthenticated && (
            <>
              <Link
                to="/login"
                className={`hover:text-emerald-400 ${
                  isActive('/login') ? 'text-emerald-400 font-semibold' : ''
                }`}
              >
                Login
              </Link>
              <Link
                to="/register"
                className={`hover:text-emerald-400 ${
                  isActive('/register') ? 'text-emerald-400 font-semibold' : ''
                }`}
              >
                Register
              </Link>
            </>
          )}

          {/* Kalau SUDAH login: tampilkan nama + tombol Logout */}
          {isAuthenticated && (
            <>
              <span className="hidden sm:inline text-xs text-slate-300">
                Halo, <span className="font-semibold">{nama}</span>
                {role === 'admin' && ' · Admin'}
              </span>
              <button
                onClick={handleLogout}
                className="ml-1 rounded-full border border-emerald-500 px-3 py-1 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10"
              >
                Logout
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
