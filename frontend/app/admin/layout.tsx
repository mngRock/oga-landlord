import { createClient } from '@/lib/supabaseServer';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import UserMenu from '@/components/UserMenu'; // Import the UserMenu

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return redirect('/'); // Not logged in, send to login
  }

  // Fetch the user's full profile, including their name
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return redirect('/dashboard'); // Not an admin, send to regular dashboard
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm p-4 fixed top-0 w-full z-10">
            <div className="max-w-7xl mx-auto flex justify-between items-center">
                <div className="flex items-center">
                    <img className="h-10 w-10" src="https://em-content.zobj.net/source/microsoft-teams/363/house-building_1f3e0.png" alt="Oga Landlord Logo" />
                    <span className="ml-2 text-xl font-bold text-teal-700">Oga Landlord - Admin</span>
                </div>
                {/* Use the UserMenu component here */}
                <UserMenu userName={profile.full_name || null} />
            </div>
        </header>
        <main className="p-6 pt-24">
            {children}
        </main>
    </div>
  );
}