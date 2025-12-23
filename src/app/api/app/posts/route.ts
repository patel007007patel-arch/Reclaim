import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Post from "@/models/Post";
import { verifyUser } from "@/lib/auth-helpers";
import { uploadFileToFirebase } from "@/lib/firebase";

// GET: public community feed (approved, not deleted)
// No authentication required - public endpoint
export async function GET() {
  try {
    await connectDB();
    const items = await Post.find({
      status: "approved",
      visibility: "public",
      deletedAt: null,
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, items }, { status: 200 });
  } catch (error: any) {
    console.error("APP POST LIST ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

// POST: create post for logged-in user
// Authentication required - Bearer token in Authorization header
// 
// Supports two ways to provide image:
// 1. Upload image file: multipart/form-data with "image" field
// 2. Provide image URL: JSON body with "imageUrl" field
//
// Request format (multipart/form-data):
//   - title: string (required)
//   - content: string (required)
//   - image: File (optional) - will be uploaded to Firebase
//   - visibility: "public" | "private" (optional, default: "public")
//
// Request format (JSON):
//   - title: string (required)
//   - content: string (required)
//   - imageUrl: string (optional) - direct URL to image
//   - visibility: "public" | "private" (optional, default: "public")
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    // Verify user authentication
    const { error, user } = await verifyUser(req);
    if (error) return error;

    // Check content type to determine if it's multipart/form-data or JSON
    const contentType = req.headers.get("content-type") || "";

    let title: string;
    let content: string;
    let imageUrl: string | undefined;
    let visibility: "public" | "private" = "public";

    if (contentType.includes("multipart/form-data")) {
      // Handle file upload
      const formData = await req.formData();
      
      title = formData.get("title") as string;
      content = formData.get("content") as string;
      const imageFile = formData.get("image") as File | null;
      const visibilityParam = formData.get("visibility") as string | null;

      if (!title || !content) {
        return NextResponse.json(
          { success: false, message: "title and content are required" },
          { status: 400 }
        );
      }

      if (visibilityParam) {
        visibility = visibilityParam === "private" ? "private" : "public";
      }

      // Upload image to Firebase if provided
      if (imageFile && imageFile.size > 0) {
        // Validate file type
        const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
        if (!allowedTypes.includes(imageFile.type)) {
          return NextResponse.json(
            {
              success: false,
              message: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
            },
            { status: 400 }
          );
        }

        // Validate file size (max 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (imageFile.size > maxSize) {
          return NextResponse.json(
            { success: false, message: "File size too large. Maximum size is 10MB." },
            { status: 400 }
          );
        }

        // Convert File to Buffer
        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Generate unique file name
        const fileExtension = imageFile.name.split(".").pop() || "jpg";
        const fileName = `${user!._id}-${Date.now()}.${fileExtension}`;

        // Upload to Firebase Storage
        imageUrl = await uploadFileToFirebase(buffer, fileName, "posts");
      }
    } else {
      // Handle JSON body (for backward compatibility and direct URL)
      const body = await req.json().catch(() => null);
      if (!body) {
        return NextResponse.json(
          { success: false, message: "Invalid request body" },
          { status: 400 }
        );
      }

      title = body.title;
      content = body.content;
      imageUrl = body.imageUrl; // Can be Firebase URL or any external URL
      visibility = body.visibility || "public";
    }

    if (!title || !content) {
      return NextResponse.json(
        { success: false, message: "title and content are required" },
        { status: 400 }
      );
    }

    const item = await Post.create({
      user: user!._id,
      title,
      content,
      imageUrl,
      visibility,
      status: "pending", // admin must approve
    });

    return NextResponse.json({ success: true, item }, { status: 201 });
  } catch (error: any) {
    console.error("APP POST CREATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}


