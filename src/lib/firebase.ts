// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics, Analytics } from "firebase/analytics";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";

// Validate required environment variables first
const envVars = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Check for missing required environment variables
const requiredFields = [
  { key: "NEXT_PUBLIC_FIREBASE_API_KEY", value: envVars.apiKey },
  { key: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", value: envVars.authDomain },
  { key: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", value: envVars.projectId },
  {
    key: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET",
    value: envVars.storageBucket,
  },
  {
    key: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
    value: envVars.messagingSenderId,
  },
  { key: "NEXT_PUBLIC_FIREBASE_APP_ID", value: envVars.appId },
];

const missingEnvVars = requiredFields
  .filter((field) => !field.value || field.value.trim() === "")
  .map((field) => field.key);

if (missingEnvVars.length > 0) {
  throw new Error(
    `Missing required Firebase environment variables: ${missingEnvVars.join(
      ", "
    )}. ` +
      "Please check your .env file and ensure all Firebase configuration variables are set."
  );
}

// Create Firebase configuration with validated environment variables
const firebaseConfig = {
  apiKey: envVars.apiKey!,
  authDomain: envVars.authDomain!,
  projectId: envVars.projectId!,
  storageBucket: envVars.storageBucket!,
  messagingSenderId: envVars.messagingSenderId!,
  appId: envVars.appId!,
  measurementId: envVars.measurementId,
};

let app;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | null = null;

try {
  // Initialize Firebase
  app = initializeApp(firebaseConfig);

  // Initialize Firebase services
  auth = getAuth(app);
  db = getFirestore(app);

  // Initialize Analytics (only on client side)
  if (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
  ) {
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      console.warn("Analytics initialization failed:", error);
    }
  }
} catch (error) {
  console.error("Firebase initialization failed:", error);
  throw new Error(
    "Firebase initialization failed. Please check your Firebase configuration and environment variables."
  );
}

export { auth, db, analytics };
export default app;
