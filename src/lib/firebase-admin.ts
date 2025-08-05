
'use server';

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // When running on Google Cloud infrastructure, the SDK automatically
    // discovers the service account credentials.
    admin.initializeApp();
  } catch (error: any) {
    // In a real app, you might want to log this error to a monitoring service
    console.error('Firebase Admin initialization error', error);
    // You might want to throw the error to prevent the app from starting
    // in a broken state, depending on your error handling strategy.
  }
}

// Export the initialized instance
const db = admin.firestore();

export { db };
