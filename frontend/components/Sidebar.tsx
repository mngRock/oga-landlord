'use client'

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavItem = {
  name: string;
  href: string;
  icon: string;
};

type SidebarProps = {
  navItems: NavItem[];
  isOpen: boolean;
  onClose: () => void; // Function to close the mobile menu
};

export default function Sidebar({ navItems, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Overlay for mobile */}
      <div 
        className={`fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r z-30 transform transition-transform md:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-full flex flex-col">
          {/* Logo in sidebar for mobile view */}
          <div className="flex items-center justify-between p-4 border-b h-16">
             <div className="flex items-center">
                <img className="h-10 w-10" src="https://em-content.zobj.net/source/microsoft-teams/363/house-building_1f3e0.png" alt="Oga Landlord Logo" />
                <span className="ml-2 text-xl font-bold text-teal-700">Oga Landlord</span>
             </div>
             <button onClick={onClose} className="md:hidden text-gray-500 hover:text-gray-800">
                <i className="fas fa-times text-xl"></i>
             </button>
          </div>
          
          {/* Navigation Links - now scrollable */}
          <nav className="flex-1 overflow-y-auto p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href} 
                    onClick={onClose} // Close menu on navigation
                    className={`flex items-center px-4 py-3 rounded-lg transition-colors 
                      ${pathname === item.href 
                        ? 'bg-teal-50 text-teal-700 font-semibold' 
                        : 'text-gray-700 hover:bg-gray-100'}`
                      }
                  >
                    <i className={`${item.icon} w-5 text-center`}></i>
                    <span className="ml-3">{item.name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </aside>
    </>
  );
}