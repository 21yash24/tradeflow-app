
'use server';

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (error: any) {
    // In a real app, you might want to log this error to a service
    console.error('Firebase Admin initialization error', error);
  }
}

const db = admin.firestore();

export { db };
