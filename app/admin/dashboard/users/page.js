import { redirect } from "next/navigation";
import { sql, ensureSchema } from "@/lib/db";
import { getSession } from "@/lib/auth";
import UsersClient from "@/components/admin/UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await getSession();
  if (session?.role !== "superadmin") {
    redirect("/admin/dashboard");
  }
  await ensureSchema();
  const rows = await sql`
    SELECT id, username, nama, role, dibuat_pada FROM admin_user ORDER BY dibuat_pada ASC
  `;
  return <UsersClient initialUsers={rows} currentUsername={session.username} />;
}
