import { Link, useLocation } from 'react-router-dom';
import { Building2, ChevronDown, Contact, LayoutGrid, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const workspaces = [
  { label: 'Platform Hub', description: 'All workspaces', href: '/', icon: LayoutGrid },
  { label: 'Commerce', description: 'Store and client portal', href: '/store', icon: Store },
  { label: 'CRM', description: 'Customers and pipeline', href: '/crm', icon: Contact },
  { label: 'ERP', description: 'Operations and finance', href: '/erp', icon: Building2 },
];

export function WorkspaceSwitcher() {
  const { pathname } = useLocation();
  const { userRole } = useAuth();
  const current = pathname.startsWith('/crm')
    ? workspaces[2]
    : pathname.startsWith('/erp') || pathname.startsWith('/inventory') || pathname.startsWith('/sales') || pathname.startsWith('/procurement') || pathname.startsWith('/finance') || pathname.startsWith('/reports')
      ? workspaces[3]
      : pathname.startsWith('/store') || pathname.startsWith('/portal')
        ? workspaces[1]
        : workspaces[0];
  const availableWorkspaces = userRole === 'client'
    ? workspaces.filter((workspace) => ['/', '/store'].includes(workspace.href))
    : userRole === 'viewer'
      ? workspaces.filter((workspace) => workspace.href !== '/crm')
      : workspaces;
  const CurrentIcon = current.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="hidden md:flex h-9 gap-2 border-slate-200 bg-white">
          <CurrentIcon className="h-4 w-4 text-purple-600" />
          <span className="font-semibold">{current.label}</span>
          <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-64">
        <DropdownMenuLabel>Switch workspace</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableWorkspaces.map((workspace) => {
          const Icon = workspace.icon;
          return (
            <DropdownMenuItem key={workspace.href} asChild>
              <Link to={workspace.href} className="flex cursor-pointer items-center gap-3 py-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <Icon className="h-4 w-4" />
                </span>
                <span>
                  <span className="block text-sm font-semibold">{workspace.label}</span>
                  <span className="block text-xs text-muted-foreground">{workspace.description}</span>
                </span>
              </Link>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
