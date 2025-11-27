'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Don't show sidebar on login page
  const showSidebar = pathname !== '/login';

  return (
    <>
      {showSidebar && <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />}
      <main className={showSidebar ? `${isSidebarOpen ? 'ml-64' : 'ml-20'} transition-all duration-300` : ''}>
        <div className={showSidebar ? 'p-8' : ''}>
          {children}
        </div>
      </main>
    </>
  );
}
