import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FloatingAIWidget } from '@/components/ai/FloatingAIWidget';

export function AppShell() {
  return (
    <div className="relative flex h-screen w-full overflow-hidden bg-background">
      {/* Decorative gradient orbs */}
      <div className="gradient-orb absolute top-[-20%] left-[-10%] h-[500px] w-[500px]" />
      <div className="gradient-orb absolute bottom-[-15%] right-[-5%] h-[400px] w-[400px]" />
      <div className="gradient-orb absolute top-[50%] right-[20%] h-[300px] w-[300px] opacity-10" />

      {/* Sidebar */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <TopNav />
        <ScrollArea className="flex-1">
          <main className="p-4 md:p-6 lg:p-8">
            <Outlet />
          </main>
        </ScrollArea>
      </div>

      {/* Floating AI Widget */}
      <FloatingAIWidget />
    </div>
  );
}
