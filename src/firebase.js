import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase web config is public-by-design.
// These defaults keep local dev builds alive for onboarding when host env vars are missing.
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDt_mnuBryHcssBjRSdnPlh9VIC58LKL9Q",
  authDomain: "studyspace-kiet.firebaseapp.com",
  projectId: "studyspace-kiet",
  storageBucket: "studyspace-kiet.appspot.com",
  messagingSenderId: "28032445048",
  appId: "1:28032445048:web:025624ffdb03cfd54b1b8d",
};

const getEnv = (key) => {
  const value = import.meta.env[key];
  return typeof value === "string" ? value.trim() : "";
};

const rawConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY"),
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: getEnv("VITE_FIREBASE_APP_ID"),
};

const missingEnvVars = Object.entries(rawConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingEnvVars.length > 0) {
  if (import.meta.env.MODE === "production") {
    throw new Error(`[Firebase] Missing required env vars in production: ${missingEnvVars.join(", ")}`);
  }
  console.warn(
    `[Firebase] Missing env config entries: ${missingEnvVars.join(", ")}. ` +
      "Falling back to DEFAULT_FIREBASE_CONFIG for development."
  );
}

const firebaseConfig = {
  apiKey: rawConfig.apiKey || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: rawConfig.authDomain || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: rawConfig.projectId || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: rawConfig.storageBucket || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId: rawConfig.messagingSenderId || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: rawConfig.appId || DEFAULT_FIREBASE_CONFIG.appId,
};

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;
