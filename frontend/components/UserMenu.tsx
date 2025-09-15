'use client'

import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function UserMenu({ userName }: { userName: string | null }) {
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // After logout, always redirect to the home/login page
    router.push('/');
    router.refresh();
  };

  return (
    <div className="flex items-center">
      <span className="ml-2 hidden md:flex text-sm font-medium text-gray-700">
        {userName || 'User'}
      </span>
      <button 
        onClick={handleLogout} 
        className="ml-4 px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
      >
        Logout
      </button>
    </div>
  );
}