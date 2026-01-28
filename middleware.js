import { NextResponse } from "next/server";

export function middleware(req) {
  const isAdminRoute = req.nextUrl.pathname.startsWith("/admin");

  if (!isAdminRoute) {
    return NextResponse.next();
  }

  const authHeader = req.headers.get("authorization");

  if (!authHeader) {
    return new NextResponse("Auth required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Admin"',
      },
    });
  }

  const base64 = authHeader.split(" ")[1];
  const [user, pass] = atob(base64).split(":");

  const ADMIN_USER = process.env.ADMIN_USER || "admin";
  const ADMIN_PASS = process.env.ADMIN_PASS || "changeme";

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    return NextResponse.next();
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export const config = {
  matcher: ["/admin/:path*"],
};
