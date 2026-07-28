"use client";

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { applyActionCode, verifyPasswordResetCode, confirmPasswordReset } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';

function AuthActionHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const mode = searchParams.get('mode');
  const oobCode = searchParams.get('oobCode');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  
  // Password reset state
  const [newPassword, setNewPassword] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!mode || !oobCode) {
      setStatus('error');
      setMessage('Invalid action request.');
      return;
    }

    const handleAction = async () => {
      try {
        if (mode === 'verifyEmail') {
          await applyActionCode(auth, oobCode);
          setStatus('success');
          setMessage('Your email has been successfully verified! You can now access all features.');
          
          // Force token refresh if logged in
          if (auth.currentUser) {
            await auth.currentUser.getIdToken(true);
            setTimeout(() => {
                router.push('/explore');
            }, 3000);
          }
        } else if (mode === 'resetPassword') {
          const userEmail = await verifyPasswordResetCode(auth, oobCode);
          setEmail(userEmail);
          setStatus('success');
          // Don't auto-redirect, let them enter new password
        } else {
          setStatus('error');
          setMessage('Unknown action mode.');
        }
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Action failed. The link may have expired.');
      }
    };

    handleAction();
  }, [mode, oobCode, router]);

  const handleResetPassword = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!oobCode) return;
      
      setStatus('loading');
      try {
          await confirmPasswordReset(auth, oobCode, newPassword);
          setStatus('success');
          setMessage('Password has been reset successfully! You can now sign in.');
          setTimeout(() => {
              router.push('/signin');
          }, 3000);
      } catch (error: any) {
          setStatus('error');
          setMessage(error.message || 'Failed to reset password.');
      }
  };

  if (status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-gray-100 text-center">
        {status === 'success' && mode === 'verifyEmail' && (
            <>
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h1>
                <p className="text-gray-600 mb-6">{message}</p>
                <Link href="/explore" className="inline-block w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-colors">
                    Continue to App
                </Link>
            </>
        )}
        
        {status === 'success' && mode === 'resetPassword' && !message.includes('successfully') && (
            <>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
                <p className="text-gray-600 mb-6">Enter a new password for {email}</p>
                <form onSubmit={handleResetPassword} className="space-y-4 text-left">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <input 
                            type="password" 
                            required 
                            minLength={6}
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full h-11 px-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none" 
                        />
                    </div>
                    <button type="submit" className="w-full h-11 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors">
                        Update Password
                    </button>
                </form>
            </>
        )}
        
        {status === 'success' && mode === 'resetPassword' && message.includes('successfully') && (
            <>
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h1>
                <p className="text-gray-600 mb-6">{message}</p>
                <Link href="/signin" className="inline-block w-full bg-indigo-600 text-white font-semibold py-3 rounded-lg hover:bg-indigo-700 transition-colors">
                    Sign In
                </Link>
            </>
        )}

        {status === 'error' && (
            <>
                <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Action Failed</h1>
                <p className="text-gray-600 mb-6">{message}</p>
                <Link href="/signin" className="inline-block w-full bg-gray-100 text-gray-700 font-semibold py-3 rounded-lg hover:bg-gray-200 transition-colors">
                    Return to Sign In
                </Link>
            </>
        )}
      </div>
    </div>
  );
}

export default function AuthActionPage() {
    return (
        <Suspense fallback={<div className="flex min-h-screen items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>}>
            <AuthActionHandler />
        </Suspense>
    );
}
