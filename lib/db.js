import postgres from "postgres";
import bcrypt from "bcryptjs";

if (!process.env.DATABASE_URL) {
  console.warn(
    "[db] DATABASE_URL belum diatur. Tambahkan connection string Postgres dari Supabase (Transaction Pooler) di .env.local / Vercel Environment Variables."
  );
}

// Placeholder dipakai HANYA agar proses build Next.js tidak gagal saat
// DATABASE_URL belum di-set (mis. saat build lokal tanpa .env). postgres()
// tidak langsung membuka koneksi saat dipanggil, jadi ini aman — query
// sungguhan baru akan gagal saat runtime kalau env var memang belum diisi.
const CONNECTION_STRING =
  process.env.DATABASE_URL || "postgres://user:pass@localhost:5432/placeholder";

// prepare: false WAJIB untuk Supabase Transaction Pooler (Supavisor, port 6543)
// yang dipakai di lingkungan serverless seperti Vercel — pooler mode ini tidak
// mendukung prepared statement per-koneksi.
export const sql = postgres(CONNECTION_STRING, {
  prepare: false,
});

// Cache di scope modul: berjalan sekali per cold start Lambda (instance hangat
// akan memakai ulang koneksi & hasil ini, bukan membuat tabel berulang kali).
let schemaReadyPromise;

export function ensureSchema() {
  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS laporan (
          id SERIAL PRIMARY KEY,
          kode TEXT UNIQUE NOT NULL,
          tanggal TEXT NOT NULL,
          pukul TEXT NOT NULL,
          nama_pelapor TEXT NOT NULL,
          afdeling TEXT NOT NULL,
          blok TEXT NOT NULL,
          tm TEXT,
          kategori TEXT NOT NULL DEFAULT 'pencurian',
          keterangan TEXT NOT NULL,
          lat DOUBLE PRECISION,
          lng DOUBLE PRECISION,
          ttd_path TEXT,
          status TEXT NOT NULL DEFAULT 'baru',
          catatan_admin TEXT,
          dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now(),
          diperbarui_pada TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS dokumentasi (
          id SERIAL PRIMARY KEY,
          laporan_id INTEGER NOT NULL REFERENCES laporan(id) ON DELETE CASCADE,
          file_path TEXT NOT NULL,
          dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;

      await sql`
        CREATE TABLE IF NOT EXISTS admin_user (
          id SERIAL PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          nama TEXT NOT NULL,
          dibuat_pada TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `;

      const rows = await sql`SELECT COUNT(*)::int AS count FROM admin_user`;
      if (rows[0].count === 0) {
        const username = process.env.ADMIN_USERNAME || "admin";
        const password = process.env.ADMIN_PASSWORD || "sawit12345";
        const hash = bcrypt.hashSync(password, 10);
        await sql`
          INSERT INTO admin_user (username, password_hash, nama)
          VALUES (${username}, ${hash}, 'Administrator')
        `;
        console.log(
          `[seed] Akun admin default dibuat -> username: "${username}", password: "${password}". Segera ganti setelah login pertama.`
        );
      }
    })();
  }
  return schemaReadyPromise;
}

export function generateKode() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `KHS-${y}${m}${d}-${rand}`;
}
