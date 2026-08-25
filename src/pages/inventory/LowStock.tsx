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
import { Card } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';

// Mock low stock products matching Screenshot 1
const mockLowStockProducts = [
  {
    id: '1',
    product_name: 'Industrial Servo Motor',
    sku: 'ISM-200',
    current_stock: 0,
    reorder_point: 10,
    min_stock_level: 5,
    max_stock_level: 50,
    unit_cost: 8500,
    warehouse: 'WH-DEL',
    image: '/images/products/servo-motor.jpg',
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
    image: '/images/products/hydraulic-pump.jpg',
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
    image: '/images/products/steel-bearings.jpg',
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
    image: '/images/products/circuit-board-pro.jpg',
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
    image: '/images/products/copper-wire.jpg',
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
    image: '/images/products/office-chair.jpg',
  },
  {
    id: '7',
    product_name: 'Wireless Mouse BT500',
    sku: 'WM-BT500',
    current_stock: 6,
    reorder_point: 25,
    min_stock_level: 10,
    max_stock_level: 150,
    unit_cost: 850,
    warehouse: 'WH-MUM',
    image: '/images/products/wireless-mouse.jpg',
  },
  {
    id: '8',
    product_name: 'Packaging Tape 48mm',
    sku: 'PT-48',
    current_stock: 15,
    reorder_point: 60,
    min_stock_level: 30,
    max_stock_level: 500,
    unit_cost: 120,
    warehouse: 'WH-BLR',
    image: '/images/products/packaging-tape.jpg',
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

      {/* Product Cards Grid - Spatial Bento Grid */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No low stock alerts"
          description="All products are above their reorder points. Your inventory levels are healthy."
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {filteredProducts.map((product, idx) => {
            const severity = getSeverity(product);
            const badge = getSeverityBadge(severity);
            const stockPct = Math.min(
              100,
              Math.round((product.current_stock / product.max_stock_level) * 100)
            );
            const reorderUnits = Math.max(0, product.reorder_point * 2 - product.current_stock);
            const estimatedValue = reorderUnits * product.unit_cost;

            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.04 }}
              >
                <Card className={cn(
                  "relative overflow-hidden rounded-[24px] border glass transition-all duration-300 group hover:shadow-xl",
                  severity === 'out_of_stock' ? "border-red-500/30 hover:border-red-500/60" :
                  severity === 'critical' ? "border-amber-500/30 hover:border-amber-500/60" :
                  "border-emerald-500/30 hover:border-emerald-500/60"
                )}>
                  {/* Subtle Background Glow Vignette */}
                  <div className={cn(
                    "absolute -right-16 -top-16 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20",
                    severity === 'out_of_stock' ? "bg-red-500" :
                    severity === 'critical' ? "bg-amber-500" : "bg-emerald-500"
                  )} />

                  <div className="flex flex-col sm:flex-row items-stretch gap-5 p-5 relative z-10">
                    {/* Left: Full High-Clarity Square Product Photo */}
                    <div className="relative w-full sm:w-44 h-48 sm:h-auto rounded-[18px] overflow-hidden bg-black/60 border border-border/50 flex-shrink-0">
                      {product.image && (
                        <img
                          src={product.image}
                          alt={product.product_name}
                          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500"
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent sm:hidden" />
                      
                      {/* Warehouse Badge */}
                      <div className="absolute bottom-2.5 left-2.5 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/10 flex items-center gap-1.5 shadow-md">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        <span className="text-[11px] font-mono font-medium text-white">{product.warehouse}</span>
                      </div>
                    </div>

                    {/* Right: Technical Information & Actions */}
                    <div className="flex-1 flex flex-col justify-between space-y-3">
                      <div>
                        {/* Title & Severity Badge */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-base text-foreground group-hover:text-emerald-400 transition-colors leading-tight">
                              {product.product_name}
                            </h3>
                            <p className="text-xs font-mono text-muted-foreground mt-0.5">{product.sku}</p>
                          </div>
                          <Badge className={cn("text-xs font-semibold px-2.5 py-0.5 shadow-sm border-0", badge.color)}>
                            {badge.label}
                          </Badge>
                        </div>

                        {/* Telemetry Metrics Bento Row */}
                        <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                          <div className="bg-secondary/40 border border-border/50 rounded-[12px] p-2.5">
                            <p className="text-[11px] text-muted-foreground">Current</p>
                            <p className={cn("text-xl font-extrabold tracking-tight", getSeverityColor(severity))}>
                              {product.current_stock}
                            </p>
                          </div>
                          <div className="bg-secondary/40 border border-border/50 rounded-[12px] p-2.5">
                            <p className="text-[11px] text-muted-foreground">Reorder At</p>
                            <p className="text-xl font-bold text-foreground">
                              {product.reorder_point}
                            </p>
                          </div>
                          <div className="bg-secondary/40 border border-border/50 rounded-[12px] p-2.5">
                            <p className="text-[11px] text-muted-foreground">Reorder Val</p>
                            <p className="text-sm font-bold text-emerald-400 mt-1">
                              ₹{(estimatedValue / 1000).toFixed(0)}K
                            </p>
                          </div>
                        </div>

                        {/* Stock Capacity Progress Meter */}
                        <div className="space-y-1 mt-3">
                          <div className="flex justify-between text-[11px] text-muted-foreground">
                            <span>Stock Buffer: {stockPct}%</span>
                            <span>Max: {product.max_stock_level} units</span>
                          </div>
                          <Progress value={stockPct} className="h-1.5 bg-secondary" />
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-1">
                        <Button
                          size="sm"
                          className="flex-1 gap-1.5 bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-md shadow-emerald-500/20"
                          onClick={() => handleCreatePO(product.product_name)}
                        >
                          <ShoppingCart className="h-3.5 w-3.5" />
                          Create Purchase Order
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                          onClick={() => handleDismiss(product.id)}
                        >
                          <XCircle className="h-3.5 w-3.5" />
                          Dismiss
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
