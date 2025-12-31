import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDt_mnuBryHcssBjRSdnPlh9VIC58LKL9Q",
  authDomain: "studyspace-kiet.firebaseapp.com",
  projectId: "studyspace-kiet",
  storageBucket: "studyspace-kiet.appspot.com",
  messagingSenderId: "28032445048",
  appId: "1:28032445048:web:025624ffdb03cfd54b1b8d"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;