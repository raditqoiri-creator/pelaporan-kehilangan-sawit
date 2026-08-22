import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_request, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  await ensureSchema();

  const id = Number(params.id);
  const [laporan] = await sql`SELECT * FROM laporan WHERE id = ${id}`;
  if (!laporan) {
    return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
  }
  const foto = await sql`SELECT id, file_path FROM dokumentasi WHERE laporan_id = ${id}`;
  const log = await sql`
    SELECT admin_username, aksi, detail, dibuat_pada FROM laporan_log
    WHERE laporan_id = ${id} ORDER BY dibuat_pada DESC
  `;

  return NextResponse.json({ data: { ...laporan, foto, log } });
}

export async function PATCH(request, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }

  await ensureSchema();

  const id = Number(params.id);
  const body = await request.json();
  const allowedStatus = ["baru", "diproses", "selesai"];

  const [existing] = await sql`SELECT id, kode, status FROM laporan WHERE id = ${id}`;
  if (!existing) {
    return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
  }

  const setClauses = [];
  const values = [];
  const logEntries = [];

  if (body.status && allowedStatus.includes(body.status)) {
    values.push(body.status);
    setClauses.push(`status = $${values.length}`);
    if (body.status !== existing.status) {
      logEntries.push({ aksi: "ubah_status", detail: `${existing.status} → ${body.status}` });
    }
  }
  if (typeof body.catatan_admin === "string") {
    values.push(body.catatan_admin);
    setClauses.push(`catatan_admin = $${values.length}`);
    logEntries.push({ aksi: "ubah_catatan", detail: null });
  }
  if (!setClauses.length) {
    return NextResponse.json({ error: "Tidak ada perubahan." }, { status: 400 });
  }
  setClauses.push("diperbarui_pada = now()");
  values.push(id);

  const query = `UPDATE laporan SET ${setClauses.join(", ")} WHERE id = $${values.length} RETURNING *`;
  const rows = await sql.unsafe(query, values);

  for (const entry of logEntries) {
    await sql`
      INSERT INTO laporan_log (laporan_id, laporan_kode, admin_username, aksi, detail)
      VALUES (${id}, ${existing.kode}, ${session.username}, ${entry.aksi}, ${entry.detail})
    `;
  }

  return NextResponse.json({ data: rows[0] });
}

export async function DELETE(_request, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }
  if (session.role !== "superadmin") {
    return NextResponse.json(
      { error: "Hanya superadmin yang bisa menghapus laporan." },
      { status: 403 }
    );
  }

  await ensureSchema();

  const id = Number(params.id);
  const [existing] = await sql`SELECT id, kode FROM laporan WHERE id = ${id}`;
  if (!existing) {
    return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
  }

  // Catat dulu sebelum dihapus — laporan_log tidak punya FK ke laporan supaya
  // riwayat "siapa menghapus apa" tetap ada walau laporannya sudah hilang.
  await sql`
    INSERT INTO laporan_log (laporan_id, laporan_kode, admin_username, aksi, detail)
    VALUES (${id}, ${existing.kode}, ${session.username}, 'hapus_laporan', NULL)
  `;
  await sql`DELETE FROM laporan WHERE id = ${id}`;

  return NextResponse.json({ ok: true });
}
