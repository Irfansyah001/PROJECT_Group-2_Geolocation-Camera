import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

import LoginPage from './components/LoginPage';
import RegisterPage from './components/RegisterPage';
import DashboardPage from './components/DashboardPage';
import Navbar from './components/Navbar';
import PresensiPage from './components/PresensiPage';
import ReportPage from './components/ReportPage';
import HistoryPage from './components/HistoryPage';
import GeofenceManagementPage from './components/GeofenceManagementPage';
import AdminPresensiPage from './components/AdminPresensiPage';
import UserManagementPage from './components/UserManagementPage';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/presensi" element={<PresensiPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/reports" element={<ReportPage />} />
            <Route path="/admin/geofences" element={<GeofenceManagementPage />} />
            <Route path="/admin/presensi" element={<AdminPresensiPage />} />
            <Route path="/admin/users" element={<UserManagementPage />} />
            <Route path="/" element={<LoginPage />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
