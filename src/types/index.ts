import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: LucideIcon;
  badge?: string | number;
  disabled?: boolean;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface KPIData {
  label: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

export interface Column<T> {
  key: keyof T | string;
  title: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
}
