import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { sql, ensureSchema } from "@/lib/db";
import { createSession } from "@/lib/auth";

export async function POST(request) {
  const { username, password } = await request.json();

  if (!username || !password) {
    return NextResponse.json(
      { error: "Username dan password wajib diisi." },
      { status: 400 }
    );
  }

  await ensureSchema();

  const [user] = await sql`
    SELECT * FROM admin_user WHERE username = ${username.trim()}
  `;

  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return NextResponse.json(
      { error: "Username atau password salah." },
      { status: 401 }
    );
  }

  await createSession({
    uid: user.id,
    username: user.username,
    nama: user.nama,
    role: user.role || "admin",
  });

  return NextResponse.json({ ok: true });
}
