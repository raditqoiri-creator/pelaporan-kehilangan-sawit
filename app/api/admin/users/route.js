import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, ensureSchema } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }
  await ensureSchema();
  const rows = await sql`
    SELECT id, username, nama, dibuat_pada FROM admin_user ORDER BY dibuat_pada ASC
  `;
  return NextResponse.json({ data: rows });
}

export async function POST(request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Tidak diizinkan." }, { status: 401 });
  }
  await ensureSchema();

  const { username, password, nama } = await request.json();
  if (!username || !password || !nama) {
    return NextResponse.json(
      { error: "Username, password, dan nama wajib diisi." },
      { status: 400 }
    );
  }
  if (String(password).length < 8) {
    return NextResponse.json(
      { error: "Password minimal 8 karakter." },
      { status: 400 }
    );
  }

  const [existing] = await sql`SELECT id FROM admin_user WHERE username = ${username.trim()}`;
  if (existing) {
    return NextResponse.json(
      { error: "Username sudah dipakai admin lain." },
      { status: 409 }
    );
  }

  const hash = bcrypt.hashSync(password, 10);
  const [created] = await sql`
    INSERT INTO admin_user (username, password_hash, nama)
    VALUES (${username.trim()}, ${hash}, ${nama.trim()})
    RETURNING id, username, nama, dibuat_pada
  `;

  return NextResponse.json({ data: created }, { status: 201 });
}
