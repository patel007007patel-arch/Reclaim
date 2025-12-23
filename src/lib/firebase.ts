import { initializeApp, getApps, cert, App } from "firebase-admin/app";
import { getStorage, Storage } from "firebase-admin/storage";

let firebaseApp: App | null = null;
let storage: Storage | null = null;

/**
 * Initialize Firebase Admin SDK
 * Requires environment variables:
 * - FIREBASE_PROJECT_ID
 * - FIREBASE_CLIENT_EMAIL
 * - FIREBASE_PRIVATE_KEY (with \n replaced with actual newlines)
 */
export function getFirebaseApp(): App {
  if (firebaseApp) {
    return firebaseApp;
  }

  const apps = getApps();
  if (apps.length > 0) {
    firebaseApp = apps[0];
    return firebaseApp;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase credentials missing. Please set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your .env file."
    );
  }

  firebaseApp = initializeApp({
    credential: cert({
      projectId,
      clientEmail,
      privateKey,
    }),
    storageBucket: `${projectId}.appspot.com`,
  });

  return firebaseApp;
}

/**
 * Get Firebase Storage instance
 */
export function getFirebaseStorage(): Storage {
  if (storage) {
    return storage;
  }

  const app = getFirebaseApp();
  storage = getStorage(app);
  return storage;
}

/**
 * Upload file to Firebase Storage
 * @param file - File buffer or stream
 * @param fileName - Name of the file in storage
 * @param folder - Optional folder path (e.g., "posts", "avatars")
 * @returns Public URL of the uploaded file
 */
export async function uploadFileToFirebase(
  file: Buffer,
  fileName: string,
  folder: string = "posts"
): Promise<string> {
  try {
    const storage = getFirebaseStorage();
    const bucket = storage.bucket();
    const filePath = `${folder}/${Date.now()}-${fileName}`;
    const fileRef = bucket.file(filePath);

    // Upload file
    await fileRef.save(file, {
      metadata: {
        contentType: getContentType(fileName),
      },
      public: true, // Make file publicly accessible
    });

    // Make file publicly readable
    await fileRef.makePublic();

    // Return public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
    return publicUrl;
  } catch (error: any) {
    console.error("Firebase upload error:", error);
    throw new Error(`Failed to upload file to Firebase: ${error.message}`);
  }
}

/**
 * Delete file from Firebase Storage
 */
export async function deleteFileFromFirebase(fileUrl: string): Promise<void> {
  try {
    const storage = getFirebaseStorage();
    const bucket = storage.bucket();

    // Extract file path from URL
    const urlParts = fileUrl.split("/");
    const filePath = urlParts.slice(4).join("/"); // Remove https://storage.googleapis.com/bucket-name/

    const fileRef = bucket.file(filePath);
    await fileRef.delete();
  } catch (error: any) {
    console.error("Firebase delete error:", error);
    // Don't throw - file might not exist
  }
}

/**
 * Get content type from file name
 */
function getContentType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const contentTypes: Record<string, string> = {
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    png: "image/png",
    gif: "image/gif",
    webp: "image/webp",
    svg: "image/svg+xml",
  };
  return contentTypes[ext || ""] || "application/octet-stream";
}

