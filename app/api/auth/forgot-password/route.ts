import { NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase-admin';
import { Resend } from 'resend';

export async function POST(request: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'Email service is not configured (Missing API Key)' }, { status: 500 });
    }
    
    const resend = new Resend(apiKey);
    const { email } = await request.json();

    // Generate Firebase password reset link
    const resetLink = await adminAuth.generatePasswordResetLink(email);

    // Send the email using Resend
    const { data, error } = await resend.emails.send({
      from: 'BarberBook <onboarding@resend.dev>', // Update this to your verified domain later
      to: email,
      subject: 'Reset your BarberBook Password',
      html: `
        <div style="font-family: sans-serif; padding: 20px;">
          <h2>Password Reset Request</h2>
          <p>We received a request to reset your password for your BarberBook account.</p>
          <p>Click the link below to reset it:</p>
          <a href="${resetLink}" style="display: inline-block; padding: 10px 20px; background-color: #4f46e5; color: white; text-decoration: none; border-radius: 5px; margin: 15px 0;">Reset Password</a>
          <p>If you didn't request this, you can safely ignore this email.</p>
        </div>
      `,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json({ error: error.message || 'Failed to send email' }, { status: 500 });
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error: any) {
    console.error('Password reset generation error:', error);
    // Return success anyway to prevent email enumeration attacks, 
    // or handle specific "user-not-found" errors securely.
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
