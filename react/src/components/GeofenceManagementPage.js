// src/components/GeofenceManagementPage.js
import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import api from '../api';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet icon paths
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Component for clicking on map to set location
function LocationPicker({ onLocationSelect }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng);
    },
  });
  return null;
}

function GeofenceManagementPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [geofences, setGeofences] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    centerLat: '',
    centerLng: '',
    radiusM: 100,
    isActive: false
  });

  // Map center
  const [mapCenter, setMapCenter] = useState([-6.2088, 106.8456]); // Default: Jakarta

  // Check auth and admin role
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    try {
      const payload = jwtDecode(token);
      if (payload.role !== 'admin') {
        navigate('/dashboard');
        return;
      }
      setUser(payload);
    } catch (err) {
      console.error('Token decode failed:', err);
      localStorage.removeItem('token');
      navigate('/login');
    }
  }, [navigate]);

  // Fetch geofences
  const fetchGeofences = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/geofences');
      setGeofences(res.data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengambil daftar geofence');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchGeofences();
    }
  }, [user, fetchGeofences]);

  // Handle map click
  const handleLocationSelect = (latlng) => {
    setFormData(prev => ({
      ...prev,
      centerLat: latlng.lat.toFixed(8),
      centerLng: latlng.lng.toFixed(8)
    }));
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setLoading(true);
      
      const payload = {
        name: formData.name,
        description: formData.description,
        centerLat: parseFloat(formData.centerLat),
        centerLng: parseFloat(formData.centerLng),
        radiusM: parseInt(formData.radiusM),
        isActive: formData.isActive
      };

      if (editingId) {
        await api.patch(`/api/geofences/${editingId}`, payload);
        setSuccess('Geofence berhasil diupdate');
      } else {
        await api.post('/api/geofences', payload);
        setSuccess('Geofence berhasil dibuat');
      }

      resetForm();
      fetchGeofences();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menyimpan geofence');
    } finally {
      setLoading(false);
    }
  };

  // Edit geofence
  const handleEdit = (geofence) => {
    setFormData({
      name: geofence.name,
      description: geofence.description || '',
      centerLat: geofence.centerLat,
      centerLng: geofence.centerLng,
      radiusM: geofence.radiusM,
      isActive: geofence.isActive
    });
    setEditingId(geofence.id);
    setShowForm(true);
    setMapCenter([parseFloat(geofence.centerLat), parseFloat(geofence.centerLng)]);
  };

  // Activate geofence
  const handleActivate = async (id) => {
    try {
      setLoading(true);
      await api.patch(`/api/geofences/${id}/activate`);
      setSuccess('Geofence berhasil diaktifkan');
      fetchGeofences();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mengaktifkan geofence');
    } finally {
      setLoading(false);
    }
  };

  // Delete geofence
  const handleDelete = async (id) => {
    if (!window.confirm('Yakin ingin menghapus geofence ini?')) return;

    try {
      setLoading(true);
      await api.delete(`/api/geofences/${id}`);
      setSuccess('Geofence berhasil dihapus');
      fetchGeofences();
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal menghapus geofence');
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      centerLat: '',
      centerLng: '',
      radiusM: 100,
      isActive: false
    });
    setEditingId(null);
    setShowForm(false);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-100">
        <p className="animate-pulse">Memuat...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Manajemen Geofence</h1>
            <p className="text-sm text-slate-400 mt-1">
              Kelola area geofence untuk validasi presensi
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg font-semibold text-sm"
          >
            {showForm ? 'Tutup Form' : '+ Tambah Geofence'}
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/50 rounded-lg text-rose-300 text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/50 rounded-lg text-emerald-300 text-sm">
            {success}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? 'Edit Geofence' : 'Tambah Geofence Baru'}
            </h2>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Map for picking location */}
              <div>
                <p className="text-sm text-slate-400 mb-2">
                  Klik pada peta untuk menentukan titik pusat geofence
                </p>
                <div className="h-80 rounded-lg overflow-hidden border border-slate-700">
                  <MapContainer
                    center={mapCenter}
                    zoom={15}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; OpenStreetMap'
                    />
                    <LocationPicker onLocationSelect={handleLocationSelect} />
                    {formData.centerLat && formData.centerLng && (
                      <>
                        <Marker position={[parseFloat(formData.centerLat), parseFloat(formData.centerLng)]} />
                        <Circle
                          center={[parseFloat(formData.centerLat), parseFloat(formData.centerLng)]}
                          radius={formData.radiusM}
                          pathOptions={{ color: 'emerald', fillColor: 'emerald', fillOpacity: 0.2 }}
                        />
                      </>
                    )}
                  </MapContainer>
                </div>
              </div>

              {/* Form fields */}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Nama Geofence *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Contoh: Kampus A"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Deskripsi
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    placeholder="Deskripsi lokasi (opsional)"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Latitude *
                    </label>
                    <input
                      type="number"
                      step="0.00000001"
                      value={formData.centerLat}
                      onChange={(e) => setFormData(prev => ({ ...prev, centerLat: e.target.value }))}
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="-6.2088"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Longitude *
                    </label>
                    <input
                      type="number"
                      step="0.00000001"
                      value={formData.centerLng}
                      onChange={(e) => setFormData(prev => ({ ...prev, centerLng: e.target.value }))}
                      required
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      placeholder="106.8456"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Radius (meter) *
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="10000"
                    value={formData.radiusM}
                    onChange={(e) => setFormData(prev => ({ ...prev, radiusM: parseInt(e.target.value) || 100 }))}
                    required
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Min: 10m, Max: 10000m (10km)</p>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="rounded border-slate-700"
                  />
                  <label htmlFor="isActive" className="text-sm text-slate-300">
                    Aktifkan geofence ini (hanya satu yang bisa aktif)
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-2 rounded-lg font-semibold text-sm disabled:opacity-50"
                  >
                    {loading ? 'Menyimpan...' : (editingId ? 'Update' : 'Simpan')}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg font-semibold text-sm"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Geofence List */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-lg font-semibold">Daftar Geofence</h2>
          </div>

          {loading && geofences.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Memuat...</div>
          ) : geofences.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              Belum ada geofence. Klik tombol "Tambah Geofence" untuk membuat yang pertama.
            </div>
          ) : (
            <div className="divide-y divide-slate-800">
              {geofences.map((gf) => (
                <div key={gf.id} className="p-4 flex items-center justify-between hover:bg-slate-800/50">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{gf.name}</span>
                      {gf.isActive && (
                        <span className="text-xs bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full">
                          Aktif
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">
                      {gf.description || 'Tidak ada deskripsi'}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Koordinat: {gf.centerLat}, {gf.centerLng} | Radius: {gf.radiusM}m
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!gf.isActive && (
                      <button
                        onClick={() => handleActivate(gf.id)}
                        className="text-xs bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg"
                      >
                        Aktifkan
                      </button>
                    )}
                    <button
                      onClick={() => handleEdit(gf)}
                      className="text-xs bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 px-3 py-1.5 rounded-lg"
                    >
                      Edit
                    </button>
                    {!gf.isActive && (
                      <button
                        onClick={() => handleDelete(gf.id)}
                        className="text-xs bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 px-3 py-1.5 rounded-lg"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default GeofenceManagementPage;
