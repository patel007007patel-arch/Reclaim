import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Resource from "@/models/Resource";
import { verifyAdmin } from "@/lib/auth-helpers";

type Params = { params: Promise<{ id: string }> };

// PATCH: update resource
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;

    const { id } = await params;
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    if (body.category && !["journey", "motivation", "lesson"].includes(body.category)) {
      return NextResponse.json(
        { success: false, message: "category must be journey, motivation, or lesson" },
        { status: 400 }
      );
    }

    const resource = await Resource.findByIdAndUpdate(id, body, {
      new: true,
    });

    if (!resource) {
      return NextResponse.json(
        { success: false, message: "Resource not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, resource }, { status: 200 });
  } catch (error: any) {
    console.error("RESOURCE UPDATE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

// DELETE: delete resource
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    await connectDB();

    // Verify admin authentication
    const { error } = await verifyAdmin(req);
    if (error) return error;

    const { id } = await params;

    const resource = await Resource.findByIdAndDelete(id);

    if (!resource) {
      return NextResponse.json(
        { success: false, message: "Resource not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Resource deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("RESOURCE DELETE ERROR:", error);
    return NextResponse.json(
      { success: false, message: "Server error", error: error.message },
      { status: 500 }
    );
  }
}

