import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";

// Endpoint diagnostik: buka /api/health setelah deploy untuk memastikan
// semua environment variable & koneksi database/storage sudah benar,
// tanpa perlu bongkar Vercel logs satu-satu.
export async function GET() {
  const envCheck = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
    SUPABASE_SERVICE_ROLE_KEY: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    SUPABASE_STORAGE_BUCKET: Boolean(process.env.SUPABASE_STORAGE_BUCKET),
    SESSION_SECRET: Boolean(process.env.SESSION_SECRET),
    ADMIN_USERNAME: Boolean(process.env.ADMIN_USERNAME),
    ADMIN_PASSWORD: Boolean(process.env.ADMIN_PASSWORD),
  };

  const missingEnv = Object.entries(envCheck)
    .filter(([, present]) => !present)
    .map(([key]) => key);

  let database = "belum dicek";
  try {
    await ensureSchema();
    const rows = await sql`SELECT COUNT(*)::int AS count FROM laporan`;
    database = `ok (${rows[0].count} laporan tersimpan)`;
  } catch (err) {
    database = `error: ${err.message}`;
  }

  const allOk = missingEnv.length === 0 && database.startsWith("ok");

  return NextResponse.json(
    {
      status: allOk ? "sehat" : "ada masalah",
      env: envCheck,
      missingEnv,
      database,
      waktu: new Date().toISOString(),
    },
    { status: allOk ? 200 : 500 }
  );
}
