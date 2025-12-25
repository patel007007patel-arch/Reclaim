import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import User from "@/models/User";
import { verifyUser } from "@/lib/auth-helpers";

// PATCH: Update user profile (name, birthdate, etc.)
export async function PATCH(req: NextRequest) {
  try {
    await connectDB();

    // Verify user authentication
    const { error, user } = await verifyUser(req);
    if (error) return error;

    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { success: false, message: "Invalid JSON body" },
        { status: 400 }
      );
    }

    const { 
      name, 
      email,
      birthdate, 
      deviceSyncStatus 
    } = body;

    // Fields that users CANNOT update (system-managed or security-sensitive)
    const restrictedFields = ['password', 'googleId', 'facebookId', 'streak', 'activity', 'onboardingAnswers', 'dailyCheckinAnswers', 'active', '_id', 'createdAt', 'updatedAt'];
    
    // Check if user is trying to update restricted fields
    const attemptedRestrictedFields = Object.keys(body).filter(key => restrictedFields.includes(key));
    if (attemptedRestrictedFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: `Cannot update restricted fields: ${attemptedRestrictedFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Check if email is being updated and if it already exists
    if (email !== undefined && email !== user!.email) {
      const emailToCheck = email.trim().toLowerCase();
      
      // Check if email already exists for another user
      const existingUser = await User.findOne({ 
        email: emailToCheck,
        _id: { $ne: user!._id } // Exclude current user
      });
      
      if (existingUser) {
        return NextResponse.json(
          { 
            success: false, 
            message: "Email already exists. Please use a different email address." 
          },
          { status: 409 }
        );
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailToCheck)) {
        return NextResponse.json(
          { 
            success: false, 
            message: "Invalid email format" 
          },
          { status: 400 }
        );
      }
    }

    // Build update object - allow updating all other fields
    const updateData: any = {};
    
    if (name !== undefined) {
      updateData.name = name && typeof name === 'string' ? name.trim() : undefined;
    }
    
    if (email !== undefined && email !== user!.email) {
      updateData.email = email.trim().toLowerCase();
    }
    
    if (birthdate !== undefined) {
      updateData.birthdate = birthdate ? new Date(birthdate) : undefined;
    }
    
    if (deviceSyncStatus !== undefined) {
      if (typeof deviceSyncStatus === 'object' && deviceSyncStatus !== null) {
        updateData.deviceSyncStatus = {
          lastSync: deviceSyncStatus.lastSync ? new Date(deviceSyncStatus.lastSync) : undefined,
          deviceId: deviceSyncStatus.deviceId || undefined,
          platform: deviceSyncStatus.platform || undefined,
        };
      }
    }

    // Allow updating any other fields that are not restricted
    Object.keys(body).forEach(key => {
      if (!restrictedFields.includes(key) && !['name', 'email', 'birthdate', 'deviceSyncStatus'].includes(key)) {
        // Allow other custom fields to be updated
        updateData[key] = body[key];
      }
    });

    // If no fields to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, message: "No fields to update" },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      user!._id,
      { $set: updateData },
      { new: true, runValidators: true }
    )
      .select("-password")
      .lean();

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Return updated user data (excluding sensitive fields)
    const userResponse: any = {
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      birthdate: updatedUser.birthdate,
    };

    // Include other updated fields if they exist
    if (updatedUser.deviceSyncStatus) {
      userResponse.deviceSyncStatus = updatedUser.deviceSyncStatus;
    }

    // Include any other custom fields that were updated
    Object.keys(updateData).forEach(key => {
      if (!['name', 'email', 'birthdate', 'deviceSyncStatus'].includes(key) && updatedUser[key as keyof typeof updatedUser] !== undefined) {
        userResponse[key] = updatedUser[key as keyof typeof updatedUser];
      }
    });

    return NextResponse.json({
      success: true,
      message: "Profile updated successfully",
      user: userResponse,
    });
  } catch (error: any) {
    console.error("Update user profile error:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to update profile",
        error: error.message,
      },
      { status: 500 }
    );
  }
}

