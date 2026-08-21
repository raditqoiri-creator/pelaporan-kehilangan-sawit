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

  return NextResponse.json({ data: { ...laporan, foto } });
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

  const [existing] = await sql`SELECT id FROM laporan WHERE id = ${id}`;
  if (!existing) {
    return NextResponse.json({ error: "Laporan tidak ditemukan." }, { status: 404 });
  }

  const setClauses = [];
  const values = [];
  if (body.status && allowedStatus.includes(body.status)) {
    values.push(body.status);
    setClauses.push(`status = $${values.length}`);
  }
  if (typeof body.catatan_admin === "string") {
    values.push(body.catatan_admin);
    setClauses.push(`catatan_admin = $${values.length}`);
  }
  if (!setClauses.length) {
    return NextResponse.json({ error: "Tidak ada perubahan." }, { status: 400 });
  }
  setClauses.push("diperbarui_pada = now()");
  values.push(id);

  const query = `UPDATE laporan SET ${setClauses.join(", ")} WHERE id = $${values.length} RETURNING *`;
  const rows = await sql.unsafe(query, values);

  return NextResponse.json({ data: rows[0] });
}
