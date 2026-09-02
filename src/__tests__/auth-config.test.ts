import { describe, it, expect } from "vitest";
import { authConfig } from "@/lib/auth.config";

describe("authConfig", () => {
  it("has trustHost enabled", () => {
    expect(authConfig.trustHost).toBe(true);
  });

  it("has signIn page set to /login", () => {
    expect(authConfig.pages?.signIn).toBe("/login");
  });

  it("includes Google provider", () => {
    expect(authConfig.providers.length).toBeGreaterThanOrEqual(1);
  });

  it("has an authorized callback", () => {
    expect(authConfig.callbacks?.authorized).toBeTypeOf("function");
  });
});

describe("authorized callback", () => {
  const authorized = authConfig.callbacks!.authorized! as (params: {
    auth: { user?: Record<string, unknown> } | null;
    request: { nextUrl: URL };
  }) => Response | boolean;

  const protectedPaths = [
    "/dashboard",
    "/dashboard/overview",
    "/groups",
    "/groups/123",
    "/expenses",
    "/expenses/456",
    "/friends",
    "/friends/add",
    "/settings",
    "/settings/profile",
    "/activity",
    "/activity/recent",
  ];

  const publicPaths = ["/", "/login", "/about", "/api/health"];

  it.each(protectedPaths)(
    "redirects unauthenticated user from %s to /login",
    (path) => {
      const result = authorized({
        auth: null,
        request: { nextUrl: new URL(`http://localhost:3000${path}`) },
      });
      expect(result).toBeInstanceOf(Response);
      const location = (result as Response).headers.get("location");
      expect(location).toBe("http://localhost:3000/login");
    },
  );

  it.each(protectedPaths)(
    "allows authenticated user to access %s",
    (path) => {
      const result = authorized({
        auth: { user: { id: "1", name: "Test" } },
        request: { nextUrl: new URL(`http://localhost:3000${path}`) },
      });
      expect(result).toBe(true);
    },
  );

  it.each(publicPaths)(
    "allows unauthenticated user to access %s",
    (path) => {
      const result = authorized({
        auth: null,
        request: { nextUrl: new URL(`http://localhost:3000${path}`) },
      });
      expect(result).toBe(true);
    },
  );

  it("preserves the request host in redirect URL", () => {
    const result = authorized({
      auth: null,
      request: {
        nextUrl: new URL("https://splitnice-beta.vercel.app/dashboard"),
      },
    });
    expect(result).toBeInstanceOf(Response);
    const location = (result as Response).headers.get("location");
    expect(location).toBe("https://splitnice-beta.vercel.app/login");
  });
});

describe("middleware matcher coverage", () => {
  const expectedBareRoutes = [
    "/dashboard",
    "/groups",
    "/expenses",
    "/friends",
    "/settings",
    "/activity",
  ];

  const expectedChildRoutes = [
    "/dashboard/:path*",
    "/groups/:path*",
    "/expenses/:path*",
    "/friends/:path*",
    "/settings/:path*",
    "/activity/:path*",
  ];

  it("middleware.ts exports a matcher that includes bare and child patterns", async () => {
    const fs = await import("fs");
    const content = fs.readFileSync("src/middleware.ts", "utf-8");

    for (const route of [...expectedBareRoutes, ...expectedChildRoutes]) {
      expect(content).toContain(`"${route}"`);
    }
  });
});
