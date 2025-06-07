import {
  initializeApp,
  getApps,
  cert,
  ServiceAccount,
} from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { NextRequest } from "next/server";

// Initialize Firebase Admin SDK if not already initialized
if (!getApps().length) {
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Missing Firebase Admin credentials in environment variables"
    );
  }

  const serviceAccount: ServiceAccount = {
    projectId,
    clientEmail,
    privateKey,
  };

  initializeApp({
    credential: cert(serviceAccount),
  });
}

// Helper function to verify authentication token
export async function verifyAuthToken(
  req: NextRequest
): Promise<string | null> {
  try {
    console.log("Starting token verification...");
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.log("No valid auth header found");
      return null;
    }

    const token = authHeader.split("Bearer ")[1];
    console.log("Token extracted, length:", token?.length);

    const decodedToken = await getAuth().verifyIdToken(token);
    console.log("Token verified successfully for user:", decodedToken.uid);

    return decodedToken.uid;
  } catch (error) {
    console.error("Error verifying auth token:", error);
    return null;
  }
}

// Helper function to get user ID from session/cookie (for client-side calls)
export async function getUserIdFromSession(
  req: NextRequest
): Promise<string | null> {
  // For now, we'll expect the auth token in the Authorization header
  // In a production app, you might want to use secure HTTP-only cookies
  return verifyAuthToken(req);
}
