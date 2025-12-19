import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { createToken } from "@/lib/auth";

type Provider = "google" | "facebook";

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

    const { provider, providerId, email, name } = body as {
      provider: Provider;
      providerId: string;
      email?: string;
      name?: string;
    };

    if (!provider || !providerId) {
      return NextResponse.json(
        {
          success: false,
          message: "provider and providerId are required",
        },
        { status: 400 }
      );
    }

    const providerField =
      provider === "google" ? "googleId" : provider === "facebook" ? "facebookId" : null;

    if (!providerField) {
      return NextResponse.json(
        { success: false, message: "Unsupported provider" },
        { status: 400 }
      );
    }

    let user =
      (await User.findOne({ [providerField]: providerId })) ||
      (email ? await User.findOne({ email }) : null);

    if (!user) {
      if (!email || !name) {
        return NextResponse.json(
          {
            success: false,
            message: "name and email are required for first social login",
          },
          { status: 400 }
        );
      }

      user = await User.create({
        name,
        email,
        [providerField]: providerId,
      });
    } else if (!user[providerField as keyof typeof user]) {
      user[providerField as keyof typeof user] = providerId as any;
      await user.save();
    }

    const token = createToken({ id: user._id.toString() });

    return NextResponse.json(
      {
        success: true,
        message: "Social login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("SOCIAL LOGIN ERROR:", error);
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


