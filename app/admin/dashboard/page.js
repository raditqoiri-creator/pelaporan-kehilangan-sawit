import { sql, ensureSchema } from "@/lib/db";
import { getSession } from "@/lib/auth";
import DashboardClient from "@/components/admin/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getSession();
  await ensureSchema();
  const rows = await sql`SELECT * FROM laporan ORDER BY dibuat_pada DESC`;

  return (
    <DashboardClient
      initialData={rows}
      adminName={session?.nama || "Administrator"}
      adminRole={session?.role || "admin"}
    />
  );
}
