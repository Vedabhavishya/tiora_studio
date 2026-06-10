import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

const projectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_PRIVATE_KEY;

let adminAuth: any = null;

// Safeguard against multiple initializations during Next.js hot-reloading
if (getApps().length === 0) {
  if (projectId && clientEmail && privateKey) {
    // Newline fix for private keys loaded from environment variables
    const formattedPrivateKey = privateKey.replace(/\\n/g, "\n");

    initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey: formattedPrivateKey,
      }),
    });
    console.log("[Firebase Admin] Initialized successfully with credentials.");
  } else {
    console.warn(
      "[Firebase Admin] Missing credential variables. Local mock mode is enabled."
    );
  }
}

// Only expose auth service if an app is successfully initialized
if (getApps().length > 0) {
  adminAuth = getAuth();
}

export { adminAuth };
