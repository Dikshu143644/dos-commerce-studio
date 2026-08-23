import { Building2, Check, ChevronsUpDown, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { useBranchContext } from '@/contexts/BranchContext';
import { useActiveBranches } from '@/hooks/useBranches';

export function BranchSwitcher() {
  const { activeBranchId, activeBranch, branches, setBranch, isAllBranches } = useBranchContext();

  // Load active branches for the switcher
  useActiveBranches();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="hidden sm:flex gap-2 text-muted-foreground border-border/50 bg-background/40 backdrop-blur-sm hover:bg-secondary/50 max-w-[200px]"
        >
          <Building2 className="h-4 w-4 shrink-0 text-primary" />
          <span className="truncate text-xs">
            {isAllBranches ? 'All Branches' : activeBranch?.name ?? 'Select Branch'}
          </span>
          {!isAllBranches && activeBranch && (
            <Badge
              variant="secondary"
              className="h-4 px-1 text-[9px] bg-primary/15 text-primary border-0"
            >
              Active
            </Badge>
          )}
          <ChevronsUpDown className="h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-64 bg-background/95 backdrop-blur-xl border-border/50"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Switch Branch
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="flex items-center gap-3 py-2.5 cursor-pointer"
          onClick={() => setBranch(null)}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-secondary">
            <Globe className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">All Branches</p>
            <p className="text-xs text-muted-foreground">View data across all locations</p>
          </div>
          {isAllBranches && <Check className="h-4 w-4 text-primary shrink-0" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {branches.length === 0 ? (
          <div className="px-3 py-4 text-center">
            <p className="text-xs text-muted-foreground">No branches available</p>
          </div>
        ) : (
          branches.map((branch) => (
            <DropdownMenuItem
              key={branch.id}
              className="flex items-center gap-3 py-2.5 cursor-pointer"
              onClick={() => setBranch(branch.id)}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-[8px] bg-primary/10">
                <Building2 className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{branch.name}</p>
                {branch.city && (
                  <p className="text-xs text-muted-foreground truncate">{branch.city}</p>
                )}
              </div>
              {activeBranchId === branch.id && (
                <Check className="h-4 w-4 text-primary shrink-0" />
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
