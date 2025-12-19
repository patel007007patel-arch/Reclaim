import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// GET → only for browser test
export async function GET() {
  return NextResponse.json({
    ok: true,
    message: "✅ Create User API working. Send POST to create user.",
  });
}

// POST → create user
export async function POST(req: Request) {
  try {
    // ✅ 1. Connect DB
    await connectDB();

    // ✅ 2. Read body
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { email, password, name, birthdate } = body;

    // ✅ 3. Validate fields
    if (!email || !password || !name || !birthdate) {
      return NextResponse.json(
        {
          success: false,
          message: "All fields (email, password, name, birthdate) are required",
        },
        { status: 400 }
      );
    }

    // ✅ 4. Check duplicate user
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User already exists" },
        { status: 409 }
      );
    }

    // ✅ 5. Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // ✅ 6. Create user
    const user = await User.create({
      email,
      password: hashedPassword,
      name,
      birthdate: new Date(birthdate),
    });

    // ✅ 7. Return safe response
    return NextResponse.json(
      {
        success: true,
        message: "✅ User created successfully",
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          birthdate: user.birthdate,
          createdAt: user.createdAt,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("CREATE USER ERROR:", error);

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
