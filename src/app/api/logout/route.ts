import { NextResponse } from "next/server";

export function GET() {
  const res = NextResponse.json({ message: "Logged out" });

  res.cookies.set("admin_token", "", {
    path: "/",
    expires: new Date(0),
  });

  return res;
}
