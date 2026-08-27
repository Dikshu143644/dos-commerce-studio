import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Store, Users, Building2, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/hooks/useAuth';

const tabs = [
  { label: 'Hub', icon: LayoutDashboard, path: '/' },
  { label: 'Commerce', icon: Store, path: '/store' },
  { label: 'CRM', icon: Users, path: '/crm' },
  { label: 'ERP', icon: Building2, path: '/erp' },
  { label: 'AI', icon: Bot, path: '/ai' },
];

export function MobileNav() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    // The main scroll container is a Radix ScrollArea viewport, not window.
    // Query for the viewport element which Radix renders with data-radix-scroll-area-viewport.
    const viewport = document.querySelector('[data-radix-scroll-area-viewport]');
    if (!viewport) return;

    const handleScroll = () => {
      const currentScrollY = viewport.scrollTop;
      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  if (!isMobile) return null;

  const activePath = location.pathname.startsWith('/store') || location.pathname.startsWith('/portal')
    ? '/store'
    : location.pathname.startsWith('/crm')
      ? '/crm'
      : ['/erp', '/inventory', '/sales', '/procurement', '/finance', '/reports'].some((prefix) => location.pathname.startsWith(prefix))
        ? '/erp'
        : location.pathname.startsWith('/ai')
          ? '/ai'
          : '/';
  const availableTabs = userRole === 'client'
    ? tabs.filter((tab) => ['/', '/store', '/ai'].includes(tab.path))
    : userRole === 'viewer'
      ? tabs.filter((tab) => tab.path !== '/crm')
      : tabs;
  const activeTab = availableTabs.find((tab) => tab.path === activePath);

  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 transition-transform duration-300',
        'glass border-t border-border',
        'pb-[env(safe-area-inset-bottom)]',
        visible ? 'translate-y-0' : 'translate-y-full'
      )}
    >
      <div className="flex items-center justify-around h-16">
        {availableTabs.map((tab) => {
          const isActive = activeTab?.path === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 flex-1 h-full relative',
                'min-h-[44px] min-w-[44px]',
                'transition-colors duration-200',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
              )}
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
