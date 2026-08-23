import { useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  Package,
  ShoppingCart,
  XCircle,
  Bell,
  DollarSign,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { KPICard } from '@/components/shared/KPICard';
import { EmptyState } from '@/components/shared/EmptyState';
import { useDismissAlert } from '@/hooks/useLowStock';

// Mock low stock products
const mockLowStockProducts = [
  {
    id: '1',
    product_name: 'Industrial Servo Motor',
    sku: 'ISM-200',
    current_stock: 3,
    reorder_point: 10,
    min_stock_level: 5,
    max_stock_level: 50,
    unit_cost: 8500,
    warehouse: 'WH-DEL',
  },
  {
    id: '2',
    product_name: 'Hydraulic Pump HP-200',
    sku: 'HP-200',
    current_stock: 0,
    reorder_point: 5,
    min_stock_level: 2,
    max_stock_level: 20,
    unit_cost: 15000,
    warehouse: 'WH-BLR',
  },
  {
    id: '3',
    product_name: 'Steel Bearings Set',
    sku: 'SBS-100',
    current_stock: 4,
    reorder_point: 15,
    min_stock_level: 8,
    max_stock_level: 60,
    unit_cost: 1200,
    warehouse: 'WH-KOL',
  },
  {
    id: '4',
    product_name: 'Circuit Board Pro X1',
    sku: 'CB-X1',
    current_stock: 8,
    reorder_point: 20,
    min_stock_level: 10,
    max_stock_level: 100,
    unit_cost: 1200,
    warehouse: 'WH-MUM',
  },
  {
    id: '5',
    product_name: 'Copper Wire 2.5mm',
    sku: 'CW-2.5',
    current_stock: 12,
    reorder_point: 50,
    min_stock_level: 25,
    max_stock_level: 200,
    unit_cost: 450,
    warehouse: 'WH-AHM',
  },
  {
    id: '6',
    product_name: 'Office Chair Ergonomic',
    sku: 'OCE-100',
    current_stock: 0,
    reorder_point: 8,
    min_stock_level: 3,
    max_stock_level: 30,
    unit_cost: 12000,
    warehouse: 'WH-DEL',
  },
  {
    id: '7',
    product_name: 'Wireless Mouse BT500',
    sku: 'WM-BT500',
    current_stock: 2,
    reorder_point: 20,
    min_stock_level: 10,
    max_stock_level: 80,
    unit_cost: 650,
    warehouse: 'WH-MUM',
  },
  {
    id: '8',
    product_name: 'LED Panel 60W',
    sku: 'LED-60W',
    current_stock: 6,
    reorder_point: 15,
    min_stock_level: 8,
    max_stock_level: 50,
    unit_cost: 2400,
    warehouse: 'WH-BLR',
  },
];

type Severity = 'all' | 'critical' | 'warning' | 'out_of_stock';

function getSeverity(item: typeof mockLowStockProducts[0]): 'critical' | 'warning' | 'out_of_stock' {
  if (item.current_stock === 0) return 'out_of_stock';
  if (item.current_stock <= item.min_stock_level) return 'critical';
  return 'warning';
}

function getSeverityColor(severity: 'critical' | 'warning' | 'out_of_stock') {
  switch (severity) {
    case 'out_of_stock':
      return 'text-red-400';
    case 'critical':
      return 'text-red-400';
    case 'warning':
      return 'text-amber-400';
  }
}

function getSeverityBadge(severity: 'critical' | 'warning' | 'out_of_stock') {
  switch (severity) {
    case 'out_of_stock':
      return { color: 'bg-red-500/20 text-red-400', label: 'Out of Stock' };
    case 'critical':
      return { color: 'bg-red-500/20 text-red-400', label: 'Critical' };
    case 'warning':
      return { color: 'bg-amber-500/20 text-amber-400', label: 'Warning' };
  }
}

export default function LowStockPage() {
  const [severityFilter, setSeverityFilter] = useState<Severity>('all');
  const [isLoading] = useState(false);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const dismissAlert = useDismissAlert();

  const allProducts = mockLowStockProducts.filter((p) => !dismissed.has(p.id));
  const filteredProducts = allProducts.filter((p) => {
    if (severityFilter === 'all') return true;
    return getSeverity(p) === severityFilter;
  });

  // Summary stats
  const totalAlerts = allProducts.length;
  const criticalCount = allProducts.filter((p) => getSeverity(p) === 'critical').length;
  const outOfStockCount = allProducts.filter((p) => p.current_stock === 0).length;
  const totalReorderValue = allProducts.reduce((sum, p) => {
    const suggestedQty = p.reorder_point - p.current_stock;
    return sum + suggestedQty * p.unit_cost;
  }, 0);

  const handleDismiss = (productId: string) => {
    setDismissed((prev) => new Set([...prev, productId]));
    dismissAlert.mutate(productId, {
      onSuccess: () => {
        toast.success('Alert dismissed');
      },
      onError: () => {
        toast.error('Failed to dismiss alert');
      },
    });
  };

  const handleCreatePO = (productName: string) => {
    toast.success(`Redirecting to create PO for ${productName}`);
    // In a real app this would navigate to /procurement/orders with pre-filled data
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-72" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-[24px]" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-[24px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Low Stock Alerts"
        description="Monitor products below reorder point and take action"
      />

      {/* KPI Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Alerts"
          value={totalAlerts}
          icon={Bell}
          description="products below reorder"
        />
        <KPICard
          label="Critical"
          value={criticalCount}
          icon={AlertTriangle}
          description="below minimum level"
        />
        <KPICard
          label="Out of Stock"
          value={outOfStockCount}
          icon={Package}
          description="zero quantity"
        />
        <KPICard
          label="Reorder Value"
          value={`₹${(totalReorderValue / 1000).toFixed(0)}K`}
          icon={DollarSign}
          description="estimated cost"
        />
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={severityFilter} onValueChange={(v) => setSeverityFilter(v as Severity)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Alerts</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="warning">Warning</SelectItem>
            <SelectItem value="out_of_stock">Out of Stock</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Product Cards Grid */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No low stock alerts"
          description="All products are above their reorder points. Your inventory levels are healthy."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product, idx) => {
            const severity = getSeverity(product);
            const badge = getSeverityBadge(severity);
            const stockPct = Math.min(
              100,
              Math.round((product.current_stock / product.max_stock_level) * 100)
            );

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: idx * 0.05 }}
              >
                <Card className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] rounded-[24px] hover:border-primary/30 transition-colors">
                  <CardContent className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-foreground text-sm leading-tight">
                          {product.product_name}
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{product.sku}</p>
                      </div>
                      <Badge className={`${badge.color} border-0 text-xs`}>{badge.label}</Badge>
                    </div>

                    {/* Stock Level */}
                    <div className="text-center py-2">
                      <p className={`text-3xl font-bold ${getSeverityColor(severity)}`}>
                        {product.current_stock}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">current stock</p>
                    </div>

                    {/* Progress */}
                    <div className="space-y-1.5">
                      <Progress value={stockPct} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>0</span>
                        <span>{product.max_stock_level}</span>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-[8px] bg-secondary/50 p-2">
                        <p className="text-muted-foreground">Reorder Point</p>
                        <p className="font-medium text-foreground">{product.reorder_point}</p>
                      </div>
                      <div className="rounded-[8px] bg-secondary/50 p-2">
                        <p className="text-muted-foreground">Min Stock</p>
                        <p className="font-medium text-foreground">{product.min_stock_level}</p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 gap-1.5"
                        onClick={() => handleCreatePO(product.product_name)}
                      >
                        <ShoppingCart className="h-3.5 w-3.5" />
                        Create PO
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5"
                        onClick={() => handleDismiss(product.id)}
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Dismiss
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
