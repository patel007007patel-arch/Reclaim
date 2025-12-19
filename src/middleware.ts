import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyJWT } from "@/lib/verify";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow all public routes
  if (
    pathname.startsWith("/signin") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/api") || 
    pathname.startsWith("/_next") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Protect all other pages
  const token = req.cookies.get("admin_token")?.value;
  if (!token) return NextResponse.redirect(new URL("/signin", req.url));

  const decoded = await verifyJWT(token);
  if (!decoded) return NextResponse.redirect(new URL("/signin", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next).*)"],
};
