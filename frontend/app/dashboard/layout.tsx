'use client'

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import UserMenu from '@/components/UserMenu';
import Sidebar from '@/components/Sidebar';
import NotificationBell from '@/components/NotificationBell';
import { User } from '@supabase/supabase-js';

type NavItem = {
  name: string;
  href: string;
  icon: string;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [navItems, setNavItems] = useState<NavItem[]>([]);

  const landlordNav: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: 'fas fa-tachometer-alt' },
    { name: 'Properties', href: '/dashboard/properties', icon: 'fas fa-building' },
    { name: 'Applications', href: '/dashboard/applications', icon: 'fas fa-file-alt' },
    { name: 'Tenants', href: '/dashboard/tenants', icon: 'fas fa-user-friends' },
    { name: 'Messages', href: '/dashboard/messages', icon: 'fas fa-comments' },
    { name: 'Maintenance', href: '/dashboard/maintenance', icon: 'fas fa-tools' },
    { name: 'Payments', href: '/dashboard/payments', icon: 'fas fa-money-bill-wave' },
    { name: 'Settings', href: '/dashboard/settings', icon: 'fas fa-cog' },
    { name: 'Help & Support', href: '/dashboard/help', icon: 'fas fa-question-circle' },
  ];

  const renterNav: NavItem[] = [
    { name: 'Dashboard', href: '/dashboard', icon: 'fas fa-tachometer-alt' },
    { name: 'Find Properties', href: '/find-properties', icon: 'fas fa-search' },
    { name: 'My Applications', href: '/dashboard/my-applications', icon: 'fas fa-clipboard-list' },
    { name: 'My Rental', href: '/dashboard/my-rental', icon: 'fas fa-file-contract' },
    { name: 'Messages', href: '/dashboard/messages', icon: 'fas fa-comments' },
    { name: 'Maintenance', href: '/dashboard/maintenance', icon: 'fas fa-tools' },
    { name: 'Settings', href: '/dashboard/settings', icon: 'fas fa-cog' },
    { name: 'Help & Support', href: '/dashboard/help', icon: 'fas fa-question-circle' },
  ];
  
  const adminNav: NavItem[] = [
    { name: 'Admin Panel', href: '/dashboard/admin', icon: 'fas fa-user-shield' },
    { name: 'Settings', href: '/dashboard/settings', icon: 'fas fa-cog' },
    { name: 'Help & Support', href: '/dashboard/help', icon: 'fas fa-question-circle' },
  ];

  useEffect(() => {
    const fetchUserAndProfile = async () => {
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      setUser(currentUser);

      if (currentUser) {
        const { data: userProfile } = await supabase.from('profiles').select('full_name, role').eq('id', currentUser.id).single();
        setProfile(userProfile);

        if (userProfile?.role === 'admin') {
          setNavItems(adminNav);
        } else if (userProfile?.role === 'landlord') {
          setNavItems(landlordNav);
        } else {
          setNavItems(renterNav);
        }
      } else {
        setNavItems(renterNav); // Default for logged-out state (though middleware should prevent this)
      }
    };
    fetchUserAndProfile();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar navItems={navItems} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <div className="md:ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                {/* Hamburger button for mobile */}
                <button onClick={() => setIsSidebarOpen(true)} className="md:hidden mr-4 text-gray-500 hover:text-gray-800">
                  <i className="fas fa-bars text-xl"></i>
                </button>

                {/* Logo for desktop */}
                <div className="hidden md:flex items-center">
                    <img className="h-10 w-10" src="https://em-content.zobj.net/source/microsoft-teams/363/house-building_1f3e0.png" alt="Oga Landlord Logo" />
                    <span className="ml-2 text-xl font-bold text-teal-700">Oga Landlord</span>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {user && <NotificationBell userId={user.id} />}
                <UserMenu userName={profile?.full_name || null} />
              </div>
            </div>
          </div>
        </header>
        
        <main>
          {children}
        </main>
      </div>
    </div>
  );
}