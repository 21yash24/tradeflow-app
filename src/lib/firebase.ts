
'use client';

import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    projectId: "tradeflow-3bzke",
    appId: "1:761646263499:web:89fc8d489b1f11987eff4e",
    storageBucket: "tradeflow-3bzke.firebasestorage.app",
    apiKey: "AIzaSyA386i6FD9F4kK1FQTufnkGmi4BfA8HUto",
    authDomain: "tradeflow-3bzke.firebaseapp.com",
    messagingSenderId: "761646263499",
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
