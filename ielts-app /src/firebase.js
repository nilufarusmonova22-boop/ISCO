import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBuPyipyOCRg4sK6PcFUNDhzLgM5yOyXCw",
  authDomain: "isco-1ef59.firebaseapp.com",
  projectId: "isco-1ef59",
  storageBucket: "isco-1ef59.firebasestorage.app",
  messagingSenderId: "405849183625",
  appId: "1:405849183625:web:0079b00b5f996c5b52fd58",
  measurementId: "G-G389SR5FME"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
