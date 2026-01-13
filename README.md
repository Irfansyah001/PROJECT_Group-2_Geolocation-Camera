# **GeoProof – Location-Verified Attendance System**

**Kelompok 2**  
**Kelas:** TI-5E (PAW – E-PPAW-TI503P-2025)

---

## **📋 Deskripsi Proyek**

GeoProof adalah sistem presensi berbasis lokasi dan selfie yang memvalidasi kehadiran menggunakan:

- **Geofence** – Area virtual berbentuk lingkaran yang menentukan lokasi valid untuk presensi
- **Haversine Distance** – Perhitungan jarak akurat antara posisi user dan pusat geofence
- **Selfie Verification** – Foto bukti kehadiran yang tersimpan di server
- **GPS Accuracy Gate** – Validasi akurasi GPS untuk mencegah spoofing

### **Fitur Utama**

| Fitur | Deskripsi |
|-------|-----------|
| 📍 **Geofence Management** | Admin dapat membuat, mengubah, dan mengaktifkan geofence |
| ✅ **Check-In dengan Validasi** | Sistem otomatis menghitung jarak dan status (VALID/INVALID/PENDING) |
| 📸 **Selfie Evidence** | Foto selfie wajib sebagai bukti kehadiran |
| 📊 **Audit Trail** | Semua data tersimpan: koordinat, jarak, akurasi, timestamp |
| 🔐 **Admin Verification** | Admin dapat verify/reject presensi yang pending |
| 🛡️ **Security Hardening** | Rate limiting, CORS strict, Helmet headers |

---

## **🚀 Cara Menjalankan Proyek**

### **Prasyarat**

- Node.js v18+ 
- MySQL/MariaDB
- npm atau yarn

### **1. Clone Repository**

```bash
git clone <repository-url>
cd PROJECT_Group-2_Geolocation-Camera
```

### **2. Setup Backend**

```bash
cd node-server

# Install dependencies
npm install

# Copy dan edit file environment
cp .env.example .env
# Edit .env dengan kredensial database Anda

# Jalankan migrasi database
npx sequelize-cli db:migrate

# Jalankan server
npm start
```

Server berjalan di `http://localhost:3001`

### **3. Setup Frontend**

```bash
cd react

# Install dependencies
npm install

# Copy dan edit file environment
cp .env.example .env

# Jalankan development server
npm start
```

Aplikasi berjalan di `http://localhost:3000`

---

## **⚙️ Konfigurasi Environment**

### **Backend (.env)**

```env
# Server
PORT=3001
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3307
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=praktikum_20230140223_db

# JWT
JWT_SECRET=your-super-secure-secret-key-min-32-chars

# CORS
FRONTEND_ORIGIN=http://localhost:3000

# GPS Validation
MAX_GPS_ACCURACY_M=100

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
SUBMIT_LIMIT_WINDOW_MS=60000
SUBMIT_LIMIT_MAX=5
```

### **Frontend (.env)**

```env
REACT_APP_API_BASE_URL=http://localhost:3001
```

---

## **📡 Daftar Endpoint API**

### **Authentication**

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/register` | Daftar user baru | ❌ |
| POST | `/api/auth/login` | Login dan dapatkan token | ✅ |

### **Presensi**

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| POST | `/api/presensi/check-in` | Check-in dengan lokasi + selfie | ✅ |
| POST | `/api/presensi/check-out` | Check-out | ✅ |
| GET | `/api/presensi/history` | Riwayat presensi user | ✅ |
| GET | `/api/presensi/:id` | Detail presensi spesifik | ✅ |
| GET | `/api/presensi/admin/all` | Semua presensi (admin) | 🔒 Admin |
| PATCH | `/api/presensi/:id/verify` | Verifikasi presensi (admin) | 🔒 Admin |

### **Geofence**

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/api/geofences/active` | Geofence aktif saat ini | ✅ |
| GET | `/api/geofences` | Semua geofence | 🔒 Admin |
| GET | `/api/geofences/:id` | Detail geofence | 🔒 Admin |
| POST | `/api/geofences` | Buat geofence baru | 🔒 Admin |
| PUT | `/api/geofences/:id` | Update geofence | 🔒 Admin |
| PATCH | `/api/geofences/:id/activate` | Aktifkan geofence | 🔒 Admin |
| DELETE | `/api/geofences/:id` | Hapus geofence | 🔒 Admin |

### **Reports**

| Method | Endpoint | Deskripsi | Auth |
|--------|----------|-----------|------|
| GET | `/api/reports/daily` | Laporan harian | 🔒 Admin |

---

## **🗄️ Struktur Database**

### **Users**
```
- id, email, password, nama, role (admin/karyawan)
- createdAt, updatedAt
```

### **Geofences**
```
- id, name, description
- centerLat, centerLng, radiusM
- isActive, createdBy
- createdAt, updatedAt
```

### **Presensis**
```
- id, userId, geofenceId
- latitude, longitude, accuracyM
- distanceM, insideGeofence
- status (VALID/INVALID/PENDING)
- statusReason, suspiciousFlag, suspiciousReason
- buktiFoto, checkIn, checkOut
- verifiedBy, verifiedAt, verificationNote
- clientTimestamp, serverTimestamp
- createdAt, updatedAt
```

---

## **📱 Halaman Frontend**

| Route | Komponen | Akses | Deskripsi |
|-------|----------|-------|-----------|
| `/login` | LoginPage | Public | Form login |
| `/register` | RegisterPage | Public | Form registrasi |
| `/dashboard` | DashboardPage | Auth | Dashboard utama |
| `/presensi` | PresensiPage | Auth | Check-in/out dengan peta & selfie |
| `/history` | HistoryPage | Auth | Riwayat presensi personal |
| `/reports` | ReportPage | Admin | Laporan harian |
| `/admin/geofences` | GeofenceManagementPage | Admin | CRUD geofence dengan peta interaktif |
| `/admin/presensi` | AdminPresensiPage | Admin | Monitor & verifikasi presensi |

---

## **🔐 Alur Validasi Check-In**

```
1. User buka halaman Presensi
2. Browser minta izin lokasi (GPS dengan enableHighAccuracy)
3. Ambil foto selfie via webcam
4. Klik Check-In
   │
   ├─→ Backend validasi:
   │   ├─ Cek akurasi GPS ≤ MAX_GPS_ACCURACY_M
   │   ├─ Ambil geofence aktif
   │   ├─ Hitung jarak dengan Haversine
   │   ├─ Deteksi speed anomaly (>200 km/h = spoofing)
   │   │
   │   └─→ Tentukan status:
   │       ├─ VALID: dalam geofence, akurasi OK
   │       ├─ INVALID: di luar geofence ATAU akurasi buruk
   │       └─ PENDING: ada flag suspicious
   │
5. Response dengan status + jarak + detail
6. Admin dapat verifikasi presensi PENDING
```

---

## **📁 Struktur Folder**

```
PROJECT_Group-2_Geolocation-Camera/
├── node-server/
│   ├── config/           # Konfigurasi database
│   ├── controllers/      # Logic bisnis
│   ├── middleware/       # Auth & permission
│   ├── migrations/       # Schema database
│   ├── models/           # Sequelize models
│   ├── routes/           # API routes
│   ├── uploads/          # Foto selfie
│   ├── utils/            # Helper functions (geolocation)
│   ├── validators/       # Input validation
│   ├── .env              # Environment variables
│   └── server.js         # Entry point
│
├── react/
│   ├── public/           # Static files
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── api.js        # Axios instance
│   │   ├── App.js        # Routes & layout
│   │   └── index.js      # Entry point
│   ├── .env              # Environment variables
│   └── tailwind.config.js
│
└── README.md
```

---

## **🛠️ Teknologi yang Digunakan**

### **Backend**
- Node.js + Express.js 5.1
- Sequelize ORM 6.37
- MySQL
- JWT (jsonwebtoken)
- Multer (file upload)
- Helmet (security headers)
- express-rate-limit

### **Frontend**
- React 19.2 (Create React App)
- React Router DOM 7
- React Leaflet 5 (OpenStreetMap)
- React Webcam 7
- Tailwind CSS 3
- Axios
- jwt-decode

---

## **👥 Anggota Kelompok**

| No | Nama | NIM |
|----|------|-----|
| 1 | [Nama Anggota 1] | [NIM] |
| 2 | [Nama Anggota 2] | [NIM] |
| 3 | [Nama Anggota 3] | [NIM] |

---

## **📄 Lisensi**

Proyek ini dibuat untuk keperluan pembelajaran mata kuliah Pengembangan Aplikasi Web (PAW).

---

## **🔧 Troubleshooting**

### Database connection error
```bash
# Pastikan MySQL berjalan dan kredensial di .env benar
# Cek port MySQL (default 3306, proyek ini menggunakan 3307)
```

### CORS error
```bash
# Pastikan FRONTEND_ORIGIN di backend .env sesuai dengan URL frontend
# Contoh: FRONTEND_ORIGIN=http://localhost:3000
```

### Geofence tidak muncul
```bash
# Pastikan sudah membuat dan mengaktifkan geofence via admin
# Hanya satu geofence yang bisa aktif pada satu waktu
```

### GPS akurasi rendah
```bash
# Gunakan koneksi internet stabil
# Aktifkan GPS/Location Services di device
# Browser modern dengan HTTPS lebih akurat
```

