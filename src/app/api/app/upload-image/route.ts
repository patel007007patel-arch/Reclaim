import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/lib/auth-helpers";
import { uploadFileToFirebase } from "@/lib/firebase";

/**
 * POST: Upload image to Firebase Storage
 * Authentication required - Bearer token in Authorization header
 * 
 * Request: multipart/form-data with "image" field
 * Response: { success: true, imageUrl: "https://..." }
 */
export async function POST(req: NextRequest) {
  try {
    // Verify user authentication
    const { error, user } = await verifyUser(req);
    if (error) return error;

    // Get form data
    const formData = await req.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { success: false, message: "No image file provided. Please include 'image' field in form data." },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(imageFile.type)) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}` 
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
    const imageUrl = await uploadFileToFirebase(buffer, fileName, "posts");

    return NextResponse.json(
      {
        success: true,
        imageUrl,
        message: "Image uploaded successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("IMAGE UPLOAD ERROR:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to upload image",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

