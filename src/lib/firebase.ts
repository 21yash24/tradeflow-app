
'use client';

import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getMessaging } from 'firebase/messaging';

const firebaseConfig: FirebaseOptions = {
    projectId: "tradeflow-3bzke",
    appId: "1:761646263499:web:89fc8d489b1f11987eff4e",
    storageBucket: "tradeflow-3bzke.firebasestorage.app",
    apiKey: "AIzaSyA386i6FD9F4kK1FQTufnkGmi4BfA8HUto",
    authDomain: "tradeflow-3bzke.firebaseapp.com",
    messagingSenderId: "761646263499",
    measurementId: "G-XXXXXXXXXX"
};

// Initialize Firebase for SSR
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Check if window is defined (i.e., we're on the client) before initializing messaging
const messaging = typeof window !== 'undefined' ? getMessaging(app) : null;

export { app, auth, db, messaging };
