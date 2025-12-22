import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/verify";
import Admin from "@/models/Admin";
import User from "@/models/User";

// Admin authentication helper - supports both cookie (browser) and Bearer token (Postman)
export async function verifyAdmin(req: NextRequest) {
  try {
    // Try to get token from cookie first (for browser requests)
    let token = req.cookies.get("admin_token")?.value;

    // If no cookie token, try Bearer token from Authorization header (for Postman/API clients)
    if (!token) {
      const authHeader = req.headers.get("authorization") || "";
      if (authHeader.startsWith("Bearer ")) {
        token = authHeader.slice(7);
      }
    }

    if (!token) {
      return {
        error: NextResponse.json(
          { success: false, message: "Not authenticated. Please login first." },
          { status: 401 }
        ),
        admin: null,
      };
    }

    const decoded = await verifyJWT(token);
    if (!decoded || !decoded.id) {
      return {
        error: NextResponse.json(
          { success: false, message: "Invalid or expired token" },
          { status: 401 }
        ),
        admin: null,
      };
    }

    const admin = await Admin.findById(decoded.id).select("-password").lean();
    if (!admin) {
      return {
        error: NextResponse.json(
          { success: false, message: "Admin not found" },
          { status: 404 }
        ),
        admin: null,
      };
    }

    return { error: null, admin };
  } catch (error: any) {
    return {
      error: NextResponse.json(
        { success: false, message: "Authentication error", error: error.message },
        { status: 500 }
      ),
      admin: null,
    };
  }
}

// User authentication helper (Bearer token)
export async function verifyUser(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return {
        error: NextResponse.json(
          { success: false, message: "Missing Authorization header" },
          { status: 401 }
        ),
        user: null,
      };
    }

    const { verifyToken } = await import("@/lib/auth");
    const payload = verifyToken(token);
    
    if (!payload || !payload.id) {
      return {
        error: NextResponse.json(
          { success: false, message: "Invalid token" },
          { status: 401 }
        ),
        user: null,
      };
    }

    const user = await User.findById(payload.id).select("-password").lean();
    if (!user) {
      return {
        error: NextResponse.json(
          { success: false, message: "User not found" },
          { status: 404 }
        ),
        user: null,
      };
    }

    return { error: null, user };
  } catch (error: any) {
    return {
      error: NextResponse.json(
        { success: false, message: "Authentication error", error: error.message },
        { status: 500 }
      ),
      user: null,
    };
  }
}

