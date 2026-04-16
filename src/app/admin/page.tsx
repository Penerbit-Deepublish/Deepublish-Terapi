import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { AUTH_COOKIE } from "@/lib/env";
import { verifyAdminToken } from "@/lib/auth";

export default async function AdminIndexPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(AUTH_COOKIE)?.value;
  const admin = token ? verifyAdminToken(token) : null;
  redirect(admin ? "/admin/dashboard" : "/admin/login");
}
