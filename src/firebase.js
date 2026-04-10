import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Firebase web config is public-by-design. These defaults keep prod builds alive
// when host env vars are missing, while still allowing env overrides.
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

const firebaseConfig = {
  apiKey: getEnv("VITE_FIREBASE_API_KEY") || DEFAULT_FIREBASE_CONFIG.apiKey,
  authDomain: getEnv("VITE_FIREBASE_AUTH_DOMAIN") || DEFAULT_FIREBASE_CONFIG.authDomain,
  projectId: getEnv("VITE_FIREBASE_PROJECT_ID") || DEFAULT_FIREBASE_CONFIG.projectId,
  storageBucket: getEnv("VITE_FIREBASE_STORAGE_BUCKET") || DEFAULT_FIREBASE_CONFIG.storageBucket,
  messagingSenderId:
    getEnv("VITE_FIREBASE_MESSAGING_SENDER_ID") || DEFAULT_FIREBASE_CONFIG.messagingSenderId,
  appId: getEnv("VITE_FIREBASE_APP_ID") || DEFAULT_FIREBASE_CONFIG.appId,
};

const missingFirebaseVars = Object.entries(firebaseConfig)
  .filter(([, value]) => !value)
  .map(([key]) => key);

if (missingFirebaseVars.length > 0) {
  console.warn(
    `[Firebase] Missing config entries after fallbacks: ${missingFirebaseVars.join(", ")}. ` +
      "Auth/storage features may not work until Firebase env vars are configured."
  );
}

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { auth, db, storage };
export default app;
