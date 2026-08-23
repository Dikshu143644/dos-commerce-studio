import { useState, useMemo } from 'react';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { SearchInput } from './SearchInput';
import { useMediaQuery } from '@/hooks/useMediaQuery';

interface Column<T> {
  key: string;
  title: string;
  sortable?: boolean;
  render?: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  searchable?: boolean;
  searchPlaceholder?: string;
  selectable?: boolean;
  pageSize?: number;
  onRowClick?: (row: T) => void;
  getRowId?: (row: T) => string;
}

export function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  searchable = true,
  searchPlaceholder = 'Search...',
  selectable = false,
  pageSize = 10,
  onRowClick,
  getRowId = (row) => String(row.id || ''),
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const isMobile = useMediaQuery('(max-width: 767px)');
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1023px)');

  const filteredData = useMemo(() => {
    if (!search) return data;
    const lower = search.toLowerCase();
    return data.filter((row) =>
      Object.values(row).some(
        (val) => val != null && String(val).toLowerCase().includes(lower)
      )
    );
  }, [data, search]);

  const sortedData = useMemo(() => {
    if (!sortKey) return filteredData;
    return [...filteredData].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortKey, sortDir]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice(page * pageSize, (page + 1) * pageSize);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const toggleAll = () => {
    if (selected.size === paginatedData.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(paginatedData.map(getRowId)));
    }
  };

  const toggleRow = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelected(next);
  };

  // Mobile card view
  const renderCardView = () => (
    <div className="space-y-3">
      {paginatedData.length === 0 ? (
        <div className="rounded-[16px] border border-border p-8 text-center text-muted-foreground">
          No results found
        </div>
      ) : (
        paginatedData.map((row) => {
          const id = getRowId(row);
          return (
            <div
              key={id}
              className={cn(
                'rounded-[16px] border border-border p-4 space-y-2 transition-colors',
                'bg-card/50 hover:bg-secondary/30',
                onRowClick && 'cursor-pointer'
              )}
              onClick={() => onRowClick?.(row)}
            >
              {selectable && (
                <div className="flex items-center gap-2 pb-2 border-b border-border" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={selected.has(id)}
                    onCheckedChange={() => toggleRow(id)}
                  />
                  <span className="text-xs text-muted-foreground">Select</span>
                </div>
              )}
              {columns.map((col) => (
                <div key={col.key} className="flex items-start justify-between gap-2">
                  <span className="text-xs text-muted-foreground font-medium shrink-0">
                    {col.title}
                  </span>
                  <span className="text-sm text-foreground text-right">
                    {col.render ? col.render(row) : String(row[col.key] ?? '')}
                  </span>
                </div>
              ))}
            </div>
          );
        })
      )}
    </div>
  );

  // Desktop/Tablet table view
  const renderTableView = () => (
    <div className="rounded-[16px] border border-border overflow-hidden">
      <div className={cn('overflow-x-auto', isTablet && '[&_td:first-child]:sticky [&_td:first-child]:left-0 [&_td:first-child]:z-10 [&_td:first-child]:bg-background [&_th:first-child]:sticky [&_th:first-child]:left-0 [&_th:first-child]:z-10 [&_th:first-child]:bg-secondary/80')}>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-secondary/50">
              {selectable && (
                <th className="w-12 px-4 py-3">
                  <Checkbox
                    checked={paginatedData.length > 0 && selected.size === paginatedData.length}
                    onCheckedChange={toggleAll}
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left font-medium text-muted-foreground whitespace-nowrap',
                    col.sortable && 'cursor-pointer select-none hover:text-foreground',
                    col.className
                  )}
                  onClick={() => col.sortable && handleSort(col.key)}
                >
                  <div className="flex items-center gap-1">
                    {col.title}
                    {col.sortable && sortKey === col.key && (
                      sortDir === 'asc' ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                      ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                      )
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No results found
                </td>
              </tr>
            ) : (
              paginatedData.map((row) => {
                const id = getRowId(row);
                return (
                  <tr
                    key={id}
                    className={cn(
                      'border-b border-border last:border-0 transition-colors hover:bg-secondary/30',
                      onRowClick && 'cursor-pointer'
                    )}
                    onClick={() => onRowClick?.(row)}
                  >
                    {selectable && (
                      <td className="w-12 px-4 py-3" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.has(id)}
                          onCheckedChange={() => toggleRow(id)}
                        />
                      </td>
                    )}
                    {columns.map((col) => (
                      <td key={col.key} className={cn('px-4 py-3 text-foreground', col.className)}>
                        {col.render
                          ? col.render(row)
                          : String(row[col.key] ?? '')}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      {searchable && (
        <SearchInput
          placeholder={searchPlaceholder}
          onSearch={setSearch}
          className="max-w-sm"
        />
      )}

      {isMobile ? renderCardView() : renderTableView()}

      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {page * pageSize + 1} to {Math.min((page + 1) * pageSize, sortedData.length)} of{' '}
            {sortedData.length} results
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
