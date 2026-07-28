import { cookies } from 'next/headers';
import { adminAuth, adminDb } from './firebase-admin';

export async function getServerUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;

    if (!sessionCookie) return null;

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    // Fetch role from Firestore
    const userDoc = await adminDb.collection('users').doc(decodedClaims.uid).get();
    const role = userDoc.exists ? userDoc.data()?.role : 'CLIENT';

    return {
      id: decodedClaims.uid,
      email: decodedClaims.email,
      name: decodedClaims.name,
      role: role,
      emailVerified: decodedClaims.email_verified
    };
  } catch (error) {
    return null;
  }
}
