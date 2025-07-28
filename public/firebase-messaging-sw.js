// This file must be in the public directory

import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging/sw";

// Your web app's Firebase configuration
const firebaseConfig = {
    projectId: "tradeflow-3bzke",
    appId: "1:761646263499:web:89fc8d489b1f11987eff4e",
    storageBucket: "tradeflow-3bzke.appspot.com",
    apiKey: "AIzaSyA386i6FD9F4kK1FQTufnkGmi4BfA8HUto",
    authDomain: "tradeflow-3bzke.firebaseapp.com",
    messagingSenderId: "761646263499",
    measurementId: "G-XXXXXXXXXX"
};


const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

// Background message handling can be added here if needed in the future.
// For now, this file just needs to exist and initialize messaging.
