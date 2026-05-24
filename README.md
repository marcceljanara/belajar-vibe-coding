# Belajar Vibe Coding

Belajar Vibe Coding adalah sebuah proyek backend API yang dibangun menggunakan [Bun](https://bun.sh/) dan [Elysia](https://elysiajs.com/). Proyek ini merupakan implementasi sistem autentikasi sederhana (Register, Login, Logout) dan manajemen sesi berbasis token menggunakan database relasional MySQL.

## Teknologi dan Library

- **Runtime:** [Bun](https://bun.sh/) (Runtime JavaScript yang cepat & lengkap).
- **Framework Web:** [ElysiaJS](https://elysiajs.com/) (Web framework yang sangat cepat dan ringan untuk Bun).
- **ORM / Database:** [Drizzle ORM](https://orm.drizzle.team/) dipadukan dengan driver `mysql2`.
- **Database:** MySQL.
- **Testing:** Bun Test (Bawaan dari Bun runtime).

## Arsitektur dan Struktur Folder

Proyek ini menggunakan struktur arsitektur modular dengan pemisahan *concern* antara _routing_ (kontroler), _services_ (logika bisnis), dan _database_:

```text
.
├── src/
│   ├── index.ts           # Entry point utama aplikasi (menjalankan app.listen)
│   ├── app.ts             # Definisi aplikasi Elysia, mendaftarkan routes & endpoint
│   ├── db/
│   │   ├── index.ts       # Setup koneksi database dan inisialisasi Drizzle ORM
│   │   └── schema.ts      # Definisi tabel (schema) database untuk Drizzle
│   ├── routes/
│   │   └── users-route.ts # File untuk menangani routing/endpoint HTTP (Controller layer)
│   └── services/
│       └── users-service.ts # File untuk logika bisnis pengguna (Query ke DB, hashing, dll)
├── tests/
│   ├── db-helper.ts       # Fungsi pembantu untuk membersihkan DB saat unit test berjalan
│   ├── index.test.ts      # Unit test untuk API dasar (Root & /users)
│   └── users.test.ts      # Unit test untuk seluruh endpoint sistem autentikasi (/api/users)
├── drizzle/               # Folder untuk file-file migrasi database dari Drizzle
├── drizzle.config.ts      # Konfigurasi Drizzle Kit
├── package.json           # Definisi dependencies & script proyek
├── .env                   # File berisi variabel environment (seperti kredensial database)
└── issue.md               # Dokumen perencanaan & scenario testing (dokumentasi internal)
```

## Database Schema

Database menggunakan MySQL dengan struktur dua tabel utama (didefinisikan di `src/db/schema.ts`):

1. **`users`**
   - `id`: `INT` (Primary Key, Auto Increment)
   - `name`: `VARCHAR(255)` (Nama pengguna)
   - `email`: `VARCHAR(255)` (Email pengguna, Unique)
   - `password`: `VARCHAR(255)` (Password yang sudah di-*hash* menggunakan bcrypt bawaan Bun)
   - `createdAt`: `TIMESTAMP` (Waktu pendaftaran)

2. **`sessions`**
   - `id`: `INT` (Primary Key, Auto Increment)
   - `token`: `VARCHAR(255)` (Token sesi / UUID yang digenerate setelah login sukses)
   - `userId`: `INT` (Foreign Key mengarah ke `users.id`)
   - `createdAt`: `TIMESTAMP` (Waktu login)

## Endpoint API yang Tersedia

Berikut adalah endpoint API yang bisa digunakan pada aplikasi ini:

### 1. Root & General
- `GET /`
  - Mengembalikan pesan "Hello World".
- `GET /users`
  - Mengambil daftar semua user yang tersimpan di dalam database.

### 2. Autentikasi (`/api/users`)
- `POST /api/users`
  - **Fungsi:** Register pengguna baru.
  - **Body (JSON):** `name`, `email`, `password`
- `POST /api/users/login`
  - **Fungsi:** Login pengguna, menghasilkan token sesi.
  - **Body (JSON):** `email`, `password`
  - **Response:** Mengembalikan UUID token yang wajib disimpan di _client_.
- `GET /api/users/current`
  - **Fungsi:** Mengambil profil pengguna yang saat ini sedang login.
  - **Headers:** `Authorization: Bearer <token>`
- `DELETE /api/users/logout`
  - **Fungsi:** Melakukan logout dengan menghapus/membatalkan token dari tabel `sessions`.
  - **Headers:** `Authorization: Bearer <token>`

---

## Cara Setup Project

Ikuti langkah-langkah di bawah ini untuk mengatur dan menjalankan proyek di lokal komputer Anda:

### 1. Instalasi Dependencies

Pastikan Anda sudah menginstal [Bun](https://bun.sh/) di komputer Anda. Lalu instal dependency proyek:

```bash
bun install
```

### 2. Konfigurasi Environment

Buat atau edit file `.env` di _root directory_ proyek dan isi dengan kredensial MySQL Anda:

```env
PORT=3000
DATABASE_URL=mysql://root:password@localhost:3306/belajar_vibe_coding
```
*(Ganti `root`, `password`, dan nama database `belajar_vibe_coding` sesuai dengan konfigurasi lokal Anda)*

### 3. Migrasi Database

Sebelum menjalankan server, dorong (push) schema database ke MySQL menggunakan Drizzle Kit:

```bash
bunx drizzle-kit push
```
_Catatan: Pastikan schema database (`belajar_vibe_coding`) sudah dibuat di dalam engine MySQL Anda sebelum menjalankan perintah migrasi di atas._

---

## Cara Menjalankan Aplikasi

Untuk menjalankan aplikasi dalam mode pengembangan (_watch mode_), jalankan:

```bash
bun run dev
```

Aplikasi akan berjalan pada alamat HTTP default di `http://localhost:3000`.

Untuk menjalankan aplikasi standar (produksi tanpa hot-reload):

```bash
bun run start
```

---

## Cara Menjalankan Unit Test

Aplikasi ini sudah dilindungi dengan serangkaian *Unit Test* menggunakan fitur bawaan `bun test`. Pengujian mencakup pengecekan validasi, skenario berhasil dan gagal, hingga keamanan otorisasi via *Bearer Token Authentication*.

> **Perhatian:** Sebelum menjalankan test, _hook_ skenario pengujian akan otomatis membersihkan (menghapus) semua data di dalam tabel `sessions` dan `users` pada database yang tertulis di `DATABASE_URL`!

Jalankan perintah berikut untuk menjalankan seluruh skenario pengujian:

```bash
bun test
```
