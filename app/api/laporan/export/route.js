import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { getSession } from "@/lib/auth";

function csvEscape(value) {
  if (value === null || value === undefined) return "";
  const str = value instanceof Date ? formatTimestamp(value) : String(value);
  if (/[",\n;]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function formatTimestamp(date) {
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

const COLUMNS = [
  ["kode", "Kode Laporan"],
  ["tanggal", "Tanggal"],
  ["pukul", "Pukul"],
  ["nama_pelapor", "Nama Pelapor"],
  ["afdeling", "Afdeling"],
  ["blok", "Blok"],
  ["tm", "TM"],
  ["kategori", "Kategori"],
  ["keterangan", "Keterangan"],
  ["lat", "Latitude"],
  ["lng", "Longitude"],
  ["status", "Status"],
  ["catatan_admin", "Catatan Admin"],
  ["dibuat_pada", "Dibuat Pada"],
  ["diperbarui_pada", "Diperbarui Pada"],
];

export async function GET(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  await ensureSchema();

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");

  let query = "SELECT * FROM laporan WHERE 1=1";
  const params = [];
  if (status && status !== "semua") {
    params.push(status);
    query += ` AND status = $${params.length}`;
  }
  query += " ORDER BY dibuat_pada DESC";

  const rows = await sql.unsafe(query, params);

  const header = COLUMNS.map(([, label]) => csvEscape(label)).join(";");
  const lines = rows.map((row) =>
    COLUMNS.map(([key]) => csvEscape(row[key])).join(";")
  );
  // BOM (\uFEFF) supaya Excel langsung mengenali encoding UTF-8 dengan benar
  const csv = "\uFEFF" + [header, ...lines].join("\r\n");

  const filename = `laporan-kehilangan-sawit-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
