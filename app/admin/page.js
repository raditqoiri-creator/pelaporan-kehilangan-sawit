import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function AdminIndex() {
  const session = await getSession();
  redirect(session ? "/admin/dashboard" : "/admin/login");
}
