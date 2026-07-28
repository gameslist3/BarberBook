import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase-admin';
import { getServerUser } from '@/lib/get-server-user';

export async function DELETE(request: Request) {
  try {
    const user = await getServerUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Double check they are not a SHOP_OWNER
    if (user.role === 'SHOP_OWNER') {
        return NextResponse.json({ error: 'Shop owners cannot delete their account here.' }, { status: 403 });
    }

    // 1. Delete from Firestore
    await adminDb.collection('users').doc(user.id).delete();
    
    // 2. Delete from Firebase Auth
    await adminAuth.deleteUser(user.id);

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error: any) {
    console.error('Account deletion error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
