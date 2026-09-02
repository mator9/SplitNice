import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const protectedPrefixes = [
  "/dashboard",
  "/groups",
  "/expenses",
  "/friends",
  "/settings",
  "/activity",
];

function hasSessionCookie(req: NextRequest): boolean {
  return (
    req.cookies.has("authjs.session-token") ||
    req.cookies.has("__Secure-authjs.session-token")
  );
}

export default function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isProtected = protectedPrefixes.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );

  if (isProtected && !hasSessionCookie(req)) {
    return new NextResponse(null, {
      status: 307,
      headers: { Location: "/login" },
    });
  }

  return NextResponse.next();
}

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
