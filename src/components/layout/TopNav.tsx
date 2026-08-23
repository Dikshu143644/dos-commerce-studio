import { useState } from 'react';
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
  const { user, logout } = useAuth();
  const isMobile = useMediaQuery('(max-width: 767px)');
  const [searchOpen, setSearchOpen] = useState(false);

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .toUpperCase()
    : 'U';

  // Full-screen search overlay for mobile
  if (isMobile && searchOpen) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col bg-background/95 backdrop-blur-md p-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSearchOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
          <input
            autoFocus
            type="text"
            placeholder="Search..."
            className="flex-1 h-10 rounded-lg border border-border bg-secondary/50 px-4 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
            onKeyDown={(e) => {
              if (e.key === 'Escape') setSearchOpen(false);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center gap-4 border-b border-border bg-background/60 backdrop-blur-md px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={() => setMobileOpen(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      {/* Mobile: show app title */}
      <span className="md:hidden text-sm font-semibold text-foreground truncate">
        StockFlow
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
        >
          <Search className="h-5 w-5 text-muted-foreground" />
        </Button>

        {/* Desktop: inline search button */}
        <Button
          variant="outline"
          size="sm"
          className="hidden md:flex gap-2 text-muted-foreground"
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

        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <Badge className="absolute -top-0.5 -right-0.5 h-4 w-4 p-0 flex items-center justify-center text-[10px]">
            3
          </Badge>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.user_metadata?.avatar_url} />
                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium">{user?.user_metadata?.full_name || 'User'}</p>
                <p className="text-xs text-muted-foreground">{user?.email || 'user@example.com'}</p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Profile</DropdownMenuItem>
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => logout()}>Log out</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
