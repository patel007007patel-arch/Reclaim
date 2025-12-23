# Firebase Storage Setup Guide

This guide explains how to set up Firebase Storage for image uploads in the application.

## Prerequisites

1. A Firebase project (create one at https://console.firebase.google.com/)
2. Firebase Admin SDK credentials

## Step 1: Install Dependencies

```bash
npm install firebase-admin
```

## Step 2: Get Firebase Service Account Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** (gear icon) → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file (this contains your credentials)

## Step 3: Add Environment Variables

Add these variables to your `.env` or `.env.local` file:

```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour\nPrivate\nKey\nHere\n-----END PRIVATE KEY-----\n"
```

**Important Notes:**
- `FIREBASE_PROJECT_ID`: Found in Firebase Console → Project Settings → General
- `FIREBASE_CLIENT_EMAIL`: Found in the downloaded JSON file (field: `client_email`)
- `FIREBASE_PRIVATE_KEY`: Found in the downloaded JSON file (field: `private_key`)
  - Keep the entire key including `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----`
  - The key contains `\n` characters - these will be automatically converted to actual newlines by the code
  - Make sure to wrap it in quotes in your `.env` file

## Step 4: Enable Firebase Storage

1. In Firebase Console, go to **Storage**
2. Click **Get Started**
3. Choose **Start in test mode** (for development) or set up security rules
4. Select a location for your storage bucket

## Step 5: Configure Storage Rules (Optional but Recommended)

For production, update your Firebase Storage rules:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /posts/{allPaths=**} {
      allow read: if true; // Public read access
      allow write: if request.auth != null; // Only authenticated users can write
    }
  }
}
```

## Usage

### Option 1: Upload Image Separately, Then Create Post

1. **Upload image first:**
   ```bash
   POST /api/app/upload-image
   Headers:
     Authorization: Bearer <user_token>
   Body (multipart/form-data):
     image: <file>
   ```
   
   Response:
   ```json
   {
     "success": true,
     "imageUrl": "https://storage.googleapis.com/...",
     "message": "Image uploaded successfully"
   }
   ```

2. **Create post with the image URL:**
   ```bash
   POST /api/app/posts
   Headers:
     Authorization: Bearer <user_token>
     Content-Type: application/json
   Body:
     {
       "title": "My Post",
       "content": "Post content",
       "imageUrl": "https://storage.googleapis.com/...",
       "visibility": "public"
     }
   ```

### Option 2: Upload Image and Create Post in One Request

```bash
POST /api/app/posts
Headers:
  Authorization: Bearer <user_token>
Body (multipart/form-data):
  title: "My Post"
  content: "Post content"
  image: <file>
  visibility: "public"
```

The API will:
1. Upload the image to Firebase Storage
2. Get the public URL
3. Create the post with that URL

## API Endpoints

### POST /api/app/upload-image
Upload an image file to Firebase Storage.

**Authentication:** Required (Bearer token)

**Request:**
- Content-Type: `multipart/form-data`
- Body: Form data with `image` field

**Response:**
```json
{
  "success": true,
  "imageUrl": "https://storage.googleapis.com/...",
  "message": "Image uploaded successfully"
}
```

### POST /api/app/posts
Create a new post. Supports both JSON (with imageUrl) and multipart/form-data (with image file).

**Authentication:** Required (Bearer token)

**Request Options:**

1. **JSON with imageUrl:**
   - Content-Type: `application/json`
   - Body: `{ "title": "...", "content": "...", "imageUrl": "..." }`

2. **Multipart with image file:**
   - Content-Type: `multipart/form-data`
   - Body: Form data with `title`, `content`, `image` (file), `visibility`

**Response:**
```json
{
  "success": true,
  "item": {
    "_id": "...",
    "title": "...",
    "content": "...",
    "imageUrl": "https://storage.googleapis.com/...",
    "status": "pending",
    "visibility": "public",
    ...
  }
}
```

## File Validation

- **Allowed types:** JPEG, JPG, PNG, GIF, WebP
- **Max file size:** 10MB
- **Storage location:** `posts/` folder in Firebase Storage

## Troubleshooting

### Error: "Firebase credentials missing"
- Check that all three environment variables are set in your `.env` file
- Make sure `FIREBASE_PRIVATE_KEY` includes the full key with BEGIN/END markers
- Restart your development server after adding environment variables

### Error: "Failed to upload file to Firebase"
- Verify Firebase Storage is enabled in your Firebase Console
- Check that your service account has Storage Admin permissions
- Ensure your storage bucket exists and is accessible

### Images not showing
- Check that the file was made public (the code does this automatically)
- Verify the URL format: `https://storage.googleapis.com/[bucket-name]/posts/...`

