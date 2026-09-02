import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

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
