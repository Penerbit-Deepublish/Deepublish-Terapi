import { ok } from "@/app/api/_utils/http";
import { AUTH_COOKIE } from "@/lib/auth";

export async function POST() {
  const response = ok({ logged_out: true });
  response.cookies.set({ name: AUTH_COOKIE, value: "", path: "/", maxAge: 0 });
  return response;
}
