import { NextResponse } from "next/server";
import { sql, ensureSchema } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function DELETE(_request, { params }) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }
  await ensureSchema();

  const id = Number(params.id);

  if (session.uid === id) {
    return NextResponse.json(
      { error: "Tidak bisa menghapus akun yang sedang login." },
      { status: 400 }
    );
  }

  const rows = await sql`SELECT COUNT(*)::int AS count FROM admin_user`;
  if (rows[0].count <= 1) {
    return NextResponse.json(
      { error: "Tidak bisa menghapus satu-satunya akun admin yang tersisa." },
      { status: 400 }
    );
  }

  await sql`DELETE FROM admin_user WHERE id = ${id}`;
  return NextResponse.json({ ok: true });
}
