"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  sendEmailVerification,
  RecaptchaVerifier,
  PhoneAuthProvider,
  linkWithCredential,
  updateProfile,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, db, analytics } from "@/lib/firebase";
import { logEvent } from "firebase/analytics";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userProfile: UserProfile | null;
  authError: string | null;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (
    email: string,
    password: string,
    displayName: string,
    phoneNumber?: string
  ) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
  verifyPhoneNumber: (phoneNumber: string) => Promise<string>;
  confirmPhoneVerification: (
    verificationId: string,
    code: string
  ) => Promise<void>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<void>;
  clearAuthError: () => void;
}

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phoneNumber?: string;
  phoneVerified: boolean;
  emailVerified: boolean;
  createdAt: Timestamp | ReturnType<typeof serverTimestamp>;
  lastLoginAt: Timestamp | ReturnType<typeof serverTimestamp>;
  settings: {
    notifications: boolean;
    theme: "light" | "dark";
    language: string;
  };
  tableNamingPreferences?: {
    type: "numbers" | "letters" | "roman" | "custom-prefix" | "custom-names";
    customPrefix?: string;
  };
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  // Check if Firebase is properly initialized
  useEffect(() => {
    if (!auth || !db) {
      setAuthError(
        "Firebase configuration error. Please check your environment variables."
      );
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      try {
        setUser(user);
        if (user) {
          await loadUserProfile(user);
          // Log analytics event
          if (analytics) {
            try {
              logEvent(analytics, "login", { method: "firebase_auth" });
            } catch (error) {
              console.warn("Analytics logging failed:", error);
            }
          }
        } else {
          setUserProfile(null);
        }
        setAuthError(null);
      } catch (error) {
        console.error("Error in auth state change:", error);
        setAuthError("Authentication error occurred. Please try again.");
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const loadUserProfile = async (user: User) => {
    try {
      if (!db) {
        throw new Error("Database not initialized");
      }

      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserProfile);
      } else {
        // Create default profile - build object without undefined values
        const profileData: Record<string, unknown> = {
          uid: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
          phoneVerified: !!user.phoneNumber,
          emailVerified: user.emailVerified,
          createdAt: serverTimestamp(),
          lastLoginAt: serverTimestamp(),
          settings: {
            notifications: true,
            theme: "light",
            language: "en",
          },
        };

        // Only add optional fields if they have values
        if (user.photoURL) {
          profileData.photoURL = user.photoURL;
        }
        if (user.phoneNumber) {
          profileData.phoneNumber = user.phoneNumber;
        }

        await setDoc(doc(db, "users", user.uid), profileData);

        // Reload profile after creation to get proper typing
        const newUserDoc = await getDoc(doc(db, "users", user.uid));
        if (newUserDoc.exists()) {
          setUserProfile(newUserDoc.data() as UserProfile);
        }
      }
    } catch (error) {
      console.error("Error loading user profile:", error);
      setAuthError(
        "Failed to load user profile. Please try refreshing the page."
      );
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      if (!auth) {
        throw new Error("Authentication not initialized");
      }

      setAuthError(null);
      await signInWithEmailAndPassword(auth, email, password);

      if (analytics) {
        try {
          logEvent(analytics, "login", { method: "email" });
        } catch (error) {
          console.warn("Analytics logging failed:", error);
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred during sign in";
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signUpWithEmail = async (
    email: string,
    password: string,
    displayName: string,
    phoneNumber?: string
  ) => {
    try {
      if (!auth || !db) {
        throw new Error("Authentication not initialized");
      }

      setAuthError(null);
      const result = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(result.user, { displayName });
      await sendEmailVerification(result.user);

      // Create user profile with provided information
      const profileData: Record<string, unknown> = {
        uid: result.user.uid,
        email: result.user.email || "",
        displayName: displayName,
        phoneVerified: false,
        emailVerified: result.user.emailVerified,
        createdAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        settings: {
          notifications: true,
          theme: "light",
          language: "en",
        },
      };

      // Only add phone number if provided
      if (phoneNumber && phoneNumber.trim()) {
        profileData.phoneNumber = phoneNumber.trim();
      }

      await setDoc(doc(db, "users", result.user.uid), profileData);

      if (analytics) {
        try {
          logEvent(analytics, "sign_up", { method: "email" });
        } catch (error) {
          console.warn("Analytics logging failed:", error);
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred during sign up";
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const signInWithGoogle = async () => {
    try {
      if (!auth) {
        throw new Error("Authentication not initialized");
      }

      setAuthError(null);
      const provider = new GoogleAuthProvider();
      provider.addScope("email");
      provider.addScope("profile");
      await signInWithPopup(auth, provider);

      if (analytics) {
        try {
          logEvent(analytics, "login", { method: "google" });
        } catch (error) {
          console.warn("Analytics logging failed:", error);
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred during Google sign in";
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const logout = async () => {
    try {
      if (!auth) {
        throw new Error("Authentication not initialized");
      }

      setAuthError(null);
      await signOut(auth);

      if (analytics) {
        try {
          logEvent(analytics, "logout");
        } catch (error) {
          console.warn("Analytics logging failed:", error);
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred during logout";
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const sendVerificationEmail = async () => {
    if (user) {
      try {
        setAuthError(null);
        await sendEmailVerification(user);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "An error occurred sending verification email";
        setAuthError(errorMessage);
        throw new Error(errorMessage);
      }
    }
  };

  const verifyPhoneNumber = async (phoneNumber: string): Promise<string> => {
    if (!user) throw new Error("User must be authenticated");
    if (!auth) throw new Error("Authentication not initialized");

    try {
      setAuthError(null);
      // Initialize reCAPTCHA
      const recaptchaVerifier = new RecaptchaVerifier(
        auth,
        "recaptcha-container",
        {
          size: "invisible",
        }
      );

      const provider = new PhoneAuthProvider(auth);
      const verificationId = await provider.verifyPhoneNumber(
        phoneNumber,
        recaptchaVerifier
      );

      return verificationId;
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred during phone verification";
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const confirmPhoneVerification = async (
    verificationId: string,
    code: string
  ) => {
    if (!user) throw new Error("User must be authenticated");

    try {
      setAuthError(null);
      const credential = PhoneAuthProvider.credential(verificationId, code);
      await linkWithCredential(user, credential);

      // Update user profile
      if (userProfile) {
        await updateUserProfile({ phoneVerified: true });
      }

      if (analytics) {
        try {
          logEvent(analytics, "phone_verification_completed");
        } catch (error) {
          console.warn("Analytics logging failed:", error);
        }
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred confirming phone verification";
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const updateUserProfile = async (data: Partial<UserProfile>) => {
    if (!user) throw new Error("User must be authenticated");
    if (!db) throw new Error("Database not initialized");

    try {
      setAuthError(null);

      // Filter out undefined values before updating
      const cleanedData: Record<string, unknown> = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanedData[key] = value;
        }
      });

      await setDoc(doc(db, "users", user.uid), cleanedData, { merge: true });

      // Update local state
      const updatedProfile = { ...userProfile, ...data };
      setUserProfile(updatedProfile as UserProfile);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "An error occurred updating user profile";
      setAuthError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const clearAuthError = () => {
    setAuthError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    userProfile,
    authError,
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    logout,
    sendVerificationEmail,
    verifyPhoneNumber,
    confirmPhoneVerification,
    updateUserProfile,
    clearAuthError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
