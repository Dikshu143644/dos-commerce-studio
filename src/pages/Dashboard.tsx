import { motion } from 'motion/react';
import {
  Package, AlertTriangle, Handshake, DollarSign, ShoppingCart,
  Plus, ArrowRight, TrendingUp, Users, FileText, BarChart3
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { KPICard } from '@/components/shared/KPICard';
import { format, subMonths } from 'date-fns';

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
  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5"
      >
        <KPICard
          label="Total Products"
          value="2,847"
          icon={Package}
          trend={{ value: 12, isPositive: true }}
          description="vs last month"
        />
        <KPICard
          label="Low Stock Alerts"
          value="23"
          icon={AlertTriangle}
          trend={{ value: 8, isPositive: false }}
          description="needs attention"
          className="border-amber-500/20"
        />
        <KPICard
          label="Active Deals"
          value="156"
          icon={Handshake}
          trend={{ value: 24, isPositive: true }}
          description="vs last month"
        />
        <KPICard
          label="Revenue This Month"
          value="$284,920"
          icon={DollarSign}
          trend={{ value: 18, isPositive: true }}
          description="vs last month"
        />
        <KPICard
          label="Pending Orders"
          value="42"
          icon={ShoppingCart}
          trend={{ value: 5, isPositive: false }}
          description="awaiting action"
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
  );
}
