# NeKafe API — Core POS System (Version 1.0) ☕🚀

Backend API kokoh dan aman berbasis **Express.js** dan **TypeScript** untuk sistem Kasir / Point of Sales (POS) Kafe Modern. Proyek ini dibangun menggunakan arsitektur modular yang memisahkan Router dan Controller, serta menggunakan **Prisma ORM** yang terhubung dengan cloud database **Neon.tech (PostgreSQL)**.

---

## 🔥 Fitur Utama (v1.0)

*   **🔒 Secure Authentication & RBAC**: Registrasi dan login staf menggunakan enkripsi `bcrypt` untuk password dan `JWT (JSON Web Token)` untuk manajemen session. Hak akses dijaga ketat per endpoint menggunakan *Role-Based Access Control* (`admin`, `manager`, `kasir`).
*   **📂 CRUD Categories**: Manajemen kategori menu makanan dan minuman (dilengkapi pengaman agar kategori yang masih memiliki produk tidak bisa dihapus).
*   **☕ CRUD Products/Menu**: Manajemen produk lengkap dengan validasi relasi kategori dan status ketersediaan (*safe-delete guard* untuk produk yang sudah masuk riwayat transaksi).
*   **💸 Secure Interactive Transactions**: Pembuatan pesanan (`Order` & `OrderItem`) yang dibungkus menggunakan atomisitas **Prisma Interactive Transactions (`prisma.$transaction`)**. Menjamin pemotongan stok otomatis berjalan aman dan mencegah inkonsistensi data keuangan/stok jika terjadi kegagalan sistem.
*   **💳 Payment Process**: Pencatatan riwayat pembayaran terintegrasi (`Cash`, `QRIS`, `Debit`) yang otomatis memperbarui status transaksi menjadi lunas (`paid`) dan selesai (`completed`).

---

## 🛠️ Tech Stack & Dependensi

*   **Runtime & Language**: Node.js, TypeScript (Strict Mode)
*   **Framework**: Express.js (ES Modules)
*   **Database & ORM**: PostgreSQL (Neon.tech Cloud), Prisma ORM
*   **Security & Utilities**: JWT (jsonwebtoken), bcrypt, dotenv

---

## 🚀 Cara Menjalankan Proyek di Lokal (Fedora / Linux)

### 1. Kloning dan Masuk ke Direktori Proyek
```bash
cd /home/wazy/Documents/Dev/nekafe/backend-api
```
### 2. Install Dependensi
```bash
npm install
```
### 3. Konfigurasi Environment Variables
Buat file .env di root folder proyek ini dan isi dengan kredensial berikut (Pastikan file ini masuk ke dalam .gitignore agar tidak bocor ke GitHub):
Cuplikan kode
```bash
PORT=5000
DATABASE_URL="postgresql://user:password@endpoint.neon.tech/nekafe?sslmode=require"
JWT_SECRET="isi_dengan_string_rahasia_dan_panjang_kamu"
```
### 4. Jalankan Migrasi Database (Prisma)
Pastikan skema database kamu tersinkronisasi dengan cloud Neon.tech:
```bash
npx prisma migrate dev --name init
```
### 5. Jalankan Server dalam Mode Pengembangan
```bash
npm run dev
```
Server akan berjalan otomatis di http://localhost:5000.
📜 Ringkasan Endpoint API

Semua endpoint dilindungi oleh middleware keamanan utama. Pasang Header Authorization: Bearer <TOKEN_JWT> setelah Anda berhasil melakukan login.
👤 Autentikasi (/api/auth)

    POST /register -> Registrasi staf baru (Default role: kasir).

    POST /login -> Autentikasi user & generate Token JWT.

📂 Kategori Menu (/api/categories)

    POST / -> Tambah kategori baru (Hanya Admin/Manager).

    GET / -> Ambil semua daftar kategori.

    PUT /:id -> Edit nama kategori (Hanya Admin/Manager).

    DELETE /:id -> Hapus kategori (wajib kosong dari produk) (Hanya Admin/Manager).

☕ Produk / Menu Kafe (/api/products)

    POST / -> Tambah produk baru beserta relasi categoryId (Hanya Admin/Manager).

    GET / -> Ambil semua daftar produk beserta data kategorinya.

    GET /:id -> Detail spesifik satu produk.

    PUT /:id -> Update parsial data atau harga produk (Hanya Admin/Manager).

    DELETE /:id -> Hapus produk (wajib belum pernah dipesan) (Hanya Admin/Manager).

📥 Transaksi & Kasir (/api/orders)

    POST / -> Membuat pesanan baru (Otomatis memotong stok produk secara aman via transaksi DB).

    GET / -> Riwayat transaksi (Admin/Manager melihat semua, Kasir hanya melihat miliknya sendiri).

    GET /:id -> Detail nota/struk pesanan beserta rincian item.

💳 Pembayaran (/api/payments)

    POST / -> Memproses pembayaran nota order (Cash, QRIS, Debit). Otomatis mengubah status transaksi menjadi selesai dan lunas.
