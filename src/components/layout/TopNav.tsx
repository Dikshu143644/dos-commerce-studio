import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Menu, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Breadcrumbs } from './Breadcrumbs';
import { BranchSwitcher } from './BranchSwitcher';
import { useSidebar } from '@/contexts/SidebarContext';
import { useAuth } from '@/hooks/useAuth';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { cn } from '@/lib/utils';

export function TopNav() {
  const { setMobileOpen } = useSidebar();
  const { user, profile, logout, userRole, loginDemo } = useAuth();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/landing', { replace: true });
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'DOS-APP';
  const initials = displayName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  // Full-screen search overlay for mobile
  if (isMobile && searchOpen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-white/98 backdrop-blur-md p-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(false)}
            aria-label="Close search"
          >
            <X className="h-5 w-5" />
          </Button>
          <input
            autoFocus
            type="text"
            placeholder="Search..."
            className="flex-1 h-10 rounded-lg border border-slate-200 bg-slate-50 px-4 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-orange-500"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSearchOpen(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-slate-200 bg-white/95 backdrop-blur-md px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile: show app title */}
      <span className="md:hidden text-sm font-bold text-foreground truncate">
        DOS<span className="text-purple-600">CRM</span>
      </span>

      <div className="hidden md:block">
        <Breadcrumbs />
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Mobile: search icon that opens overlay */}
        <Button
          variant="ghost"
          size="icon"
          className={cn('md:hidden')}
          onClick={() => setSearchOpen(true)}
          aria-label="Open search"
        >
          <Search className="h-5 w-5 text-muted-foreground" />
        </Button>

        {/* Desktop: inline search button */}
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex gap-2 text-muted-foreground border-slate-200"
          onClick={() => {
            const event = new KeyboardEvent('keydown', {
              key: 'k',
              metaKey: true,
              bubbles: true,
            });
            document.dispatchEvent(event);
          }}
        >
          <Search className="h-4 w-4" />
          <span className="text-xs">Search</span>
          <kbd className="pointer-events-none ml-2 hidden h-5 select-none items-center gap-1 rounded border border-border bg-secondary px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:flex">
            <span className="text-xs">&#8984;</span>K
          </kbd>
        </Button>

        {/* Branch switcher: hidden on mobile (available in sidebar mobile menu) */}
        <div className="hidden md:block">
          <BranchSwitcher />
        </div>

        {/* Language selector in TopNav */}
        <div className="hidden lg:flex items-center gap-1 bg-slate-100/80 rounded-full px-2 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
          <span className="text-[10px] uppercase text-purple-600 font-extrabold">i18n:</span>
          {(['en', 'es', 'fr'] as const).map((lang) => (
            <button
              key={lang}
              onClick={() => localStorage.setItem('dos_lang', lang)}
              className="px-1.5 py-0.5 rounded text-[11px] uppercase hover:text-purple-600 transition-colors"
            >
              {lang}
            </button>
          ))}
        </div>

        {/* B2B Marketplace Storefront Shortcut */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/store')}
          className="rounded-full bg-slate-900 hover:bg-slate-800 text-white hover:text-white border-0 shadow-sm text-xs font-bold flex items-center gap-1.5 px-3 h-8"
        >
          <span className="text-orange-400 font-extrabold">🛒</span>
          <span className="hidden sm:inline">DOS-SHOP</span> Store ↗
        </Button>

        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px] bg-purple-600">
            3
          </Badge>
        </Button>

        {/* Active role badge */}
        <div className="hidden sm:flex items-center gap-1.5 rounded-full border border-purple-500/20 bg-purple-50 px-2.5 py-1 text-xs font-bold text-purple-700">
          <span className="h-1.5 w-1.5 rounded-full bg-purple-600 animate-pulse" />
          <span className="capitalize">{userRole}</span>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full ring-1 ring-primary/20" aria-label="User menu">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-xs font-semibold bg-primary/20 text-primary">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.user_metadata?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</p>
                <div className="pt-1">
                  <span className="inline-flex items-center rounded-md bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary capitalize">
                    Role: {userRole}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-[11px] font-normal text-muted-foreground">
              Switch Demo Perspective:
            </DropdownMenuLabel>
            <DropdownMenuItem onClick={() => loginDemo('admin')} className="cursor-pointer">
              👑 Admin (Full Access)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => loginDemo('manager')} className="cursor-pointer">
              💼 Manager (CRM & Inventory)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => loginDemo('staff')} className="cursor-pointer">
              📦 Staff (Operations)
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => loginDemo('client')} className="cursor-pointer">
              👤 Client (Orders & Invoices)
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
