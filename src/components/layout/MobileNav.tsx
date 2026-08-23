import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Package, Users, ShoppingCart, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const tabs = [
  { label: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { label: 'Inventory', icon: Package, path: '/inventory' },
  { label: 'CRM', icon: Users, path: '/crm' },
  { label: 'Sales', icon: ShoppingCart, path: '/sales' },
  { label: 'AI', icon: Bot, path: '/ai' },
];

export function MobileNav() {
  const isMobile = useMediaQuery('(max-width: 767px)');
  const location = useLocation();
  const navigate = useNavigate();
  const [visible, setVisible] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY.current && currentScrollY > 60) {
        setVisible(false);
      } else {
        setVisible(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!isMobile) return null;

  const activeTab = tabs.find((tab) => {
    if (tab.path === '/') return location.pathname === '/';
    return location.pathname.startsWith(tab.path);
  });

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
        {tabs.map((tab) => {
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
