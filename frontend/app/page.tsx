'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../lib/supabaseClient';
import Link from 'next/link';

export default function AuthPage() {
  const router = useRouter();
  const [isLoginView, setIsLoginView] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [role, setRole] = useState('landlord');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signUp({
      email, password, options: { data: { full_name: fullName, phone_number: phoneNumber, role: role } },
    });
    if (error) { setMessage(error.message); } 
    else { setMessage('Success! Please check your email for a verification link.'); }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    } else {
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-teal-500 to-emerald-700">
      <div className="p-8 w-full max-w-md bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-2"><img src="https://em-content.zobj.net/source/microsoft-teams/363/house-building_1f3e0.png" alt="Oga Landlord Logo" className="h-16 w-16 object-contain"/></div>
          <h1 className="text-2xl font-bold text-gray-800">{isLoginView ? 'Welcome to Oga Landlord' : 'Create an Account'}</h1>
          <p className="text-gray-600">Nigeria's Premier Rental Management Platform</p>
        </div>
        {isLoginView ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div><label className="block text-gray-700 mb-1" htmlFor="email">Email Address</label><input type="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg" placeholder="your@email.com" required /></div>
            <div><label className="block text-gray-700 mb-1" htmlFor="password">Password</label><input type="password" id="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg" placeholder="••••••••" required /></div>
            <div className="flex items-center justify-end"><Link href="/forgot-password" className="text-sm text-teal-600 hover:underline">Forgot password?</Link></div>
            <button type="submit" disabled={loading} className="w-full py-2 px-4 rounded-lg font-medium bg-teal-600 text-white hover:bg-teal-700 disabled:bg-teal-400">{loading ? 'Signing In...' : 'Sign In'}</button>
          </form>
        ) : (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div><label className="block text-gray-700 mb-1" htmlFor="full-name">Full Name</label><input type="text" id="full-name" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required /></div>
            <div><label className="block text-gray-700 mb-1" htmlFor="phone-number">Phone Number</label><input type="tel" id="phone-number" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required /></div>
            <div><label className="block text-gray-700 mb-1" htmlFor="reg-email">Email Address</label><input type="email" id="reg-email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required /></div>
            <div><label className="block text-gray-700 mb-1" htmlFor="reg-password">Password</label><input type="password" id="reg-password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-2 border rounded-lg" required /></div>
            <div><label className="block text-gray-700 mb-2">I am registering as a:</label><div className="grid grid-cols-2 gap-4"><label className="flex items-center p-3 border rounded-lg cursor-pointer"><input type="radio" name="user-type" value="landlord" className="text-teal-600" checked={role === 'landlord'} onChange={() => setRole('landlord')}/><span className="ml-2 text-sm">Landlord</span></label><label className="flex items-center p-3 border rounded-lg cursor-pointer"><input type="radio" name="user-type" value="renter" className="text-teal-600" checked={role === 'renter'} onChange={() => setRole('renter')}/><span className="ml-2 text-sm">Renter</span></label></div></div>
            <button type="submit" disabled={loading} className="w-full py-2 px-4 rounded-lg font-medium bg-teal-600 text-white hover:bg-teal-700 disabled:bg-teal-400">{loading ? 'Creating Account...' : 'Create Account'}</button>
          </form>
        )}
        {message && !loading && <p className="mt-4 text-center text-sm text-red-600">{message}</p>}
        <div className="mt-6 text-center"><p className="text-gray-600">{isLoginView ? "Don't have an account?" : "Already have an account?"}<button onClick={() => { setIsLoginView(!isLoginView); setMessage(''); }} className="ml-1 text-teal-600 font-medium hover:underline">{isLoginView ? 'Sign up' : 'Sign in'}</button></p></div>
      </div>
    </div>
  );
}