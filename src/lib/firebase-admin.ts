
import * as admin from 'firebase-admin';

// This function ensures the Firebase Admin app is initialized
// and returns the Firestore instance.
export function getDb() {
  if (!admin.apps.length) {
    try {
      // When running on Google Cloud infrastructure, the SDK automatically
      // discovers the service account credentials.
      admin.initializeApp();
    } catch (error: any) {
      console.error('Firebase Admin initialization error', error);
      // In a real app, you might want to throw the error to prevent the app from starting
      // in a broken state, depending on your error handling strategy.
      throw error; // Throwing error to prevent silent failures
    }
  }
  return admin.firestore();
}
