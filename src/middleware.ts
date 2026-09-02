import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

const { auth } = NextAuth({
  ...authConfig,
  callbacks: {
    ...authConfig.callbacks,
    authorized() {
      return true;
    },
  },
});

const protectedPrefixes = [
  "/dashboard",
  "/groups",
  "/expenses",
  "/friends",
  "/settings",
  "/activity",
];

export default auth((req) => {
  const isLoggedIn = !!req.auth?.user;
  const { pathname } = req.nextUrl;
  const isProtected = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/dashboard",
    "/dashboard/:path*",
    "/groups",
    "/groups/:path*",
    "/expenses",
    "/expenses/:path*",
    "/friends",
    "/friends/:path*",
    "/settings",
    "/settings/:path*",
    "/activity",
    "/activity/:path*",
    "/api/groups/:path*",
    "/api/expenses/:path*",
    "/api/settlements/:path*",
    "/api/friends/:path*",
    "/api/activity",
    "/api/activity/:path*",
    "/api/notifications/:path*",
    "/api/search/:path*",
  ],
};
