'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Menu } from 'lucide-react';
import Sidebar from './Sidebar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setIsSidebarOpen(true); // Open sidebar on desktop
      }
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Don't show sidebar on login page
  const showSidebar = pathname !== '/login';

  return (
    <>
      {showSidebar && <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />}

      {/* Mobile Menu Button */}
      {showSidebar && isMobile && (
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="fixed top-4 left-4 z-30 lg:hidden bg-emerald-600 text-white p-3 rounded-lg shadow-lg hover:bg-emerald-700 transition-colors"
        >
          <Menu className="w-6 h-6" />
        </button>
      )}

      <main className={showSidebar ? `${isSidebarOpen && !isMobile ? 'lg:ml-64' : 'lg:ml-20'} transition-all duration-300` : ''}>
        <div className={showSidebar ? 'p-8 pt-20 lg:pt-8' : ''}>
          {children}
        </div>
      </main>
    </>
  );
}
