// src/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyC66wEQy_HgrE5Rvqt3zzt_6sXQjjBEJRs", 
  authDomain: "arcads-85a09.firebaseapp.com",
  projectId: "arcads-85a09",
  storageBucket: "arcads-85a09.firebasestorage.app",
  messagingSenderId: "185136479216",
  appId: "1:185136479216:web:2c23b01dca929b2613fb35"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);