import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import Admin from "@/models/Admin";
import { connectDB } from "@/lib/db";
import { createToken } from "@/lib/auth";

export async function POST(req: Request) {
  await connectDB();

  const { email, password, keepLoggedIn } = await req.json();

  const admin = await Admin.findOne({ email });
  if (!admin)
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });

  const ok = await bcrypt.compare(password, admin.password);
  if (!ok)
    return NextResponse.json({ error: "Invalid credentials" }, { status: 400 });

  const token = createToken({ id: admin._id.toString() });

  const res = NextResponse.json({ 
    success: true,
    message: "Login successful",
    token, // Also return token in response for Postman/API clients
    admin: {
      id: admin._id,
      email: admin.email,
      name: (admin as any).name || admin.email.split("@")[0],
    }
  });

  res.cookies.set("admin_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: keepLoggedIn ? 60 * 60 * 24 * 7 : 60 * 60 * 24, // Default 24 hours
  });

  return res;
}
