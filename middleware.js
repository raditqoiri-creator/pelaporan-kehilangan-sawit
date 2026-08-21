import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "sawit_admin_session";
const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "ganti-secret-ini-di-env-production-please"
);

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin/dashboard")) {
    const token = request.cookies.get(SESSION_COOKIE)?.value;
    let valid = false;

    if (token) {
      try {
        await jwtVerify(token, SECRET);
        valid = true;
      } catch {
        valid = false;
      }
    }

    if (!valid) {
      const loginUrl = new URL("/admin/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/dashboard/:path*"],
};
