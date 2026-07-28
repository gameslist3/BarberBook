import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

try {
  console.log("PROJECT ID:", process.env.FIREBASE_PROJECT_ID);
  console.log("CLIENT EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
  console.log("PRIVATE KEY length:", process.env.FIREBASE_PRIVATE_KEY?.length);
  
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
  
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: privateKey,
    }),
  });
  
  console.log("App initialized.");
  const db = getFirestore();
  const auth = getAuth();
  console.log("DB and Auth ready.");
} catch (e) {
  console.error("FAILED:", e);
}
