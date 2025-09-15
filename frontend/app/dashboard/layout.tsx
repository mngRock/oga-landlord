import Link from 'next/link';
import UserMenu from '@/components/UserMenu';
import Sidebar from '@/components/Sidebar';
import { createClient } from '@/lib/supabaseServer';
import NotificationBell from '@/components/NotificationBell';

type NavItem = {
  name: string;
  href: string;
  icon: string;
};

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', user?.id)
    .single();

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
    { name: 'Admin Panel', href: '/admin', icon: 'fas fa-user-shield' },
    { name: 'Settings', href: '/dashboard/settings', icon: 'fas fa-cog' },
    { name: 'Help & Support', href: '/dashboard/help', icon: 'fas fa-question-circle' },
  ];
  
  let navItems: NavItem[];
  if (profile?.role === 'admin') {
    navItems = adminNav;
  } else if (profile?.role === 'landlord') {
    navItems = landlordNav;
  } else {
    navItems = renterNav;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Note: The sidebar logic will need to be client-side to be toggleable */}
      <aside className="w-64 fixed h-full bg-white border-r hidden md:block">
          <div className="p-4 border-b h-16 flex items-center">
            <img className="h-10 w-10" src="https://em-content.zobj.net/source/microsoft-teams/363/house-building_1f3e0.png" alt="Oga Landlord Logo" />
            <span className="ml-2 text-xl font-bold text-teal-700">Oga Landlord</span>
          </div>
          <nav className="p-4">
            <ul className="space-y-1">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link href={item.href} className="flex items-center px-4 py-3 text-gray-700 rounded-lg hover:bg-gray-100">
                    <i className={`${item.icon} w-5 text-center`}></i>
                    <span className="ml-3">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
      </aside>

      <div className="md:ml-64">
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <div className="flex items-center md:hidden">
                {/* Hamburger menu can be added here in a client component */}
              </div>
              <div className="flex items-center ml-auto gap-4">
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