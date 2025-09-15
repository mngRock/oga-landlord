'use client'

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import toast from 'react-hot-toast';
import Link from 'next/link';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const toastId = toast.loading('Sending reset link...');
    
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/update-password`,
    });

    if (error) {
      toast.error(`Error: ${error.message}`, { id: toastId });
    } else {
      toast.success('Password reset link sent! Please check your email.', { id: toastId });
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-500 to-emerald-700">
      <div className="p-8 w-full max-w-md bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl">
        <h1 className="text-2xl font-bold text-center mb-4">Forgot Password</h1>
        <p className="text-center text-gray-600 mb-6">Enter your email and we'll send you a link to reset your password.</p>
        <form onSubmit={handlePasswordReset} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email Address</label>
            <input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md" required />
          </div>
          <button type="submit" disabled={loading} className="w-full py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:opacity-50">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
        <div className="mt-4 text-center">
            <Link href="/" className="text-sm text-teal-600 hover:underline">Back to Login</Link>
        </div>
      </div>
    </div>
  );
}