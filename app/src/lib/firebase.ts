import { initializeApp, getApps, getApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDmR9S1duxLIDZdsfWb2ewFE2JBbmYxubI",
  authDomain: "earthworm-5821.firebaseapp.com",
  projectId: "earthworm-5821",
  storageBucket: "earthworm-5821.firebasestorage.app",
  messagingSenderId: "148314110144",
  appId: "1:148314110144:web:135099a17d4a5691d31525",
  measurementId: "G-CLTJGKXJQ6"
};

// Initialize Firebase - Check if already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;

export { app, analytics };
