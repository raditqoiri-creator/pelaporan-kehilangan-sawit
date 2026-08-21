import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";

export const dynamic = "force-dynamic";

// Endpoint publik (tanpa login) — sengaja hanya mengembalikan field non-sensitif.
// Tidak menyertakan nama_pelapor, koordinat, tanda tangan, foto, atau catatan
// internal admin, supaya kode laporan yang bocor/ditebak tidak membuka data pribadi.
export async function GET(request) {
  await ensureSchema();

  const { searchParams } = new URL(request.url);
  const kode = (searchParams.get("kode") || "").trim().toUpperCase();

  if (!kode) {
    return NextResponse.json({ error: "Masukkan kode laporan." }, { status: 400 });
  }

  const [laporan] = await sql`
    SELECT kode, tanggal, pukul, afdeling, blok, kategori, status, dibuat_pada, diperbarui_pada
    FROM laporan
    WHERE kode = ${kode}
  `;

  if (!laporan) {
    return NextResponse.json(
      { error: "Kode laporan tidak ditemukan. Periksa kembali penulisannya." },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: laporan });
}
