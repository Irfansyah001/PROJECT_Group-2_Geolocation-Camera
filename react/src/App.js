import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DashboardPage from './components/DashboardPage';
import Navbar from './components/Navbar';
import PresensiPage from './components/PresensiPage';
import ReportPage from './components/ReportPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-50">
        {/* 🔝 Navbar selalu muncul di atas */}
        <Navbar />

        {/* Isi halaman */}
        <main className="pt-4 pb-10">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/presensi" element={<PresensiPage />} />
            <Route path="/reports" element={<ReportPage />} />
            {/* default: kalau buka "/" langsung ke login */}
            <Route path="/" element={<LoginPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
