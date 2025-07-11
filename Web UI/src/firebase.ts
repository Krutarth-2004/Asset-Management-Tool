// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDrVyx7Flr2bMUfStyN8HUo87R_MooHefY",
  authDomain: "uniblu-production.firebaseapp.com",
  projectId: "uniblu-production",
  storageBucket: "uniblu-production.firebasestorage.app",
  messagingSenderId: "73790258697",
  appId: "1:73790258697:web:37e4d26a994886602102d8",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
auth.languageCode = "en"; // Optional

export { auth, db };
