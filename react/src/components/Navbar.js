import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [showAdminMenu, setShowAdminMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const dropdownRef = useRef(null);
  const mobileMenuRef = useRef(null);

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
      return { isAuthenticated: false, nama: null, role: null };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowAdminMenu(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target)) {
        setShowMobileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
    setShowAdminMenu(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setShowMobileMenu(false);
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;
  const isAdminActive = () => location.pathname.startsWith('/admin') || location.pathname === '/reports';

  const NavLink = ({ to, children, mobile = false }) => (
    <Link
      to={to}
      onClick={() => setShowMobileMenu(false)}
      className={`relative flex items-center gap-2 ${mobile ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm'} font-medium transition-all duration-200
        ${isActive(to) 
          ? 'text-emerald-400' 
          : 'text-slate-300 hover:text-white'
        } ${mobile ? 'hover:bg-slate-800/50' : ''}`}
    >
      {children}
      {isActive(to) && !mobile && (
        <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-400 rounded-full" />
      )}
      {isActive(to) && mobile && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-emerald-400 rounded-r-full" />
      )}
    </Link>
  );

  const MobileMenuLink = ({ to, icon, children }) => (
    <Link
      to={to}
      onClick={() => setShowMobileMenu(false)}
      className={`flex items-center gap-3 px-4 py-3.5 text-base font-medium transition-all duration-200 relative
        ${isActive(to) 
          ? 'text-emerald-400 bg-emerald-500/10' 
          : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
        }`}
    >
      {isActive(to) && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-emerald-400 rounded-r-full" />
      )}
      <span className="w-5 h-5">{icon}</span>
      {children}
    </Link>
  );

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Glass navbar background */}
      <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-xl border-b border-slate-700/50" />
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="relative h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-emerald-500/25 group-hover:shadow-emerald-500/40 transition-all duration-300">
              <span className="relative z-10">GP</span>
              <div className="absolute inset-0 rounded-xl bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <div className="hidden sm:flex flex-col">
              <span className="font-bold text-white text-base leading-tight tracking-tight">
                GeoProof
              </span>
              <span className="text-xs text-slate-400 leading-tight">
                Attendance System
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {!isAuthenticated ? (
              <>
                <NavLink to="/login">Masuk</NavLink>
                <Link
                  to="/register"
                  className="ml-2 px-5 py-2.5 text-sm font-semibold text-white btn-premium rounded-xl transition-all duration-300"
                >
                  Daftar
                </Link>
              </>
            ) : (
              <>
                <NavLink to="/presensi">Presensi</NavLink>
                <NavLink to="/history">Riwayat</NavLink>

                {role === 'admin' && (
                  <div className="relative" ref={dropdownRef}>
                    <button
                      onClick={() => setShowAdminMenu(!showAdminMenu)}
                      className={`relative flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-all duration-200
                        ${isAdminActive() ? 'text-emerald-400' : 'text-slate-300 hover:text-white'}`}
                    >
                      Admin
                      <svg 
                        className={`w-4 h-4 transition-transform duration-200 ${showAdminMenu ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                      {isAdminActive() && (
                        <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-emerald-400 rounded-full" />
                      )}
                    </button>
                    
                    {showAdminMenu && (
                      <div className="absolute right-0 mt-2 w-56 glass-card rounded-2xl py-2 overflow-hidden animate-fade-in">
                        <Link
                          to="/admin/users"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700/30 transition-all duration-200"
                          onClick={() => setShowAdminMenu(false)}
                        >
                          <svg className="w-5 h-5 text-emerald-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                          </svg>
                          Kelola User
                        </Link>
                        <Link
                          to="/admin/geofences"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700/30 transition-all duration-200"
                          onClick={() => setShowAdminMenu(false)}
                        >
                          <svg className="w-5 h-5 text-cyan-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Kelola Geofence
                        </Link>
                        <Link
                          to="/admin/presensi"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700/30 transition-all duration-200"
                          onClick={() => setShowAdminMenu(false)}
                        >
                          <svg className="w-5 h-5 text-amber-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                          Monitor Presensi
                        </Link>
                        <Link
                          to="/reports"
                          className="flex items-center gap-3 px-4 py-3 text-sm text-slate-300 hover:text-white hover:bg-slate-700/30 transition-all duration-200"
                          onClick={() => setShowAdminMenu(false)}
                        >
                          <svg className="w-5 h-5 text-purple-400/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          Laporan
                        </Link>
                      </div>
                    )}
                  </div>
                )}

                <div className="hidden lg:flex items-center ml-4 pl-4 border-l border-slate-700/50">
                  <div className="flex items-center gap-3 mr-3">
                    <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-sm font-semibold text-white shadow-lg">
                      {nama?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-white leading-tight">{nama}</span>
                      {role === 'admin' && (
                        <span className="text-xs text-emerald-400 leading-tight font-medium">Administrator</span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleLogout}
                  className="ml-2 px-4 py-2 text-sm font-medium text-slate-300 hover:text-white border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/50 rounded-xl transition-all duration-200"
                >
                  Keluar
                </button>
              </>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setShowMobileMenu(!showMobileMenu)}
            className="md:hidden relative w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
            aria-label="Toggle menu"
          >
            <div className="w-5 h-4 flex flex-col justify-between">
              <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${showMobileMenu ? 'rotate-45 translate-y-1.5' : ''}`} />
              <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${showMobileMenu ? 'opacity-0 scale-0' : ''}`} />
              <span className={`block h-0.5 bg-current rounded-full transition-all duration-300 ${showMobileMenu ? '-rotate-45 -translate-y-2' : ''}`} />
            </div>
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {showMobileMenu && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setShowMobileMenu(false)}
        />
      )}

      {/* Mobile Menu Panel */}
      <div 
        ref={mobileMenuRef}
        className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-slate-900/95 backdrop-blur-xl border-l border-slate-700/50 z-50 transform transition-transform duration-300 ease-out md:hidden ${
          showMobileMenu ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Mobile Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-emerald-400 via-emerald-500 to-emerald-600 flex items-center justify-center text-sm font-bold text-white shadow-lg shadow-emerald-500/25">
              GP
            </div>
            <div className="flex flex-col">
              <span className="font-bold text-white text-base leading-tight">GeoProof</span>
              <span className="text-xs text-slate-400">Attendance System</span>
            </div>
          </div>
          <button
            onClick={() => setShowMobileMenu(false)}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* User Info for Mobile */}
        {isAuthenticated && (
          <div className="p-4 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-lg font-bold text-white shadow-lg">
                {nama?.charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-base font-semibold text-white">{nama}</span>
                <span className={`text-sm font-medium ${role === 'admin' ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {role === 'admin' ? 'Administrator' : 'Mahasiswa'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Mobile Menu Links */}
        <nav className="flex-1 overflow-y-auto py-2">
          {!isAuthenticated ? (
            <div className="p-4 space-y-3">
              <Link
                to="/login"
                onClick={() => setShowMobileMenu(false)}
                className="block w-full px-4 py-3.5 text-center text-base font-medium text-slate-300 border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/50 rounded-xl transition-all"
              >
                Masuk
              </Link>
              <Link
                to="/register"
                onClick={() => setShowMobileMenu(false)}
                className="block w-full px-4 py-3.5 text-center text-base font-semibold text-white btn-premium rounded-xl transition-all"
              >
                Daftar
              </Link>
            </div>
          ) : (
            <>
              <MobileMenuLink 
                to="/presensi"
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                }
              >
                Presensi
              </MobileMenuLink>
              
              <MobileMenuLink 
                to="/history"
                icon={
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                }
              >
                Riwayat
              </MobileMenuLink>

              {role === 'admin' && (
                <>
                  <div className="px-4 py-2 mt-2">
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Admin Panel</span>
                  </div>
                  
                  <MobileMenuLink 
                    to="/admin/users"
                    icon={
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-emerald-400">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                      </svg>
                    }
                  >
                    Kelola User
                  </MobileMenuLink>
                  
                  <MobileMenuLink 
                    to="/admin/geofences"
                    icon={
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-cyan-400">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    }
                  >
                    Kelola Geofence
                  </MobileMenuLink>
                  
                  <MobileMenuLink 
                    to="/admin/presensi"
                    icon={
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-amber-400">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    }
                  >
                    Monitor Presensi
                  </MobileMenuLink>
                  
                  <MobileMenuLink 
                    to="/reports"
                    icon={
                      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24" className="text-purple-400">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    }
                  >
                    Laporan
                  </MobileMenuLink>
                </>
              )}

              {/* Logout Button */}
              <div className="p-4 mt-4 border-t border-slate-700/50">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3.5 text-base font-medium text-red-400 border border-red-500/30 hover:bg-red-500/10 hover:border-red-500/50 rounded-xl transition-all"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Keluar
                </button>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
