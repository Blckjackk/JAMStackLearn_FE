// src/lib/firebase.js
import { initializeApp } from "firebase/app"
import { getAuth } from "firebase/auth" // <-- Imported the Auth module

const firebaseConfig = {
  apiKey: "AIzaSyB5jvQPzc7tLr1hHnt61D9RWPpZy0COdxs",
  authDomain: "magang-7ba56.firebaseapp.com",
  projectId: "magang-7ba56",
  storageBucket: "magang-7ba56.firebasestorage.app",
  messagingSenderId: "173125765027",
  appId: "1:173125765027:web:ba1d3c31c88800ef63fc16",
  measurementId: "G-M7XCZB2921",
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)

// Initialize and export the Auth service so your login buttons can use it
export const auth = getAuth(app)
