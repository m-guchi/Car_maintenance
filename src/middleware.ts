import NextAuth from "next-auth";
import { NextResponse } from "next/server";

import { authConfig } from "@/auth.config";
import { applyAuthUrlEnv, applyAuthUrlFromRequest } from "@/lib/auth-url";

applyAuthUrlEnv();

const { auth } = NextAuth(authConfig);

const publicPaths = ["/login", "/api/auth"];

function isPublicPath(pathname: string): boolean {
  return publicPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`),
  );
}

export default auth((req) => {
  applyAuthUrlFromRequest(req.url, req.headers.get("host"));

  const { pathname } = req.nextUrl;

  if (isPublicPath(pathname)) {
    if (req.auth?.user?.id && pathname === "/login") {
      return NextResponse.redirect(new URL("/", req.url));
    }
    return NextResponse.next();
  }

  if (!req.auth?.user?.id) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|icons|sw.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
