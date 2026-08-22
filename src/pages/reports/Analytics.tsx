import { motion } from 'motion/react';
import { format, subMonths } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, LineChart, Line, Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/shared/PageHeader';

const revenueData = Array.from({ length: 12 }, (_, i) => ({
  month: format(subMonths(new Date(), 11 - i), 'MMM'),
  revenue: Math.floor(200000 + Math.random() * 100000),
}));

const topProductsData = [
  { name: 'Circuit Board Pro X1', revenue: 142800 },
  { name: 'Industrial Servo Motor', revenue: 118200 },
  { name: 'Copper Wire 2.5mm', revenue: 91400 },
  { name: 'LED Panel 60W', revenue: 78900 },
  { name: 'Steel Bearings Set', revenue: 65100 },
  { name: 'Hydraulic Pump HP-200', revenue: 58700 },
  { name: 'Office Chair Ergonomic', revenue: 49200 },
  { name: 'Thermal Paste TG-7', revenue: 38400 },
  { name: 'Wireless Mouse BT500', revenue: 32100 },
  { name: 'Packaging Tape', revenue: 24800 },
];

const warehouseStock = [
  { name: 'WH-MUM', electronics: 1240, industrial: 890, materials: 560, office: 340 },
  { name: 'WH-DEL', electronics: 890, industrial: 620, materials: 380, office: 210 },
  { name: 'WH-BLR', electronics: 720, industrial: 430, materials: 290, office: 180 },
  { name: 'WH-KOL', electronics: 345, industrial: 210, materials: 140, office: 90 },
  { name: 'WH-AHM', electronics: 680, industrial: 480, materials: 310, office: 150 },
];

const customerAcquisition = Array.from({ length: 12 }, (_, i) => ({
  month: format(subMonths(new Date(), 11 - i), 'MMM'),
  newCustomers: Math.floor(8 + Math.random() * 15),
  churned: Math.floor(1 + Math.random() * 5),
}));

const pipelineData = [
  { stage: 'Qualification', value: 420000, count: 18 },
  { stage: 'Needs Analysis', value: 380000, count: 12 },
  { stage: 'Proposal', value: 520000, count: 8 },
  { stage: 'Negotiation', value: 680000, count: 6 },
  { stage: 'Won', value: 890000, count: 14 },
];

const pipelineColors = ['#71717a', '#3b82f6', '#f59e0b', '#f97316', '#10b981'];

const GlassTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color?: string }>; label?: string }) => {
  if (active && payload?.length) {
    return (
      <div className="glass rounded-[12px] px-3 py-2 text-xs">
        <p className="text-foreground font-medium mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} className="text-muted-foreground">
            <span style={{ color: p.color }}>{p.dataKey}</span>: {typeof p.value === 'number' && p.value > 1000 ? `$${(p.value / 1000).toFixed(0)}K` : p.value}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AnalyticsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Analytics"
        description="Business intelligence and performance metrics"
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-primary">$3.2M</p><p className="text-xs text-muted-foreground">Annual Revenue</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">34.2%</p><p className="text-xs text-muted-foreground">Gross Margin</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">4.8x</p><p className="text-xs text-muted-foreground">Inventory Turnover</p></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><p className="text-2xl font-bold text-foreground">24%</p><p className="text-xs text-muted-foreground">Conversion Rate</p></CardContent></Card>
      </div>

      {/* Revenue Trend */}
      <Card>
        <CardHeader><CardTitle>Revenue Trend (12 months)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `$${v / 1000}K`} />
                <Tooltip content={<GlassTooltip />} />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Top Products + Pipeline */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Top 10 Products by Revenue</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topProductsData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis type="number" stroke="#71717a" fontSize={11} tickFormatter={(v) => `$${v / 1000}K`} />
                  <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={10} width={130} />
                  <Tooltip content={<GlassTooltip />} />
                  <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Deal Pipeline Value</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pipelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="stage" stroke="#71717a" fontSize={11} />
                  <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v) => `$${v / 1000}K`} />
                  <Tooltip content={<GlassTooltip />} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    {pipelineData.map((_, i) => (
                      <Cell key={i} fill={pipelineColors[i]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock by Warehouse + Customer Acquisition */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Stock Levels by Warehouse</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={warehouseStock}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip content={<GlassTooltip />} />
                  <Bar dataKey="electronics" stackId="a" fill="#10b981" />
                  <Bar dataKey="industrial" stackId="a" fill="#14b8a6" />
                  <Bar dataKey="materials" stackId="a" fill="#06d6a0" />
                  <Bar dataKey="office" stackId="a" fill="#0d9488" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Customer Acquisition</CardTitle></CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={customerAcquisition}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} />
                  <Tooltip content={<GlassTooltip />} />
                  <Line type="monotone" dataKey="newCustomers" stroke="#10b981" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="churned" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
