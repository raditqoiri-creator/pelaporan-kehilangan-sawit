# Lapor Kehilangan Sawit

Aplikasi web pelaporan kehilangan/pencurian sawit untuk unit keamanan kebun,
dibangun agar siap **hosting di Vercel** dengan backend **gratis** (Supabase
free tier). Terdiri dari dua bagian yang terintegrasi dalam satu sistem:

1. **Formulir laporan (publik)** — `/` — dipakai petugas lapangan/mandor untuk
   melaporkan kejadian langsung dari HP: tanggal, pukul, nama pelapor,
   afdeling, blok, TM, kategori, keterangan, koordinat GPS (peta interaktif),
   tanda tangan digital, dan foto dokumentasi. Dilengkapi indikator progres,
   validasi tiap field, proteksi anti-spam (honeypot + cek waktu pengisian),
   dan tombol salin/bagikan kode laporan lewat WhatsApp setelah terkirim.
2. **Cek status laporan (publik)** — `/cek-status` — pelapor bisa memasukkan
   kode laporan untuk melihat status terkini (Baru → Diproses → Selesai)
   tanpa perlu login, tanpa membuka data sensitif (nama, koordinat, foto,
   tanda tangan tidak ditampilkan di sini).
3. **Dashboard admin** — `/admin` — khusus tim keamanan/kandir, login dengan
   akun admin, melihat semua laporan masuk (tampilan **Daftar** atau
   **Peta** dengan semua titik lokasi laporan), memfilter per status,
   mencari, membuka detail lengkap (peta, tanda tangan, foto), mengubah
   status, menambahkan catatan internal, **export ke CSV/Excel**, dan
   **auto-sinkron tiap 12 detik** — begitu ada laporan baru masuk, muncul
   notifikasi (banner, badge lonceng, judul tab browser, dan bunyi) tanpa
   perlu refresh manual.
4. **Kelola akun admin** — `/admin/dashboard/users` — tambah/hapus akun
   admin lain langsung dari dashboard (tidak perlu akses database manual).
   Ada pengaman: admin tidak bisa menghapus akunnya sendiri yang sedang
   login, dan satu-satunya admin yang tersisa tidak bisa dihapus.

## Stack teknis (100% bisa jalan di tier gratis)

- **Next.js 14** (App Router, JavaScript) — satu aplikasi untuk form publik,
  dashboard admin, dan API, semuanya terintegrasi. Hosting: **Vercel**
  (paket Hobby, gratis).
- **Supabase Postgres** (`postgres` / postgres.js, lewat Transaction Pooler)
  — database. Free tier Supabase: 500MB database, cukup untuk ribuan
  laporan teks.
- **Supabase Storage** (`@supabase/supabase-js`) — penyimpanan foto
  dokumentasi & tanda tangan digital. Free tier: 1GB storage.
- **Tailwind CSS** — styling.
- **Leaflet + OpenStreetMap** — peta interaktif untuk menandai koordinat
  lokasi kejadian (gratis, tanpa API key).
- **Signature pad custom (canvas)** — tanda tangan digital.
- **Sesi admin** — cookie HTTP-only yang ditandatangani (JWT via `jose`),
  password admin di-hash dengan `bcryptjs`.
- Font memakai font sistem (bukan Google Fonts) sehingga tetap tampil rapi
  walau jaringan terbatas.

## Fitur anti-spam & validasi

- **Honeypot** — field tersembunyi yang hanya bisa "dilihat" bot; kalau
  terisi, server membalas seolah sukses (kode palsu) tapi tidak menyimpan
  apa pun, supaya bot tidak sadar ditolak.
- **Cek waktu pengisian** — submit yang terjadi kurang dari 2.5 detik
  setelah form dimuat dianggap bot (manusia butuh waktu lebih untuk mengisi
  form selengkap ini) dan ditolak diam-diam.
- **Validasi field** — nama minimal 3 karakter, keterangan minimal 10
  karakter, foto maksimal 8MB/file, koordinat & tanda tangan wajib diisi,
  dengan pesan error yang jelas dan otomatis fokus ke field yang salah.
- Untuk proteksi anti-spam yang lebih ketat (rate-limit per IP), bisa
  ditambahkan integrasi Upstash Redis (juga tersedia gratis) — belum
  disertakan di versi ini supaya dependensi tetap minim.



## Setup Supabase (sekali di awal)

### 1. Buat project
Daftar gratis di [supabase.com](https://supabase.com) → **New Project** →
beri nama (mis. `lapor-kehilangan-sawit`) → set password database (simpan
baik-baik, dipakai di connection string) → pilih region terdekat (mis.
Singapore) → tunggu beberapa menit sampai project siap.

### 2. Ambil connection string database
Buka project → tombol **Connect** (di header) → tab **Connection string** →
pilih **Transaction pooler** (bukan direct connection — penting untuk
lingkungan serverless seperti Vercel) → salin URI-nya, ganti
`[YOUR-PASSWORD]` dengan password yang dibuat di langkah 1. Ini nilai untuk
`DATABASE_URL`.

### 3. Ambil Project URL & Service Role Key
**Project Settings → API** → salin **Project URL** (untuk `SUPABASE_URL`)
dan **service_role key** (untuk `SUPABASE_SERVICE_ROLE_KEY` — key ini
rahasia, jangan pernah dipakai di kode sisi browser, di project ini hanya
dipakai di server).

### 4. Buat bucket Storage
**Storage** (menu kiri) → **New bucket** → nama `lapor-kehilangan-sawit`
(atau nama lain, sesuaikan `SUPABASE_STORAGE_BUCKET`) → **aktifkan toggle
"Public bucket"** (supaya foto & tanda tangan bisa ditampilkan langsung di
dashboard admin tanpa signed URL) → Create bucket.

## Deploy ke Vercel

### 1. Push kode ke GitHub
Buat repo baru, push folder ini ke sana (jangan commit `node_modules` atau
`.env.local` — sudah diatur di `.gitignore`).

### 2. Import project di Vercel
Buka [vercel.com](https://vercel.com) → **Add New → Project** → pilih repo
GitHub tadi → framework otomatis terdeteksi sebagai Next.js.

### 3. Tambahkan Environment Variables
Di **Settings → Environment Variables** (atau di layar sebelum deploy
pertama), isi semua ini dari hasil setup Supabase di atas:

| Variabel | Nilai |
|---|---|
| `DATABASE_URL` | connection string Transaction Pooler dari Supabase |
| `SUPABASE_URL` | Project URL dari Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key dari Supabase |
| `SUPABASE_STORAGE_BUCKET` | nama bucket (mis. `lapor-kehilangan-sawit`) |
| `SESSION_SECRET` | string acak panjang & rahasia (mis. hasil `openssl rand -hex 32`) |
| `ADMIN_USERNAME` | username admin awal, mis. `admin` |
| `ADMIN_PASSWORD` | password admin awal, ganti dengan yang kuat |

### 4. Deploy
Klik **Deploy**. Tabel database dan akun admin pertama dibuat **otomatis**
saat request pertama kali masuk ke aplikasi (tidak perlu migrasi manual).

### 5. Login pertama & ganti password
Buka `https://<project-anda>.vercel.app/admin`, login dengan
`ADMIN_USERNAME` / `ADMIN_PASSWORD` yang sudah diatur di langkah 3.

## Menjalankan secara lokal (development)

```bash
npm install
cp .env.example .env.local
```

Isi `.env.local` dengan nilai yang sama seperti langkah "Setup Supabase" di
atas (project Supabase yang sama bisa dipakai untuk development & produksi,
atau buat project Supabase terpisah khusus development).

```bash
npm run dev
```

Buka `http://localhost:3000` untuk form laporan, dan
`http://localhost:3000/admin` untuk login admin.

## Struktur data

- Tabel `laporan`, `dokumentasi`, `admin_user` — otomatis dibuat di Supabase
  Postgres saat pertama kali aplikasi menerima request (lihat
  `ensureSchema()` di `lib/db.js`).
- Foto dokumentasi & tanda tangan digital disimpan sebagai object di bucket
  Supabase Storage, URL publiknya disimpan di kolom `ttd_path` /
  `dokumentasi.file_path`.

**Backup:** Supabase free tier menyimpan backup harian selama beberapa hari
(cek kebijakan retensi terbaru di dashboard Supabase). Untuk kebutuhan
jangka panjang, unduh dump database secara berkala lewat
**Database → Backups** atau `pg_dump`.

## Variabel lingkungan

| Variabel | Keterangan |
|---|---|
| `DATABASE_URL` | Connection string Postgres Supabase (Transaction Pooler, port 6543). |
| `SUPABASE_URL` | Project URL Supabase, dipakai untuk akses Storage. |
| `SUPABASE_SERVICE_ROLE_KEY` | Key rahasia dengan akses penuh ke Storage — hanya dipakai di server, jangan expose ke client. |
| `SUPABASE_STORAGE_BUCKET` | Nama bucket Storage untuk foto & tanda tangan (default: `lapor-kehilangan-sawit`). |
| `SESSION_SECRET` | Kunci rahasia untuk sesi login admin. Wajib diganti dengan string acak sebelum produksi. |
| `ADMIN_USERNAME` | Username admin yang dibuat otomatis saat pertama kali dijalankan. |
| `ADMIN_PASSWORD` | Password admin awal. Ganti setelah login pertama. |

## Menambah / menghapus akun admin

Akun admin bisa dikelola langsung dari dashboard tanpa akses database
manual — buka **Kelola akun admin** (link di header dashboard, atau
`/admin/dashboard/users`) untuk menambah admin baru (nama, username,
password minimal 8 karakter) atau menghapus admin yang sudah tidak aktif.

Dua pengaman bawaan:
- Admin tidak bisa menghapus akunnya sendiri yang sedang login (harus minta
  admin lain untuk menghapuskannya).
- Satu-satunya admin yang tersisa di sistem tidak bisa dihapus, supaya
  tidak ada yang terkunci di luar dashboard.

## Kustomisasi lanjutan

- Daftar **Afdeling** saat ini masih hardcode di
  `components/ReportForm.js` (`AFDELING_OPTIONS`) — sesuaikan dengan nama
  afdeling riil di kebun.
- Field **TM** dibuat sebagai penghitung angka sesuai referensi awal; ganti
  label/satuan di `ReportForm.js` bila TM di perusahaan punya makna khusus
  (mis. Tahun Tanam / jumlah unit kehilangan).
- Kategori laporan (`KATEGORI_OPTIONS` di `ReportForm.js` dan
  `KATEGORI_LABEL` di dashboard) bisa ditambah/disesuaikan.
- Interval auto-sinkron dashboard admin (default 12 detik) bisa diubah di
  `POLL_INTERVAL_MS` pada `components/admin/DashboardClient.js`.
