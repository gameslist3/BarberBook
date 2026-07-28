const { initializeApp, cert } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const { getFirestore } = require('firebase-admin/firestore');

// Since we're running this locally using node, we can load .env.local
require('dotenv').config({ path: '.env.local' });

const privateKey = process.env.FIREBASE_PRIVATE_KEY
  ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  : undefined;

const app = initializeApp({
  credential: cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: privateKey,
  })
});

const auth = getAuth(app);
const db = getFirestore(app);

async function setup() {
  const email = "portfolioshubham787@gmail.com";
  const password = "portfolio@admin12345";
  const name = "Shubham (App Owner)";
  
  let uid = null;

  try {
    console.log(`Creating user ${email}...`);
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: name,
      emailVerified: true
    });
    uid = userRecord.uid;
    console.log(`Successfully created new user: ${uid}`);
  } catch (error) {
    if (error.code === 'auth/email-already-exists') {
      console.log(`User ${email} already exists, fetching UID...`);
      const userRecord = await auth.getUserByEmail(email);
      uid = userRecord.uid;
    } else {
      console.error("Error creating user:", error);
      process.exit(1);
    }
  }

  if (uid) {
    console.log(`Setting up Firestore document for ${uid}...`);
    await db.collection("users").doc(uid).set({
      name: name,
      email: email,
      role: "ADMIN",
      createdAt: new Date()
    }, { merge: true });
    
    console.log(`Successfully elevated ${email} to ADMIN!`);
  }
}

setup();
