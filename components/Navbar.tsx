'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Receipt,
  BarChart3,
  Wallet,
  Grid3x3,
  UserCheck,
  ClipboardList,
  LogOut,
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout, isAdmin } = useAuth();

  // Navigation items based on role
  const adminNavigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Classes', href: '/classes', icon: GraduationCap },
    { name: 'Students', href: '/students', icon: Users },
    { name: 'Teachers', href: '/teachers', icon: UserCheck },
    { name: 'Attendance', href: '/attendance', icon: ClipboardList },
    { name: 'Fee Records', href: '/fee-records', icon: Receipt },
    { name: 'Class-Wise', href: '/class-wise', icon: Grid3x3 },
    { name: 'Reports', href: '/reports', icon: BarChart3 },
  ];

  const teacherNavigation = [
    { name: 'My Classes', href: '/my-classes', icon: GraduationCap },
    { name: 'Students', href: '/students', icon: Users },
    { name: 'Attendance', href: '/attendance', icon: ClipboardList },
  ];

  const navigation = isAdmin ? adminNavigation : teacherNavigation;

  if (!user) return null;

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-emerald-600 to-emerald-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <Link
            href={isAdmin ? '/dashboard' : '/attendance'}
            className="flex items-center gap-3 group"
          >
            <div className="bg-white p-2 rounded-lg group-hover:scale-110 transition-transform duration-200">
              <Wallet className="h-6 w-6 text-emerald-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-xl leading-tight">
                Fee Management
              </span>
              <span className="text-emerald-200 text-xs">System</span>
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
                        ? 'bg-white text-emerald-600 shadow-md'
                        : 'text-emerald-100 hover:bg-emerald-500 hover:text-white'
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* User Info & Logout */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-white text-sm font-medium">{user.name}</p>
              <p className="text-emerald-200 text-xs">
                {user.role === 'ADMIN' ? 'Administrator' : 'Teacher'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-semibold">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-emerald-100 hover:bg-emerald-500 hover:text-white transition-all duration-200"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden lg:inline">Logout</span>
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
