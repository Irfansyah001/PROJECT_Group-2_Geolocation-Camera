# **Tugas Praktikum PAW – RESTful API Presensi & Report dengan Express.js**

**Kelompok 2**
**Kelas:** TI-5E (PAW – E-PPAW-TI503P-2025)

---

## **Deskripsi Proyek**

Tugas ini merupakan lanjutan dari praktikum **Pengembangan Aplikasi Web (PAW)** yang berfokus pada:

* Implementasi **routing** dan **middleware** di Express.js
* Pembuatan **RESTful API** sederhana untuk fitur **Presensi Karyawan**
* Simulasi **role-based access (admin vs karyawan)** menggunakan middleware
* Penambahan **logging, error handling**, dan struktur aplikasi modular

Aplikasi ini menjalankan dua fitur utama:

1. **Presensi Karyawan** (Check-In & Check-Out)
2. **Laporan Harian (Report)** — hanya dapat diakses oleh **admin**

---

## **Langkah Menjalankan Proyek**

1. Buka terminal di folder:

   ```bash
   cd 20230140223-node-server
   ```

2. Install dependencies:

   ```bash
   npm install express cors morgan date-fns-tz
   ```

3. Jalankan server:

   ```bash
   node server.js
   ```

4. Akses API di browser atau Postman:

   ```
   http://localhost:3001/
   ```

---

## **Daftar Endpoint API**

### **Presensi (Karyawan)**

| HTTP Method | Endpoint                  | Deskripsi                         | Body (JSON) |
| ----------- | ------------------------- | --------------------------------- | ----------- |
| **POST**    | `/api/presensi/check-in`  | Menandai waktu masuk (check-in)   | –           |
| **POST**    | `/api/presensi/check-out` | Menandai waktu keluar (check-out) | –           |

**Contoh Respons – Check-In**

```json
{
  "message": "Halo User Karyawan, check-in Anda berhasil pada pukul 08:05:00 WIB",
  "data": {
    "userId": 123,
    "nama": "User Karyawan",
    "checkIn": "2025-10-21 08:05:00",
    "checkOut": null
  }
}
```

**Contoh Respons – Check-Out**

```json
{
  "message": "Selamat jalan User Karyawan, check-out Anda berhasil pada pukul 17:01:00 WIB",
  "data": {
    "userId": 123,
    "nama": "User Karyawan",
    "checkIn": "2025-10-21 08:05:00+07:00",
    "checkOut": "2025-10-21 17:01:00+07:00"
  }
}
```

---

### **Laporan (Admin)**

| HTTP Method | Endpoint             | Deskripsi                           | Hak Akses      |
| ----------- | -------------------- | ----------------------------------- | -------------- |
| **GET**     | `/api/reports/daily` | Mendapatkan laporan harian presensi | **Admin Only** |

**Contoh Respons**

```json
{
  "status": "success",
  "message": "Laporan harian berhasil diambil",
  "reportDate": "Selasa, 21 Oktober 2025 19.35",
  "totalRecords": 2,
  "data": [
    {
      "userId": 123,
      "nama": "User Karyawan",
      "checkIn": "2025-10-21T08:05:00.000Z",
      "checkOut": "2025-10-21T17:01:00.000Z"
    }
  ]
}
```

---

## **Middleware yang Digunakan**

### **1. `cors`**

```js
app.use(cors());
```

→ Mengizinkan API diakses dari domain lain (misalnya frontend React).

### **2. `express.json()`**

```js
app.use(express.json());
```

→ Memungkinkan server membaca body berformat JSON.

### **3. `morgan('dev')`**

```js
app.use(morgan('dev'));
```

→ Mencatat aktivitas request otomatis ke console.

### **4. Logging Custom**

```js
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
```

→ Menampilkan waktu, method, dan URL setiap request secara manual.

### **5. `permisionMiddleware.js`**

```js
exports.addUserData = (req, res, next) => { ... }
exports.isAdmin = (req, res, next) => { ... }
```

→ Menyediakan **user dummy** dan memeriksa **role** sebelum akses endpoint.

---

## **Error Handling**

### **404 – Not Found**

```js
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint Not Found' });
});
```

### **Global Error Handler**

```js
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error' });
});
```

---

## **Fitur Utama**

* Presensi Check-In & Check-Out
* Report Harian hanya untuk Admin
* Middleware Role-Based Access
* Logging Otomatis & Manual
* Format Waktu WIB dengan `date-fns-tz`
* Struktur Modular (Controllers, Routes, Middleware)

---

## **Commit Log**

```bash
git add .
git commit -m "Add RESTful API Presensi & Report dengan Middleware, Logging, dan Error Handling"
git push origin main
```

---

## **🏫 Catatan Akhir**

Proyek ini merupakan bagian dari praktikum **Pengembangan Aplikasi Web (PAW)**
pada **Universitas Muhammadiyah Yogyakarta**
dengan fokus pada pemahaman:

> **Routing – Middleware – Error Handling – RESTful API Development menggunakan Express.js**

---

