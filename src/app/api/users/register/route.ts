import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { createToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    await connectDB();

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { name, email, password, birthdate } = body;

    if (!email || !password) {
      return NextResponse.json(
        {
          success: false,
          message: "Email and password are required",
        },
        { status: 400 }
      );
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "User already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name || undefined, // Make name optional
      email,
      password: hashedPassword,
      birthdate: birthdate ? new Date(birthdate) : undefined,
    });

    const token = createToken({ id: user._id.toString() });

    return NextResponse.json(
      {
        success: true,
        message: "User registered successfully",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          birthdate: user.birthdate,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("USER REGISTER ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Server error",
        error: error.message,
      },
      { status: 500 }
    );
  }
}


