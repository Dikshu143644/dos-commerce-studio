import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Settings,
  Shield,
  ScrollText,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';

const navigationItems = [
  { title: 'Dashboard', href: '/', icon: LayoutDashboard, group: 'Navigation' },
  { title: 'Products', href: '/inventory/products', icon: Package, group: 'Inventory' },
  { title: 'Warehouses', href: '/inventory/warehouses', icon: Warehouse, group: 'Inventory' },
  { title: 'Stock Movements', href: '/inventory/movements', icon: ArrowRightLeft, group: 'Inventory' },
  { title: 'Categories', href: '/inventory/categories', icon: FolderTree, group: 'Inventory' },
  { title: 'Customers', href: '/crm/customers', icon: Users, group: 'CRM' },
  { title: 'Leads', href: '/crm/leads', icon: UserPlus, group: 'CRM' },
  { title: 'Deals', href: '/crm/deals', icon: Handshake, group: 'CRM' },
  { title: 'Activities', href: '/crm/activities', icon: Activity, group: 'CRM' },
  { title: 'Suppliers', href: '/procurement/suppliers', icon: Truck, group: 'Procurement' },
  { title: 'Purchase Orders', href: '/procurement/orders', icon: ClipboardList, group: 'Procurement' },
  { title: 'Sales Orders', href: '/sales/orders', icon: ShoppingCart, group: 'Sales' },
  { title: 'Invoices', href: '/sales/invoices', icon: FileText, group: 'Sales' },
  { title: 'Analytics', href: '/reports/analytics', icon: BarChart3, group: 'Reports' },
  { title: 'Excel Export', href: '/reports/export', icon: FileSpreadsheet, group: 'Reports' },
  { title: 'AI Assistant', href: '/ai', icon: Bot, group: 'AI' },
  { title: 'Settings', href: '/settings', icon: Settings, group: 'Settings' },
  { title: 'Users', href: '/settings/users', icon: Users, group: 'Settings' },
  { title: 'Roles', href: '/settings/roles', icon: Shield, group: 'Settings' },
  { title: 'Audit Log', href: '/settings/audit-log', icon: ScrollText, group: 'Settings' },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  const handleSelect = useCallback(
    (href: string) => {
      navigate(href);
      setOpen(false);
    },
    [navigate]
  );

  const groups = [...new Set(navigationItems.map((item) => item.group))];

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {groups.map((group, groupIndex) => (
          <div key={group}>
            {groupIndex > 0 && <CommandSeparator />}
            <CommandGroup heading={group}>
              {navigationItems
                .filter((item) => item.group === group)
                .map((item) => (
                  <CommandItem
                    key={item.href}
                    value={item.title}
                    onSelect={() => handleSelect(item.href)}
                  >
                    <item.icon className="mr-2 h-4 w-4" />
                    <span>{item.title}</span>
                  </CommandItem>
                ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
