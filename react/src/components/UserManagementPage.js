import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import api from "../api";

function UserManagementPage() {
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState({ total: 0, mahasiswa: 0, admin: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Form states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showDeleteOwnModal, setShowDeleteOwnModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    nama: "",
    email: "",
    password: "",
    role: "mahasiswa",
  });
  const [deletePassword, setDeletePassword] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      const payload = jwtDecode(token);
      if (payload.role !== "admin") {
        navigate("/");
        return;
      }
      setUser(payload);
      fetchUsers();
      fetchStats();
    } catch (err) {
      navigate("/login");
    }
  }, [navigate]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/auth/users");
      setUsers(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Gagal mengambil data user");
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get("/api/auth/users/stats");
      setStats(res.data.data || { total: 0, mahasiswa: 0, admin: 0 });
    } catch (err) {
      console.error("Failed to fetch stats:", err);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const res = await api.post("/api/auth/users", formData);
      setMessage(res.data.message);
      setShowCreateModal(false);
      setFormData({ nama: "", email: "", password: "", role: "mahasiswa" });
      fetchUsers();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || "Gagal membuat user");
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    try {
      const updateData = { ...formData };
      if (!updateData.password) delete updateData.password;

      const res = await api.put(`/api/auth/users/${selectedUser.id}`, updateData);
      setMessage(res.data.message);
      setShowEditModal(false);
      setSelectedUser(null);
      setFormData({ nama: "", email: "", password: "", role: "mahasiswa" });
      fetchUsers();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || "Gagal mengupdate user");
    }
  };

  const handleDeleteUser = async () => {
    setError(null);
    setMessage(null);

    try {
      const res = await api.delete(`/api/auth/users/${selectedUser.id}`);
      setMessage(res.data.message);
      setShowDeleteModal(false);
      setSelectedUser(null);
      fetchUsers();
      fetchStats();
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menghapus user");
    }
  };

  const handleDeleteOwnAccount = async () => {
    setError(null);

    try {
      await api.delete("/api/auth/me", { data: { password: deletePassword } });
      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      setError(err.response?.data?.message || "Gagal menghapus akun");
    }
  };

  const openEditModal = (userToEdit) => {
    setSelectedUser(userToEdit);
    setFormData({
      nama: userToEdit.nama,
      email: userToEdit.email,
      password: "",
      role: userToEdit.role,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (userToDelete) => {
    setSelectedUser(userToDelete);
    setShowDeleteModal(true);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-3 text-slate-300">
          <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm">Memuat...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-50">
      <main className="w-full max-w-6xl mx-auto px-4 py-6 sm:py-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 animate-fade-in">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full mb-3">
              <div className="w-2 h-2 bg-amber-400 rounded-full" />
              <span className="text-xs font-semibold text-amber-400">Admin Panel</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Kelola User</h1>
            <p className="text-sm text-slate-400 mt-1">
              Kelola akun mahasiswa dan admin sistem presensi
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                setFormData({ nama: "", email: "", password: "", role: "mahasiswa" });
                setShowCreateModal(true);
              }}
              className="btn-premium text-white px-4 py-3 font-medium rounded-xl transition-all flex items-center gap-2 text-sm"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Tambah User
            </button>
            <button
              onClick={() => {
                setDeletePassword("");
                setShowDeleteOwnModal(true);
              }}
              className="px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium rounded-xl transition-all border border-rose-500/30 text-sm"
            >
              <span className="hidden sm:inline">Hapus Akun Saya</span>
              <svg className="w-5 h-5 sm:hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6 sm:mb-8">
          <div className="glass-card rounded-xl p-4 sm:p-5 text-center sm:text-left">
            <div className="w-10 h-10 mx-auto sm:mx-0 rounded-xl bg-slate-700/50 flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="text-xs text-slate-400">Total User</p>
            <p className="text-2xl sm:text-3xl font-bold text-slate-100 mt-1">{stats.total}</p>
          </div>
          <div className="glass-card rounded-xl p-4 sm:p-5 text-center sm:text-left">
            <div className="w-10 h-10 mx-auto sm:mx-0 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M12 14l9-5-9-5-9 5 9 5z" /><path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
              </svg>
            </div>
            <p className="text-xs text-slate-400">Mahasiswa</p>
            <p className="text-2xl sm:text-3xl font-bold text-cyan-400 mt-1">{stats.mahasiswa}</p>
          </div>
          <div className="glass-card rounded-xl p-4 sm:p-5 text-center sm:text-left">
            <div className="w-10 h-10 mx-auto sm:mx-0 rounded-xl bg-amber-500/20 flex items-center justify-center mb-2">
              <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <p className="text-xs text-slate-400">Admin</p>
            <p className="text-2xl sm:text-3xl font-bold text-amber-400 mt-1">{stats.admin}</p>
          </div>
        </div>

        {/* Messages */}
        {message && (
          <div className="mb-4 flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {message}
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm animate-fade-in">
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {error}
          </div>
        )}

        {/* Users - Mobile Cards + Desktop Table */}
        <div className="glass-card rounded-2xl overflow-hidden">
          {/* Mobile Cards */}
          <div className="sm:hidden divide-y divide-slate-700/50">
            {loading ? (
              <div className="p-8 flex items-center justify-center gap-3 text-slate-400">
                <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Memuat data...
              </div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-slate-400">Belum ada user terdaftar</div>
            ) : (
              users.map((u) => (
                <div key={u.id} className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white truncate">
                        {u.nama}
                        {u.id === user.id && (
                          <span className="ml-2 text-xs text-emerald-400">(Anda)</span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400 truncate">{u.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            u.role === "admin"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-cyan-500/20 text-cyan-300"
                          }`}
                        >
                          {u.role}
                        </span>
                        <span className="text-xs text-slate-500">{formatDate(u.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => openEditModal(u)}
                        className="p-2.5 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50 rounded-lg transition-colors touch-target"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      {u.role !== "admin" && (
                        <button
                          onClick={() => openDeleteModal(u)}
                          className="p-2.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-lg transition-colors touch-target"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Desktop Table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/50 text-left bg-slate-800/30">
                  <th className="px-6 py-4 text-slate-300 font-medium">User</th>
                  <th className="px-6 py-4 text-slate-300 font-medium">Role</th>
                  <th className="px-6 py-4 text-slate-300 font-medium">Terdaftar</th>
                  <th className="px-6 py-4 text-slate-300 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                      <div className="flex items-center justify-center gap-3">
                        <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Memuat data...
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-slate-400">
                      Belum ada user terdaftar
                    </td>
                  </tr>
                ) : (
                  users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-700/50 hover:bg-slate-800/20 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-slate-100">
                            {u.nama}
                            {u.id === user.id && (
                              <span className="ml-2 text-xs text-emerald-400">(Anda)</span>
                            )}
                          </p>
                          <p className="text-xs text-slate-400">{u.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${
                            u.role === "admin"
                              ? "bg-amber-500/20 text-amber-300"
                              : "bg-cyan-500/20 text-cyan-300"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-400">{formatDate(u.createdAt)}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openEditModal(u)}
                            className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {u.role !== "admin" && (
                            <button
                              onClick={() => openDeleteModal(u)}
                              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-700 rounded-lg transition-colors"
                              title="Hapus"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                          {u.role === "admin" && u.id !== user.id && (
                            <span className="text-xs text-slate-500 italic">Admin</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="glass-card rounded-2xl p-6 w-full max-w-md animate-slide-up">
              <h2 className="text-xl font-bold mb-4 text-white">Tambah User Baru</h2>
              <form onSubmit={handleCreateUser} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Nama</label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="input-premium w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-premium w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-premium w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input-premium w-full"
                  >
                    <option value="mahasiswa">Mahasiswa</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors touch-target"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-premium text-white px-4 py-3 rounded-xl font-medium touch-target"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal && selectedUser && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="glass-card rounded-2xl p-6 w-full max-w-md animate-slide-up">
              <h2 className="text-xl font-bold mb-4 text-white">Edit User</h2>
              <form onSubmit={handleUpdateUser} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Nama</label>
                  <input
                    type="text"
                    value={formData.nama}
                    onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                    className="input-premium w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="input-premium w-full"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Password (kosongkan jika tidak diubah)</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="input-premium w-full"
                    placeholder="Kosongkan jika tidak ingin mengubah"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1.5">Role</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="input-premium w-full"
                  >
                    <option value="mahasiswa">Mahasiswa</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setSelectedUser(null);
                    }}
                    className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors touch-target"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="flex-1 btn-premium text-white px-4 py-3 rounded-xl font-medium touch-target"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && selectedUser && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="glass-card rounded-2xl p-6 w-full max-w-md animate-slide-up border-rose-500/30">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2 text-white">Hapus User</h2>
              <p className="text-slate-400 mb-6 text-sm">
                Apakah Anda yakin ingin menghapus user <span className="text-white font-medium">{selectedUser.nama}</span> ({selectedUser.email})?
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setSelectedUser(null);
                  }}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors touch-target"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-500 rounded-xl font-medium transition-colors touch-target"
                >
                  Hapus
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Delete Own Account Modal */}
        {showDeleteOwnModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
            <div className="glass-card rounded-2xl p-6 w-full max-w-md animate-slide-up border-rose-500/30">
              <div className="w-12 h-12 rounded-xl bg-rose-500/20 flex items-center justify-center mb-4">
                <svg className="w-6 h-6 text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h2 className="text-xl font-bold mb-2 text-white">Hapus Akun Saya</h2>
              <div className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-4 mb-4">
                <p className="text-sm text-rose-300">
                  Peringatan: Tindakan ini tidak dapat dibatalkan. Semua data Anda akan dihapus secara permanen.
                </p>
              </div>
              <p className="text-slate-400 mb-4 text-sm">
                Masukkan password Anda untuk konfirmasi:
              </p>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="input-premium w-full mb-6"
                placeholder="Password Anda"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteOwnModal(false);
                    setDeletePassword("");
                  }}
                  className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl transition-colors touch-target"
                >
                  Batal
                </button>
                <button
                  onClick={handleDeleteOwnAccount}
                  disabled={!deletePassword}
                  className="flex-1 px-4 py-3 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-600/50 disabled:cursor-not-allowed rounded-xl font-medium transition-colors touch-target"
                >
                  Hapus Akun Saya
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default UserManagementPage;
