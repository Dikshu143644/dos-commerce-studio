import { useMemo } from 'react';
import { useLocation, Link } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  ArrowRightLeft,
  FolderTree,
  Users,
  UserPlus,
  Handshake,
  Activity,
  Truck,
  ClipboardList,
  ShoppingCart,
  FileText,
  BarChart3,
  FileSpreadsheet,
  Bot,
  BookOpen,
  Settings,
  Shield,
  ScrollText,
  PanelLeftClose,
  PanelLeftOpen,
  Repeat2,
  PackageCheck,
  SlidersHorizontal,
  AlertTriangle,
  CalendarClock,
  Filter,
  RotateCcw,
  CreditCard,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { useSidebar } from '@/contexts/SidebarContext';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useAuth } from '@/hooks/useAuth';
import type { NavSection } from '@/types';
import type { UserRole } from '@/contexts/AuthContext';

const navSections: NavSection[] = [
  {
    title: 'Main',
    items: [{ title: 'Dashboard', href: '/', icon: LayoutDashboard }],
  },
  {
    title: 'Inventory',
    items: [
      { title: 'Products', href: '/inventory/products', icon: Package },
      { title: 'Warehouses', href: '/inventory/warehouses', icon: Warehouse },
      { title: 'Stock Movements', href: '/inventory/movements', icon: ArrowRightLeft },
      { title: 'Categories', href: '/inventory/categories', icon: FolderTree },
      { title: 'Transfers', href: '/inventory/transfers', icon: Repeat2 },
      { title: 'Receiving', href: '/inventory/receiving', icon: PackageCheck },
      { title: 'Adjustments', href: '/inventory/adjustments', icon: SlidersHorizontal },
      { title: 'Low Stock', href: '/inventory/low-stock', icon: AlertTriangle },
    ],
  },
  {
    title: 'CRM',
    items: [
      { title: 'Customers', href: '/crm/customers', icon: Users },
      { title: 'Leads', href: '/crm/leads', icon: UserPlus },
      { title: 'Deals', href: '/crm/deals', icon: Handshake },
      { title: 'Activities', href: '/crm/activities', icon: Activity },
      { title: 'Follow-ups', href: '/crm/follow-ups', icon: CalendarClock },
      { title: 'Funnel', href: '/crm/funnel', icon: Filter },
    ],
  },
  {
    title: 'Procurement',
    items: [
      { title: 'Suppliers', href: '/procurement/suppliers', icon: Truck },
      { title: 'Purchase Orders', href: '/procurement/orders', icon: ClipboardList },
    ],
  },
  {
    title: 'Sales',
    items: [
      { title: 'Sales Orders', href: '/sales/orders', icon: ShoppingCart },
      { title: 'Invoices', href: '/sales/invoices', icon: FileText },
      { title: 'Returns', href: '/sales/returns', icon: RotateCcw },
      { title: 'Payments', href: '/sales/payments', icon: CreditCard },
    ],
  },
  {
    title: 'Reports',
    items: [
      { title: 'Analytics', href: '/reports/analytics', icon: BarChart3 },
      { title: 'Excel Export', href: '/reports/export', icon: FileSpreadsheet },
    ],
  },
  {
    title: 'AI',
    items: [
      { title: 'AI Assistant', href: '/ai', icon: Bot },
      { title: 'Knowledge Base', href: '/ai/knowledge-base', icon: BookOpen },
    ],
  },
  {
    title: 'Settings',
    items: [
      { title: 'Settings', href: '/settings', icon: Settings },
      { title: 'Users', href: '/settings/users', icon: Users },
      { title: 'Roles', href: '/settings/roles', icon: Shield },
      { title: 'Branches', href: '/settings/branches', icon: Building2 },
      { title: 'Audit Log', href: '/settings/audit-log', icon: ScrollText },
    ],
  },
];

// Sections visible by role:
// viewer/client: Main, Sales, AI
// staff: Main, Inventory, CRM, Procurement, Sales, Reports, AI
// manager: Main, Inventory, CRM, Procurement, Sales, Reports, AI
// admin: All sections (including Settings)
const sectionsByRole: Record<UserRole, string[]> = {
  viewer: ['Main', 'Sales', 'AI'],
  client: ['Main', 'Sales', 'AI'],
  staff: ['Main', 'Inventory', 'CRM', 'Procurement', 'Sales', 'Reports', 'AI'],
  manager: ['Main', 'Inventory', 'CRM', 'Procurement', 'Sales', 'Reports', 'AI'],
  admin: ['Main', 'Inventory', 'CRM', 'Procurement', 'Sales', 'Reports', 'AI', 'Settings'],
};

function getFilteredSections(role: UserRole): NavSection[] {
  const allowedTitles = sectionsByRole[role] || sectionsByRole.viewer;
  return navSections.filter((section) => allowedTitles.includes(section.title));
}

function SidebarContent() {
  const location = useLocation();
  const { isCollapsed, toggle } = useSidebar();
  const { userRole, profile } = useAuth();

  const filteredSections = useMemo(() => getFilteredSections(userRole), [userRole]);

  const isActive = (href: string) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  const displayName = profile?.full_name || 'User';
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  const roleName = userRole.charAt(0).toUpperCase() + userRole.slice(1);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-full flex-col">
        {/* Logo */}
        <div className={cn('flex h-16 items-center border-b border-slate-200 px-4 bg-white', isCollapsed && 'justify-center px-2')}>
          {isCollapsed ? (
            <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-tr from-amber-500 to-orange-500 shadow-sm shadow-orange-500/20">
              <span className="text-sm font-black text-white">S</span>
            </div>
          ) : (
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-tr from-amber-500 to-orange-500 shadow-sm shadow-orange-500/20">
                <span className="text-sm font-black text-white">S</span>
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">
                Stock<span className="text-orange-500">Flow</span>
              </span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-4 bg-white">
          <nav className="space-y-6 px-3">
            {filteredSections.map((section) => (
              <div key={section.title} className="space-y-1">
                {!isCollapsed && (
                  <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    {section.title}
                  </p>
                )}
                {section.items.map((item) => {
                  const active = isActive(item.href);
                  const linkContent = (
                    <Link
                      to={item.href}
                      className={cn(
                        'flex items-center gap-3 rounded-[12px] px-3 py-2 text-sm font-medium transition-all duration-200',
                        active
                          ? 'bg-orange-50 text-orange-600 font-bold border border-orange-200/80 shadow-xs'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                        isCollapsed && 'justify-center px-2'
                      )}
                    >
                      <item.icon className={cn('h-4 w-4 shrink-0', active ? 'text-orange-500' : 'text-slate-400')} />
                      {!isCollapsed && <span>{item.title}</span>}
                    </Link>
                  );

                  if (isCollapsed) {
                    return (
                      <Tooltip key={item.href}>
                        <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                        <TooltipContent side="right">{item.title}</TooltipContent>
                      </Tooltip>
                    );
                  }

                  return <div key={item.href}>{linkContent}</div>;
                })}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* User profile & collapse toggle */}
        <div className="border-t border-slate-200 p-3 bg-slate-50/50">
          {!isCollapsed && (
            <div className="flex items-center gap-3 rounded-[12px] px-3 py-2 mb-2 bg-white border border-slate-200/80 shadow-xs">
              <Avatar className="h-8 w-8 border border-orange-200">
                <AvatarFallback className="text-xs bg-orange-100 text-orange-600 font-bold">{initials}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                <p className="text-xs text-slate-500 font-medium truncate">{roleName}</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size={isCollapsed ? 'icon' : 'sm'}
            className={cn('w-full text-slate-600 hover:text-slate-900 hover:bg-slate-100', !isCollapsed && 'justify-start gap-2')}
            onClick={toggle}
            aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <>
                <PanelLeftClose className="h-4 w-4" />
                <span>Collapse</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}

export function Sidebar() {
  const { isCollapsed, isMobileOpen, setMobileOpen } = useSidebar();
  const isMobile = useMediaQuery('(max-width: 767px)');

  if (isMobile) {
    return (
      <Sheet open={isMobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-white border-r border-slate-200">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <aside
      className={cn(
        'hidden md:flex flex-col h-screen border-r border-slate-200 bg-white z-30 transition-all duration-300 shadow-xs',
        isCollapsed ? 'w-[68px]' : 'w-64'
      )}
    >
      <SidebarContent />
    </aside>
  );
}
