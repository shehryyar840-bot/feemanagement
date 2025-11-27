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
  Menu,
  X,
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
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
    <>
      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full bg-white border-r border-gray-200 shadow-lg transition-all duration-300 z-40 ${
          isOpen ? 'w-64' : 'w-20'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {isOpen && (
            <div className="flex items-center gap-2">
              <div className="bg-emerald-600 p-2 rounded-lg">
                <Wallet className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-gray-900 font-bold text-sm leading-tight">
                  ALI School
                </span>
                <span className="text-gray-500 text-xs">System</span>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {isOpen ? (
              <X className="w-5 h-5 text-gray-600" />
            ) : (
              <Menu className="w-5 h-5 text-gray-600" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                className={`
                  flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200
                  ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-600 font-medium'
                      : 'text-gray-700 hover:bg-gray-100'
                  }
                `}
                title={!isOpen ? item.name : undefined}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                {isOpen && <span className="text-sm">{item.name}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Info & Logout */}
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-200 bg-white">
          {isOpen ? (
            <div className="space-y-2">
              <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 rounded-lg">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold flex-shrink-0">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {user.role === 'ADMIN' ? 'Administrator' : 'Teacher'}
                  </p>
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-center">
                <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center text-white font-semibold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <button
                onClick={logout}
                className="w-full flex justify-center p-2 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
