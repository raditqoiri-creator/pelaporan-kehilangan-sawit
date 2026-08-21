import { sql, ensureSchema } from "@/lib/db";
import UsersClient from "@/components/admin/UsersClient";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  await ensureSchema();
  const rows = await sql`
    SELECT id, username, nama, dibuat_pada FROM admin_user ORDER BY dibuat_pada ASC
  `;
  return <UsersClient initialUsers={rows} />;
}
