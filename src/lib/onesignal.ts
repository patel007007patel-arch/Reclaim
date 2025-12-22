interface SendNotificationOptions {
  title: string;
  message: string;
  playerIds?: string[]; // Specific player IDs (for targeted users) - legacy support
  externalUserIds?: string[]; // User IDs from your database (recommended)
  sendToAll?: boolean; // Send to all subscribers
  data?: Record<string, any>; // Additional data payload
}

/**
 * Send push notification via OneSignal REST API
 * @param options Notification options
 * @returns OneSignal notification response
 */
export async function sendOneSignalNotification(
  options: SendNotificationOptions
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  try {
    const appId = process.env.ONESIGNAL_APP_ID;
    const restApiKey = process.env.ONESIGNAL_REST_API_KEY;

    if (!appId || !restApiKey) {
      return {
        success: false,
        error:
          "OneSignal configuration missing. Please set ONESIGNAL_APP_ID and ONESIGNAL_REST_API_KEY in environment variables.",
      };
    }

    // Validate that REST API Key is not empty
    if (restApiKey.trim().length === 0) {
      return {
        success: false,
        error: "ONESIGNAL_REST_API_KEY is empty. Please check your .env file.",
      };
    }

    // Build notification payload
    const notification: any = {
      app_id: appId,
      headings: { en: options.title },
      contents: { en: options.message },
    };

    // Add data payload if provided
    if (options.data) {
      notification.data = options.data;
    }

    // Set recipients
    if (options.sendToAll) {
      // Send to all subscribed users
      notification.included_segments = ["Subscribed Users"];
    } else if (options.externalUserIds && options.externalUserIds.length > 0) {
      // Send to specific users by their User IDs (recommended approach)
      notification.include_external_user_ids = options.externalUserIds;
    } else if (options.playerIds && options.playerIds.length > 0) {
      // Send to specific player IDs (legacy support)
      notification.include_player_ids = options.playerIds;
    } else {
      return {
        success: false,
        error: "No recipients specified. Provide externalUserIds, playerIds, or set sendToAll to true.",
      };
    }

    // Send notification via OneSignal REST API
    // OneSignal uses Basic auth with the REST API Key
    // Note: The REST API Key should be used directly (OneSignal handles base64 encoding internally)
    // Make sure you're using a Rich API Key (not Legacy API Key) from OneSignal dashboard
    
    // Debug: Log if API key exists (but not the actual key for security)
    if (!restApiKey || restApiKey.trim().length === 0) {
      console.error("ONESIGNAL_REST_API_KEY is empty or not set");
    } else {
      console.log(`OneSignal API Key length: ${restApiKey.length} characters`);
    }

    const response = await fetch("https://onesignal.com/api/v1/notifications", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Basic ${restApiKey}`,
      },
      body: JSON.stringify(notification),
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Log the error for debugging
      console.error("OneSignal API Error:", {
        status: response.status,
        statusText: response.statusText,
        errors: responseData.errors,
        response: responseData,
      });

      // Provide more helpful error messages
      if (response.status === 401 || response.status === 403) {
        return {
          success: false,
          error:
            "OneSignal authentication failed. Please verify your ONESIGNAL_REST_API_KEY is correct in your .env file. Make sure to restart your server after updating environment variables.",
        };
      }

      return {
        success: false,
        error:
          responseData.errors?.join(", ") ||
          responseData.message ||
          `OneSignal API error (${response.status}): ${response.statusText}`,
      };
    }

    // OneSignal API returns different response formats
    // Check for notification ID in various possible fields
    const notificationId = responseData.id || responseData.notification_id || responseData.notificationId;
    
    // Check if there are errors in the response (even if status is 200)
    if (responseData.errors && responseData.errors.length > 0) {
      const errorMessage = responseData.errors.join(", ");
      
      // Handle specific error cases
      if (errorMessage.includes("not subscribed")) {
        return {
          success: false,
          error: "Users are not subscribed to notifications. Make sure users have: 1) Granted notification permission, 2) Set their External User ID in OneSignal (frontend should do this automatically on login).",
        };
      }
      
      return {
        success: false,
        error: `OneSignal API errors: ${errorMessage}`,
      };
    }
    
    if (notificationId && notificationId !== "") {
      return {
        success: true,
        notificationId: notificationId,
      };
    } else {
      // Log the full response to help debug
      console.error("OneSignal API Response (no ID found):", JSON.stringify(responseData, null, 2));
      return {
        success: false,
        error: `Failed to send notification. No notification ID returned. Response: ${JSON.stringify(responseData)}`,
      };
    }
  } catch (error: any) {
    console.error("OneSignal notification error:", error);
    return {
      success: false,
      error: error.message || "Failed to send OneSignal notification",
    };
  }
}

/**
 * Send notification to all active users
 */
export async function sendNotificationToAll(
  title: string,
  message: string,
  data?: Record<string, any>
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  return sendOneSignalNotification({
    title,
    message,
    sendToAll: true,
    data,
  });
}

/**
 * Send notification to specific users by their User IDs (recommended)
 * Uses OneSignal External User IDs - frontend should set this automatically
 */
export async function sendNotificationToUsers(
  title: string,
  message: string,
  userIds: string[], // User IDs from your database
  data?: Record<string, any>
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  if (!userIds || userIds.length === 0) {
    return {
      success: false,
      error: "No user IDs provided",
    };
  }

  return sendOneSignalNotification({
    title,
    message,
    externalUserIds: userIds,
    data,
  });
}

/**
 * Send notification to specific users by their OneSignal player IDs (legacy)
 * @deprecated Use sendNotificationToUsers with User IDs instead
 */
export async function sendNotificationToPlayerIds(
  title: string,
  message: string,
  playerIds: string[],
  data?: Record<string, any>
): Promise<{ success: boolean; notificationId?: string; error?: string }> {
  if (!playerIds || playerIds.length === 0) {
    return {
      success: false,
      error: "No player IDs provided",
    };
  }

  return sendOneSignalNotification({
    title,
    message,
    playerIds,
    data,
  });
}

