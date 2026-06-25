# 🌟 GLASS - Gamified Student Portal & Lecturer Dashboard (Odoo 17 Addons)

Selamat datang di **GLASS**, sebuah platform portal mahasiswa dan dosen berbasis web yang dikembangkan khusus sebagai modul kustom (Addons) untuk **Odoo 17**. Proyek ini menggabungkan sistem manajemen akademik konvensional dengan elemen **Gamifikasi (RPG-style)** untuk meningkatkan keterlibatan mahasiswa dalam kegiatan perkuliahan, presensi, dan pengerjaan tugas.

---

## 🚀 Fitur Utama (Key Features)

### 1. 🎓 Portal & Dashboard Mahasiswa (Student Portal)
* **Dashboard RPG-Style:** Menampilkan informasi profil mahasiswa, level, total XP, saldo Koin, peringkat leaderboard, dan visual karakter avatar 2D yang sedang digunakan.
* **Top HUD Stats:** Indikator koin dan XP dengan desain pill modern, transisi hover halus, dan pencahayaan dinamis.
* **Pengaturan Akun (Settings Modal):** Kustomisasi preferensi bahasa dan peralihan instan antara tema **Light Mode** dan **Dark Mode** secara global.

### 2. 🏆 Peringkat & Gamifikasi (XP & Leaderboard)
* **Leaderboard Interaktif:** Pemeringkatan mahasiswa secara real-time berdasarkan total perolehan XP dalam lingkup angkatan (7 digit NIM pertama).
* **Podium Juara Premium:** Desain podium 3D/glassmorphic khusus untuk peringkat 1 (Gold), 2 (Silver), dan 3 (Bronze) lengkap dengan efek animasi *Podium Aura* dan *orbiting particle dust* yang sangat memukau.

### 3. 🛍️ Toko Reward (Gamified Coin Shop)
* **Penukaran Koin (Redeem Shop):** Mahasiswa dapat membelanjakan koin hasil presensi dan tugas mereka untuk menukar voucher (WiFi kampus, kantin, perpustakaan, cetak gratis) atau membeli avatar baru.
* **Master Avatar Premium:** Koleksi avatar premium dengan variasi harga koin dan tingkat kelangkaan (Rarity).
* **Smart Image Processing (PIL-based):** Sistem otomatis saat pengunggahan gambar avatar baru ke database:
  * **Auto-Background Removal:** Menghapus pola kotak-kotak (*checkered*) atau warna solid pada latar belakang luar menjadi transparan secara otomatis menggunakan algoritme *BFS Flood-fill*.
  * **Auto-Cropping & Centering:** Mendeteksi batas objek karakter secara presisi menggunakan *bounding box* dengan *safety padding* 5% untuk melindungi aset dari pemotongan berlebihan.
  * **Square Standardization (1:1 Ratio):** Mengubah rasio gambar menjadi bujursangkar sempurna dan mengubah ukurannya ke **512x512 piksel** dengan filter Lanczos berkualitas tinggi.

### 4. 📝 Sistem Presensi Cerdas & Anti-Curang (Smart Attendance)
* **QR/Barcode Scanner:** Pemindaian presensi langsung melalui kamera perangkat mahasiswa.
* **Device Binding:** Mengunci akun mahasiswa ke satu ID perangkat fisik (`Device ID`) untuk mencegah penitipan presensi dari jarak jauh.
* **Biometrik Wajah (Face Recognition):** Pencocokan wajah mahasiswa menggunakan *Vektor Face Descriptor* yang disimpan terenkripsi dengan algoritme **AES-256** demi keamanan tingkat tinggi.

### 5. 👨‍🏫 Portal Dosen (Lecturer Portal)
* **Manajemen Sesi Presensi:** Dosen dapat membuka, mengatur batas waktu presensi, dan melihat log kehadiran mahasiswa secara real-time.
* **Fitur Sortir & Detail Mahasiswa:** Mengurutkan daftar kehadiran mahasiswa secara interaktif berdasarkan kolom tabel dan mengakses halaman profil detail mahasiswa yang melakukan presensi.
* **Manajemen Tugas & Kelas:** Mengontrol daftar tugas mahasiswa dan memberikan penilaian langsung yang akan dikonversi menjadi XP & Koin mahasiswa.

---

## 🛠️ Spesifikasi Teknologi (Tech Stack)

* **Core Platform:** Odoo 17.0 Community Edition
* **Backend Language:** Python 3.10+
* **Database:** PostgreSQL 12+
* **Frontend Web:** HTML5, Vanilla CSS3 (Custom Glassmorphism Design System), JavaScript (ES6, Odoo JSON-RPC API)
* **Pustaka Python Utama:**
  * `Pillow (PIL)` - Untuk manipulasi dan standardisasi gambar avatar.
  * `pycryptodome` - Untuk enkripsi biometrik AES-256.
  * `psycopg2` - Untuk integrasi query database PostgreSQL.

---

## 📂 Struktur Proyek Utama (Directory Structure)

```text
d:\Glass\
├── Avatar/                        # Folder lokal tempat penyimpanan aset file avatar mentah
├── custom_web/                    # Modul utama Odoo untuk tampilan portal web mahasiswa & dosen
│   ├── controllers/               # Controller routing (Auth, Mahasiswa Portal, Dosen Portal)
│   ├── static/                    # Aset statis frontend
│   │   ├── src/
│   │   │   ├── css/               # File stylesheet (dashboard.css, shop.css, dosen_presensi.css, dll.)
│   │   │   ├── js/                # File logika JS (shop.js, settings_handler.js, tugas_mahasiswa.js)
│   │   │   └── img/               # Gambar-gambar aset default lokal
│   │   └── views/                 # XML Templates untuk halaman web (dashboard.xml, shop.xml, layout.xml)
├── shop/                          # Sub-modul Odoo untuk mengelola master data avatar, voucher, dan transaksi
│   └── models/
│       └── shop.py                # Definisi model shop.avatar, shop.voucher, dan logika pemrosesan gambar
├── presensi/                      # Sub-modul Odoo untuk mencatat kehadiran, device binding, & biometrik wajah
└── mahasiswa/                     # Sub-modul Odoo untuk mengelola master data mahasiswa, XP, dan koin
```

---

## ⚙️ Cara Instalasi & Menjalankan Modul

### 1. Prasyarat
Pastikan Odoo 17.0 sudah terinstal di sistem Anda (Windows/Linux) dan database PostgreSQL berjalan dengan benar.

### 2. Pemasangan Addons
Salin folder-folder modul berikut ke dalam direktori `addons` Odoo Anda, atau tambahkan path proyek ini ke parameter `addons_path` di file konfigurasi `odoo.conf`:
* `custom_web`
* `shop`
* `presensi`
* `mahasiswa`

Contoh pada `odoo.conf`:
```ini
addons_path = C:\Program Files\Odoo 17.0.20260217\server\odoo\addons, d:\Glass
```

### 3. Instalasi Pustaka Python
Jalankan perintah berikut di terminal server Odoo untuk menginstal dependensi gambar dan enkripsi:
```bash
pip install Pillow pycryptodome
```

### 4. Restart & Upgrade Modul
1. Restart layanan server Odoo Anda (`odoo-server`).
2. Masuk ke halaman Odoo Backend sebagai Administrator.
3. Aktifkan **Developer Mode**.
4. Pergi ke menu **Apps** -> Klik **Update Apps List**.
5. Cari modul **`custom_web`** dan klik **Activate** atau **Upgrade**.

---

## 🔒 Catatan Keamanan & Kredensial Pengembang
* Konfigurasi hak akses Windows filestore diatasi menggunakan opsi penyimpanan database (`ir_attachment.location = 'db'`) selama proses impor massal untuk mencegah error *Permission Denied*.
* Kredensial default PostgreSQL lokal pengembang menggunakan user `openpg` dengan password `koentji`.
* Seluruh perubahan dan perbaikan fitur terbaru dikembangkan di bawah Git Branch kustom bernama **`Perubahan`**.

---

*Dibuat dengan 💖 untuk menciptakan pengalaman belajar mengajar yang interaktif, modern, dan menyenangkan.*
