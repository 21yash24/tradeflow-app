
'use server';

import * as admin from 'firebase-admin';

// This is a safeguard to ensure the service account JSON is properly parsed.
// In a real production environment, this should be securely stored as an environment variable.
let serviceAccount: admin.ServiceAccount | undefined;
try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
    }
} catch (e) {
    console.error('Error parsing Firebase service account key:', e);
}


if (!admin.apps.length) {
  try {
    admin.initializeApp({
      // Use the parsed service account if available, otherwise, let Firebase
      // try to use Application Default Credentials.
      credential: serviceAccount ? admin.credential.cert(serviceAccount) : admin.credential.applicationDefault(),
    });
  } catch (e) {
      console.error('Firebase Admin initialization error:', e);
  }
}

const db = admin.firestore();

export { db };
