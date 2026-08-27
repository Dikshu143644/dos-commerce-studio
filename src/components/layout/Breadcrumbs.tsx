import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

const routeLabels: Record<string, string> = {
  '': 'Platform Hub',
  store: 'Commerce',
  portal: 'Client Portal',
  erp: 'ERP Workspace',
  dashboard: 'Executive Dashboard',
  inventory: 'Inventory',
  products: 'Products',
  warehouses: 'Warehouses',
  movements: 'Stock Movements',
  categories: 'Categories',
  crm: 'CRM',
  customers: 'Customers',
  leads: 'Leads',
  deals: 'Deals',
  activities: 'Activities',
  procurement: 'Procurement',
  suppliers: 'Suppliers',
  orders: 'Orders',
  sales: 'Sales',
  invoices: 'Invoices',
  reports: 'Reports',
  analytics: 'Analytics',
  export: 'Excel Export',
  ai: 'AI Assistant',
  settings: 'Settings',
  users: 'Users',
  roles: 'Roles',
  'audit-log': 'Audit Log',
};

export function Breadcrumbs() {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  if (segments.length === 0) {
    return (
      <div className="flex items-center gap-1.5 text-sm">
        <Home className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-foreground font-medium">Platform Hub</span>
      </div>
    );
  }

  return (
    <nav className="flex items-center gap-1.5 text-sm" aria-label="Breadcrumb">
      <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
        <Home className="h-3.5 w-3.5" />
      </Link>
      {segments.map((segment, index) => {
        const path = '/' + segments.slice(0, index + 1).join('/');
        const isLast = index === segments.length - 1;
        const label = routeLabels[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

        return (
          <div key={path} className="flex items-center gap-1.5">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            {isLast ? (
              <span className={cn('font-medium text-foreground')}>{label}</span>
            ) : (
              <Link
                to={path}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {label}
              </Link>
            )}
          </div>
        );
      })}
    </nav>
  );
}
