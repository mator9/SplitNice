import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/groups/:path*",
    "/expenses/:path*",
    "/friends/:path*",
    "/settings/:path*",
    "/activity/:path*",
    "/api/groups/:path*",
    "/api/expenses/:path*",
    "/api/settlements/:path*",
    "/api/friends/:path*",
    "/api/notifications/:path*",
    "/api/search/:path*",
  ],
};
