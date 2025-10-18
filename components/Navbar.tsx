'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Receipt,
  BarChart3,
  Wallet,
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Classes', href: '/classes', icon: GraduationCap },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Fee Records', href: '/fee-records', icon: Receipt },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="bg-white p-2 rounded-lg group-hover:scale-110 transition-transform duration-200">
              <Wallet className="h-6 w-6 text-blue-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-xl leading-tight">
                Fee Management
              </span>
              <span className="text-blue-200 text-xs">System</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <div className="flex space-x-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-all duration-200
                    ${
                      isActive
                        ? 'bg-white text-blue-600 shadow-md'
                        : 'text-blue-100 hover:bg-blue-500 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User Info (Optional) */}
          <div className="flex items-center gap-2">
            <div className="text-right hidden sm:block">
              <p className="text-white text-sm font-medium">Admin User</p>
              <p className="text-blue-200 text-xs">Super Admin</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold">
              A
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
