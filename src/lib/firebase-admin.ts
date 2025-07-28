
'use server';

import * as admin from 'firebase-admin';

if (!admin.apps.length) {
  try {
    // When deployed to App Hosting, Application Default Credentials are automatically available.
    admin.initializeApp();
  } catch (e) {
    console.error('Firebase Admin initialization error:', e);
  }
}

const db = admin.firestore();

export { db };
