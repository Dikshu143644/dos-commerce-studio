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
import { useAuth } from '@/hooks/useAuth';
import ClientDashboard from '@/pages/portal/ClientDashboard';

const revenueData = Array.from({ length: 12 }, (_, i) => {
  const date = subMonths(new Date(), 11 - i);
  return {
    month: format(date, 'MMM'),
    revenue: Math.floor(1800000 + Math.random() * 1200000),
    expenses: Math.floor(1000000 + Math.random() * 600000),
  };
});

const categoryData = [
  { name: 'Electronics', value: 38, color: '#7c3aed' },
  { name: 'Industrial Parts', value: 24, color: '#f97316' },
  { name: 'Office Supplies', value: 18, color: '#3b82f6' },
  { name: 'Raw Materials', value: 12, color: '#10b981' },
  { name: 'Packaging', value: 8, color: '#ec4899' },
];

const topProducts = [
  { name: 'Circuit Board Pro X1', revenue: 3428000 },
  { name: 'Industrial Servo Motor', revenue: 3056000 },
  { name: 'Copper Wire 2.5mm', revenue: 2512000 },
  { name: 'LED Panel 60W', revenue: 2312000 },
  { name: 'Steel Bearings Set', revenue: 2008000 },
];

const recentActivity = [
  { type: 'order', message: 'New order SO-000089 from TechVentures Inc.', time: '5 min ago', icon: ShoppingCart },
  { type: 'stock', message: 'Low stock alert: Circuit Board Pro X1 (12 units)', time: '18 min ago', icon: AlertTriangle },
  { type: 'deal', message: 'Deal "Enterprise License" moved to Negotiation', time: '42 min ago', icon: Handshake },
  { type: 'payment', message: 'Payment received from GlobalTech Solutions - ₹9,96,000', time: '1 hr ago', icon: DollarSign },
  { type: 'stock', message: 'Stock received: PO-000042 from MicroChip Supplies', time: '2 hrs ago', icon: Package },
];

const dealPipeline = [
  { stage: 'Qualification', count: 18, value: 19600000 },
  { stage: 'Needs Analysis', count: 12, value: 30400000 },
  { stage: 'Proposal', count: 8, value: 41600000 },
  { stage: 'Negotiation', count: 6, value: 54400000 },
  { stage: 'Closed Won', count: 4, value: 33600000 },
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
      <div className="bg-white/95 backdrop-blur-md rounded-xl border border-slate-200 shadow-lg px-3 py-2 text-xs">
        <p className="text-slate-900 font-bold">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-slate-600 font-medium">
            {p.dataKey}: ₹{(p.value / 100000).toFixed(1)}L
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  useDocumentTitle('Dashboard');
  const { userRole } = useAuth();

  // CRM hooks for live data (called unconditionally before any early returns)
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

  // If a client logs in, immediately render the Client Portal Dashboard
  if (userRole === 'client') {
    return <ClientDashboard />;
  }

  return (
    <div className="space-y-6">
      {/* Top Header Banner in White/Orange landing style */}
      <div className="relative overflow-hidden rounded-[24px] border border-slate-200/90 bg-white p-6 md:p-8 shadow-xs">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              Good morning, Admin 👋
            </h1>
            <p className="text-sm text-slate-600 font-medium mt-1">
              Here's what's happening with your enterprise inventory and CRM today.
            </p>
          </div>
          <div className="flex items-center gap-2 mt-4 sm:mt-0">
            <Button variant="outline" size="sm" asChild className="rounded-xl border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold">
              <Link to="/reports/export">
                <BarChart3 className="mr-2 h-4 w-4 text-orange-500" /> Export Report
              </Link>
            </Button>
            <Button size="sm" asChild className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-xs font-bold shadow-md shadow-orange-500/20">
              <Link to="/inventory/products">
                <Plus className="mr-2 h-4 w-4" /> Add Product
              </Link>
            </Button>
          </div>
        </div>
      </div>

      {/* 4 Main KPI Cards in White/Orange style */}
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
        />
        <KPICard
          label="Total Orders"
          value="1,245"
          icon={ShoppingCart}
          trend={{ value: 12.2, isPositive: true }}
          description="vs last month"
          bgImage="/images/cards/card-logistics-bg.jpg"
        />
        <KPICard
          label="Active Customers"
          value="856"
          icon={Users}
          trend={{ value: 8.6, isPositive: true }}
          description="verified accounts"
          bgImage="/images/cards/card-crm-bg.jpg"
        />
        <KPICard
          label="Inventory Valuation"
          value="₹12,45,680"
          icon={Package}
          trend={{ value: 4.8, isPositive: true }}
          description="1,266 products active"
          bgImage="/images/cards/card-products-bg.jpg"
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
          value={`₹${(((pipelineValue?.weighted_value ?? 143000) * 80) / 100000).toFixed(1)}L`}
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
          value="₹73,92,000"
          icon={DollarSign}
          trend={{ value: 14, isPositive: true }}
          description="from paid invoices"
          bgImage="/images/cards/card-finance-bg.jpg"
        />
        <KPICard
          label="Outstanding Payments"
          value="₹27,36,000"
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
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
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
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
                  <XAxis type="number" stroke="#71717a" fontSize={12} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                  <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={11} width={140} />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="bg-white rounded-xl border border-slate-200 shadow-md px-3 py-2 text-xs">
                          <p className="text-slate-900 font-bold">₹{payload[0].value?.toLocaleString('en-IN')}</p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="revenue" fill="#7c3aed" radius={[0, 4, 4, 0]} />
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
                      {stage.count} deals &middot; ₹{(stage.value / 100000).toFixed(1)}L
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-secondary">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${(stage.value / 54400000) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
              <div className="mt-4 flex items-center justify-between border-t border-border pt-3 text-sm">
                <span className="text-muted-foreground">Total Pipeline Value</span>
                <span className="font-bold text-primary">₹1,79,60,000</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Multi-Warehouse Facilities Visual Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="text-orange-500">🏬</span> Multi-Warehouse Facility Telemetry
            </h2>
            <p className="text-xs text-slate-500">Live operational capacity and stock distribution across all 6 strategic hubs</p>
          </div>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-slate-200 text-xs font-bold text-orange-600 hover:bg-orange-50">
            <Link to="/inventory/warehouses">
              Manage All Hubs <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[
            { code: 'WH-MUM', name: 'Mumbai Central Logistics Hub', city: 'Mumbai, MH', capacity: 84, items: 480, img: '/images/warehouses/warehouse-mumbai.jpg', status: 'Operational' },
            { code: 'WH-DEL', name: 'Delhi NCR Regional Depot', city: 'Delhi NCR', capacity: 68, items: 320, img: '/images/warehouses/warehouse-delhi.jpg', status: 'Operational' },
            { code: 'WH-BLR', name: 'Bangalore Tech Hub', city: 'Bangalore, KA', capacity: 92, items: 290, img: '/images/warehouses/warehouse-bangalore.jpg', status: 'High Capacity' },
            { code: 'WH-KOL', name: 'Kolkata Eastern Port Hub', city: 'Kolkata, WB', capacity: 45, items: 160, img: '/images/warehouses/warehouse-kolkata.jpg', status: 'Operational' },
            { code: 'WH-PUN', name: 'Pune Industrial Park', city: 'Pune, MH', capacity: 76, items: 210, img: '/images/warehouses/warehouse-pune.jpg', status: 'Operational' },
            { code: 'WH-AMD', name: 'Ahmedabad Commercial Center', city: 'Ahmedabad, GJ', capacity: 58, items: 145, img: '/images/warehouses/warehouse-ahmedabad.jpg', status: 'Operational' },
          ].map((wh) => (
            <div key={wh.code} className="group relative overflow-hidden rounded-[22px] bg-white border border-slate-200 shadow-xs hover:border-orange-400 hover:shadow-lg transition-all">
              {/* Photo Banner with Overlay */}
              <div className="relative h-32 w-full overflow-hidden bg-slate-900">
                <img
                  src={wh.img}
                  alt={wh.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 filter brightness-95"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                <div className="absolute top-3 left-3">
                  <span className="px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-black text-slate-900 shadow-xs">
                    {wh.code}
                  </span>
                </div>
                <div className="absolute top-3 right-3">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-md text-white ${
                    wh.capacity > 90 ? 'bg-amber-500/80' : 'bg-emerald-500/80'
                  }`}>
                    {wh.status}
                  </span>
                </div>
                <div className="absolute bottom-2.5 left-3 right-3">
                  <h3 className="text-sm font-bold text-white truncate">{wh.name}</h3>
                  <p className="text-[11px] text-slate-300">{wh.city}</p>
                </div>
              </div>

              {/* Telemetry Metrics */}
              <div className="p-4 space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-500 font-medium">Capacity Utilization</span>
                  <span className="font-bold text-slate-900">{wh.capacity}%</span>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      wh.capacity > 90 ? 'bg-amber-500' : 'bg-gradient-to-r from-amber-500 to-orange-500'
                    }`}
                    style={{ width: `${wh.capacity}%` }}
                  />
                </div>
                <div className="flex justify-between items-center text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>Tracked SKUs: <strong className="text-slate-800">{wh.items} items</strong></span>
                  <Link to="/inventory/movements" className="text-orange-600 font-bold hover:underline">
                    View Stock →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Fast-Moving High-Demand Hardware Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <span className="text-orange-500">⚡</span> High-Demand Hardware & Fast-Moving SKUs
            </h2>
            <p className="text-xs text-slate-500">Top-velocity inventory units actively moving across distribution networks</p>
          </div>
          <Button variant="outline" size="sm" asChild className="rounded-xl border-slate-200 text-xs font-bold text-orange-600 hover:bg-orange-50">
            <Link to="/inventory/products">
              Explore Full Catalog <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Link>
          </Button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          {[
            { sku: 'PCB-PRO-001', name: 'Circuit Board Pro X1', price: '₹10,250', stock: 142, img: '/images/products/circuit-board-pro.jpg', status: 'In Stock' },
            { sku: 'SRV-750W-002', name: 'AC Servo Motor ISM-200', price: '₹28,400', stock: 38, img: '/images/products/servo-motor.jpg', status: 'Healthy' },
            { sku: 'HYD-PMP-200', name: 'Hydraulic Pump HP-200', price: '₹45,000', stock: 24, img: '/images/products/hydraulic-pump.jpg', status: 'Healthy' },
            { sku: 'LED-PAN-60W', name: 'Ultra-Bright LED Panel 60W', price: '₹5,400', stock: 95, img: '/images/products/led-panel.jpg', status: 'In Stock' },
            { sku: 'WIR-COP-250', name: 'Copper Wire 2.5mm Reel', price: '₹7,200', stock: 280, img: '/images/products/copper-wire.jpg', status: 'In Stock' },
            { sku: 'BRG-STL-800', name: 'Precision Steel Bearings', price: '₹3,700', stock: 18, img: '/images/products/steel-bearings.jpg', status: 'Low Stock' },
          ].map((prod) => (
            <div key={prod.sku} className="group rounded-[20px] bg-white border border-slate-200/90 p-3 shadow-xs hover:border-orange-400 hover:shadow-md transition-all flex flex-col justify-between">
              <div className="space-y-2">
                <div className="relative aspect-square w-full rounded-[14px] overflow-hidden bg-slate-100 border border-slate-100">
                  <img
                    src={prod.img}
                    alt={prod.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-1.5 right-1.5">
                    <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold ${
                      prod.status === 'Low Stock' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
                    }`}>
                      {prod.status}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-mono text-slate-400 font-bold uppercase">{prod.sku}</p>
                  <h4 className="text-xs font-bold text-slate-900 line-clamp-1 group-hover:text-orange-600 transition-colors">
                    {prod.name}
                  </h4>
                </div>
              </div>
              <div className="pt-2 mt-2 border-t border-slate-100 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400">Unit Price</p>
                  <p className="text-xs font-black text-slate-900">{prod.price}</p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-slate-400">In Stock</p>
                  <p className={`text-xs font-bold font-mono ${prod.stock < 20 ? 'text-rose-500' : 'text-emerald-600'}`}>
                    {prod.stock} pcs
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
