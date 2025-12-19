import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import Admin from "@/models/Admin";
import { connectDB } from "@/lib/db";

export async function POST(req: Request) {
  await connectDB();

  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: "Email & Password required" }, { status: 400 });
  }

  const exists = await Admin.findOne({ email });
  if (exists) {
    return NextResponse.json({ error: "Admin already exists" }, { status: 400 });
  }
  
  const hashed = await bcrypt.hash(password, 10);

  await Admin.create({ email, password: hashed });

  return NextResponse.json({ message: "Admin created successfully" });
}
