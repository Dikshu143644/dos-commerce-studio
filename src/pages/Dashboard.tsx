import { motion } from 'motion/react';
import {
  Package, AlertTriangle, Handshake, DollarSign, ShoppingCart,
  Plus, ArrowRight, TrendingUp, Users, FileText, BarChart3,
  ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Pencil,
  UserPlus, CalendarClock, CreditCard, Truck,
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KPICard } from '@/components/shared/KPICard';
import { Link } from 'react-router-dom';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { format, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { useHotLeads } from '@/hooks/useLeadPipeline';
import { usePipelineValue } from '@/hooks/useDealPipeline';
import { useOverdueFollowUps } from '@/hooks/useFollowUps';
import { useDeals } from '@/hooks/useDeals';

const revenueData = Array.from({ length: 12 }, (_, i) => {
  const date = subMonths(new Date(), 11 - i);
  return {
    month: format(date, 'MMM'),
    revenue: Math.floor(180000 + Math.random() * 120000),
    expenses: Math.floor(100000 + Math.random() * 60000),
  };
});

const categoryData = [
  { name: 'Electronics', value: 38, color: '#10b981' },
  { name: 'Industrial Parts', value: 24, color: '#14b8a6' },
  { name: 'Office Supplies', value: 18, color: '#06d6a0' },
  { name: 'Raw Materials', value: 12, color: '#0d9488' },
  { name: 'Packaging', value: 8, color: '#047857' },
];

const topProducts = [
  { name: 'Circuit Board Pro X1', revenue: 42800 },
  { name: 'Industrial Servo Motor', revenue: 38200 },
  { name: 'Copper Wire 2.5mm', revenue: 31400 },
  { name: 'LED Panel 60W', revenue: 28900 },
  { name: 'Steel Bearings Set', revenue: 25100 },
];

const recentActivity = [
  { type: 'order', message: 'New order SO-000089 from TechVentures Inc.', time: '5 min ago', icon: ShoppingCart },
  { type: 'stock', message: 'Low stock alert: Circuit Board Pro X1 (12 units)', time: '18 min ago', icon: AlertTriangle },
  { type: 'deal', message: 'Deal "Enterprise License" moved to Negotiation', time: '42 min ago', icon: Handshake },
  { type: 'payment', message: 'Payment received from GlobalTech Solutions - $12,450', time: '1 hr ago', icon: DollarSign },
  { type: 'stock', message: 'Stock received: PO-000042 from MicroChip Supplies', time: '2 hrs ago', icon: Package },
];

const dealPipeline = [
  { stage: 'Qualification', count: 18, value: 245000 },
  { stage: 'Needs Analysis', count: 12, value: 380000 },
  { stage: 'Proposal', count: 8, value: 520000 },
  { stage: 'Negotiation', count: 6, value: 680000 },
  { stage: 'Closed Won', count: 4, value: 420000 },
];

const quickActions = [
  { label: 'Add Product', icon: Package, href: '/inventory/products' },
  { label: 'New Sale Order', icon: ShoppingCart, href: '/sales/orders' },
  { label: 'Record Stock', icon: TrendingUp, href: '/inventory/movements' },
  { label: 'New Customer', icon: Users, href: '/crm/customers' },
  { label: 'Create PO', icon: FileText, href: '/procurement/orders' },
  { label: 'Generate Report', icon: BarChart3, href: '/reports/export' },
];

const recentStockMovements = [
  { type: 'in', product: 'Circuit Board Pro X1', quantity: 50, warehouse: 'WH-MUM', time: '5 min ago', image: '/images/products/circuit-board-pro.jpg' },
  { type: 'out', product: 'Industrial Servo Motor', quantity: 12, warehouse: 'WH-DEL', time: '18 min ago', image: '/images/products/servo-motor.jpg' },
  { type: 'transfer', product: 'LED Panel 60W', quantity: 30, warehouse: 'WH-BLR', time: '32 min ago', image: '/images/products/led-panel.jpg' },
  { type: 'adjustment', product: 'Steel Bearings Set', quantity: -3, warehouse: 'WH-MUM', time: '1 hr ago', image: '/images/products/steel-bearings.jpg' },
  { type: 'in', product: 'Copper Wire 2.5mm', quantity: 200, warehouse: 'WH-KOL', time: '1.5 hrs ago', image: '/images/products/copper-wire.jpg' },
  { type: 'out', product: 'Thermal Paste TG-7', quantity: 25, warehouse: 'WH-MUM', time: '2 hrs ago', image: '/images/products/thermal-paste.jpg' },
  { type: 'transfer', product: 'PCB Connector Set', quantity: 100, warehouse: 'WH-DEL', time: '2.5 hrs ago', image: '/images/products/pcb-connector.jpg' },
  { type: 'in', product: 'Aluminum Sheet 3mm', quantity: 80, warehouse: 'WH-BLR', time: '3 hrs ago', image: '/images/products/aluminum-sheet.jpg' },
  { type: 'out', product: 'Circuit Board Pro X1', quantity: 8, warehouse: 'WH-DEL', time: '3.5 hrs ago', image: '/images/products/circuit-board-pro.jpg' },
  { type: 'adjustment', product: 'Resistor Pack 10K', quantity: 15, warehouse: 'WH-MUM', time: '4 hrs ago', image: '/images/products/resistor-pack.jpg' },
];

const movementTypeConfig: Record<string, { icon: typeof ArrowDownLeft; color: string; bg: string }> = {
  in: { icon: ArrowDownLeft, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  out: { icon: ArrowUpRight, color: 'text-red-400', bg: 'bg-red-500/10' },
  transfer: { icon: ArrowLeftRight, color: 'text-blue-400', bg: 'bg-blue-500/10' },
  adjustment: { icon: Pencil, color: 'text-amber-400', bg: 'bg-amber-500/10' },
};

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass rounded-[12px] px-3 py-2 text-xs">
        <p className="text-foreground font-medium">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-muted-foreground">
            {p.dataKey}: ${(p.value / 1000).toFixed(0)}K
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  // CRM hooks for live data
  const { data: hotLeads } = useHotLeads();
  const { data: pipelineValue } = usePipelineValue();
  const { data: overdueFollowUps } = useOverdueFollowUps();
  const { data: dealsData } = useDeals({ pageSize: 100 });

  // Calculate deals closing this week
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const dealsClosingThisWeek = (dealsData?.data ?? []).filter((deal) => {
    if (!deal.expected_close_date) return false;
    const closeDate = new Date(deal.expected_close_date);
    return closeDate >= weekStart && closeDate <= weekEnd;
  });

  return (
    <div className="relative space-y-6">
      {/* Cinematic Mountain Sunset Backdrop bleeding through at 12% opacity (Image 3 Screen 01) */}
      <div className="absolute -inset-6 pointer-events-none z-0 overflow-hidden rounded-[32px]">
        <img
          src="/images/backgrounds/mountain-sunset.jpg"
          alt=""
          className="w-full h-full object-cover opacity-12 filter saturate-150 brightness-75"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=2000&q=85';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/90 via-background/95 to-background" />
      </div>

      <div className="relative z-10 space-y-6">
        {/* Top Header Banner matching Image 3 Screen 01 */}
        <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-[#0F172A]/70 backdrop-blur-xl p-6 md:p-8 shadow-xl">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Good morning, Admin 👋
              </h1>
              <p className="text-sm text-slate-300 font-medium mt-1">
                Here's what's happening with your enterprise business today.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              <Button variant="outline" size="sm" asChild className="rounded-xl border-white/15 bg-white/5 hover:bg-white/10 text-white text-xs">
                <Link to="/reports/export">
                  <BarChart3 className="mr-2 h-4 w-4 text-emerald-400" /> Export Report
                </Link>
              </Button>
              <Button size="sm" asChild className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-lg shadow-emerald-500/25">
                <Link to="/inventory/products">
                  <Plus className="mr-2 h-4 w-4" /> Add Product
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* 4 Main 4K KPI Cards matching Image 3 Screen 01 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
        >
          <KPICard
            label="Total Revenue"
            value="₹24,56,600"
            icon={DollarSign}
            trend={{ value: 18.4, isPositive: true }}
            description="vs last month"
            bgImage="/images/cards/card-revenue-bg.jpg"
            className="rounded-[20px] bg-[#0F172A]/60 backdrop-blur-xl border border-white/10"
          />
          <KPICard
            label="Total Orders"
            value="1,245"
            icon={ShoppingCart}
            trend={{ value: 12.2, isPositive: true }}
            description="vs last month"
            bgImage="/images/cards/card-logistics-bg.jpg"
            className="rounded-[20px] bg-[#0F172A]/60 backdrop-blur-xl border border-white/10"
          />
          <KPICard
            label="Active Customers"
            value="856"
            icon={Users}
            trend={{ value: 8.6, isPositive: true }}
            description="verified accounts"
            bgImage="/images/cards/card-crm-bg.jpg"
            className="rounded-[20px] bg-[#0F172A]/60 backdrop-blur-xl border border-white/10"
          />
          <KPICard
            label="Inventory Valuation"
            value="₹12,45,680"
            icon={Package}
            trend={{ value: 4.8, isPositive: true }}
            description="1,266 products active"
            bgImage="/images/cards/card-products-bg.jpg"
            className="rounded-[20px] bg-[#0F172A]/60 backdrop-blur-xl border border-white/10"
          />
        </motion.div>

      {/* CRM Widgets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <KPICard
          label="Hot Leads"
          value={hotLeads?.length ?? 0}
          icon={UserPlus}
          description="score > 70"
          bgImage="/images/cards/card-crm-bg.jpg"
        />
        <KPICard
          label="Pipeline Value"
          value={`$${((pipelineValue?.weighted_value ?? 0) / 1000).toFixed(0)}K`}
          icon={TrendingUp}
          description="weighted total"
          bgImage="/images/cards/card-pipeline-bg.jpg"
        />
        <KPICard
          label="Overdue Follow-ups"
          value={overdueFollowUps?.length ?? 0}
          icon={CalendarClock}
          description="need attention"
          className={(overdueFollowUps?.length ?? 0) > 5 ? 'border-amber-500/20' : undefined}
          bgImage="/images/cards/card-analytics-bg.jpg"
        />
        <KPICard
          label="Deals Closing This Week"
          value={dealsClosingThisWeek.length}
          icon={Handshake}
          description="this week"
          bgImage="/images/cards/card-crm-bg.jpg"
        />
      </motion.div>

      {/* Sales Widgets */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.07 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <KPICard
          label="Revenue This Month"
          value="$92,400"
          icon={DollarSign}
          trend={{ value: 14, isPositive: true }}
          description="from paid invoices"
          bgImage="/images/cards/card-finance-bg.jpg"
        />
        <KPICard
          label="Outstanding Payments"
          value="$34,200"
          icon={CreditCard}
          description="needs collection"
          className="border-amber-500/20"
          bgImage="/images/cards/card-revenue-bg.jpg"
        />
        <KPICard
          label="Orders to Ship"
          value="8"
          icon={Truck}
          description="processing status"
          bgImage="/images/cards/card-logistics-bg.jpg"
        />
        <KPICard
          label="Monthly Trend"
          value="+18%"
          icon={TrendingUp}
          trend={{ value: 18, isPositive: true }}
          description="vs last month"
          bgImage="/images/cards/card-analytics-bg.jpg"
        />
      </motion.div>

      {/* Revenue Chart + Stock Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Revenue Overview</span>
              <span className="text-sm font-normal text-muted-foreground">Last 12 months</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `$${v / 1000}K`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    dataKey="value"
                    stroke="none"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="glass rounded-[12px] px-3 py-2 text-xs">
                          <p className="text-foreground">{payload[0].name}: {payload[0].value}%</p>
                        </div>
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-2">
              {categoryData.map((cat) => (
                <div key={cat.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ background: cat.color }} />
                    <span className="text-muted-foreground">{cat.name}</span>
                  </div>
                  <span className="text-foreground font-medium">{cat.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Activity + Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.map((activity, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <activity.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{activity.message}</p>
                    <p className="text-xs text-muted-foreground">{activity.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="outline"
                  className="h-auto flex-col gap-2 py-4 text-xs"
                >
                  <action.icon className="h-5 w-5 text-primary" />
                  {action.label}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Recent Stock Movements Feed */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Recent Stock Movements</span>
              <Button variant="ghost" size="sm" className="text-xs">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentStockMovements.map((movement, index) => {
                const config = movementTypeConfig[movement.type];
                const MovementIcon = config.icon;
                return (
                  <div key={index} className="flex items-center justify-between rounded-[14px] bg-secondary/25 border border-border/40 p-3 hover:border-emerald-500/30 transition-all group">
                    <div className="flex items-center gap-3">
                      {/* Product Photo Avatar */}
                      <div className="relative h-11 w-11 rounded-[10px] overflow-hidden border border-border/50 bg-black/40 flex-shrink-0">
                        {movement.image ? (
                          <img
                            src={movement.image}
                            alt={movement.product}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className={`flex h-full w-full items-center justify-center ${config.bg}`}>
                            <MovementIcon className={`h-4 w-4 ${config.color}`} />
                          </div>
                        )}
                        <div className={`absolute bottom-0.5 right-0.5 h-3.5 w-3.5 rounded-full flex items-center justify-center ${config.bg} border border-background shadow-xs`}>
                          <MovementIcon className={`h-2.5 w-2.5 ${config.color}`} />
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground group-hover:text-emerald-400 transition-colors">{movement.product}</p>
                        <p className="text-xs text-muted-foreground">
                          {movement.type === 'in' ? '+' : movement.type === 'out' ? '-' : ''}{Math.abs(movement.quantity)} units &middot; <span className="font-mono text-emerald-400/90">{movement.warehouse}</span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                        movement.type === 'in' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                        movement.type === 'out' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                        movement.type === 'transfer' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' :
                        'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}>
                        {movement.type}
                      </span>
                      <p className="text-[11px] text-muted-foreground mt-1">{movement.time}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Top Products + Pipeline Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.3 }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-2"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Top Selling Products</span>
              <Button variant="ghost" size="sm" className="text-xs">
                View all <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" stroke="#71717a" fontSize={12} tickFormatter={(v) => `$${v / 1000}K`} />
                  <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={11} width={140} />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="glass rounded-[12px] px-3 py-2 text-xs">
                          <p className="text-foreground">${payload[0].value?.toLocaleString()}</p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Deals Pipeline</span>
              <Button variant="ghost" size="sm" className="text-xs">
                <Plus className="mr-1 h-3 w-3" /> New Deal
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {dealPipeline.map((stage) => (
                <div key={stage.stage} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{stage.stage}</span>
                    <span className="text-foreground font-medium">
                      {stage.count} deals &middot; ${(stage.value / 1000).toFixed(0)}K
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(stage.value / 680000) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-muted-foreground">Total Pipeline Value</span>
                <span className="font-bold text-primary">$2,245,000</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
      </div>
    </div>
  );
}
