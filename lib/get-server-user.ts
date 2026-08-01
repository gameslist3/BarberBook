import { cookies } from 'next/headers';
import { adminAuth, adminDb } from './firebase-admin';

export async function getServerUser() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session')?.value;

    if (!sessionCookie) return null;

    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    // Fetch role + editable profile fields from Firestore (the user doc is the
    // source of truth for name/phone/photo so edits reflect everywhere).
    const userDoc = await adminDb.collection('users').doc(decodedClaims.uid).get();
    const data = userDoc.exists ? userDoc.data() : {};
    const role = userDoc.exists ? data?.role : 'CLIENT';

    return {
      id: decodedClaims.uid,
      email: decodedClaims.email,
      name: data?.name || decodedClaims.name || "",
      role: role,
      emailVerified: decodedClaims.email_verified,
      phone: data?.phone || null,
      photoUrl: data?.photoUrl || null,
    };
  } catch (error) {
    return null;
  }
}
