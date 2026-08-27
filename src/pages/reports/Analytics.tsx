import { useState } from 'react';
import { motion } from 'motion/react';
import { format, subMonths } from 'date-fns';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import {
  TrendingUp, Download, FileSpreadsheet, FileText,
  DollarSign, Package, Sparkles,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PageHeader } from '@/components/shared/PageHeader';
import { toast } from 'sonner';

const revenueData = Array.from({ length: 12 }, (_, i) => ({
  month: format(subMonths(new Date(), 11 - i), 'MMM'),
  revenue: Math.floor(200000 + Math.random() * 100000),
  inflow: Math.floor(180000 + Math.random() * 90000),
  outflow: Math.floor(120000 + Math.random() * 60000),
}));

const funnelData = [
  { stage: '1. Inbound Leads', count: 1240, value: 4800000, conversion: '100%', color: '#7C3AED' },
  { stage: '2. Qualified', count: 680, value: 3200000, conversion: '54.8%', color: '#6366F1' },
  { stage: '3. Proposal Sent', count: 320, value: 2100000, conversion: '47.1%', color: '#3B82F6' },
  { stage: '4. Negotiation', count: 180, value: 1450000, conversion: '56.2%', color: '#F97316' },
  { stage: '5. Closed Won', count: 96, value: 920000, conversion: '53.3%', color: '#10B981' },
];

const inventoryTurnoverData = [
  { category: 'Electronics', turnoverRate: 6.8, stockValue: 450000, daysOnHand: 54, velocity: 'High' },
  { category: 'Industrial Parts', turnoverRate: 4.2, stockValue: 380000, daysOnHand: 87, velocity: 'Medium' },
  { category: 'Raw Materials', turnoverRate: 8.4, stockValue: 220000, daysOnHand: 43, velocity: 'Very High' },
  { category: 'Office Supplies', turnoverRate: 3.1, stockValue: 95000, daysOnHand: 118, velocity: 'Low' },
  { category: 'Packaging', turnoverRate: 9.2, stockValue: 80000, daysOnHand: 39, velocity: 'Very High' },
];

const cashFlowProjection = [
  { month: 'Apr 2026', cashIn: 340000, cashOut: 220000, netFlow: 120000 },
  { month: 'May 2026', cashIn: 385000, cashOut: 240000, netFlow: 145000 },
  { month: 'Jun 2026', cashIn: 420000, cashOut: 260000, netFlow: 160000 },
  { month: 'Jul 2026', cashIn: 460000, cashOut: 280000, netFlow: 180000 },
  { month: 'Aug 2026', cashIn: 510000, cashOut: 300000, netFlow: 210000 },
  { month: 'Sep 2026', cashIn: 560000, cashOut: 320000, netFlow: 240000 },
];

const topProductsData = [
  { name: 'Circuit Board Pro X1', revenue: 142800, units: 580 },
  { name: 'Industrial Servo Motor', revenue: 118200, units: 132 },
  { name: 'Copper Wire 2.5mm', revenue: 91400, units: 2030 },
  { name: 'LED Panel 60W', revenue: 78900, units: 650 },
  { name: 'USB-C Hub 7-Port', revenue: 65100, units: 340 },
];

export default function AnalyticsPage() {
  const [activeTab, setActiveTab] = useState('funnel');

  const handleExport = (formatType: string) => {
    toast.success(`Exporting ${activeTab.toUpperCase()} report as ${formatType.toUpperCase()}...`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Advanced Reporting & Analytics"
        description="Real-time multi-dimensional intelligence across sales funnels, stock turnover, and cash flow"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              className="rounded-xl border-slate-200 text-xs font-bold gap-1.5"
            >
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('xlsx')}
              className="rounded-xl border-slate-200 text-xs font-bold gap-1.5 text-emerald-700 bg-emerald-50/50"
            >
              <FileSpreadsheet className="h-3.5 w-3.5" /> Excel
            </Button>
            <Button
              size="sm"
              onClick={() => handleExport('pdf')}
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold gap-1.5 shadow-sm"
            >
              <FileText className="h-3.5 w-3.5" /> Export PDF
            </Button>
          </div>
        }
      />

      {/* KPI Top Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-white border border-slate-200 shadow-xs rounded-[20px]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Annual Revenue</span>
              <DollarSign className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">₹2.74 Cr</p>
            <span className="text-xs text-emerald-600 font-bold">↑ 18.4% vs last year</span>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-xs rounded-[20px]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Pipeline Velocity</span>
              <TrendingUp className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">22.4 Days</p>
            <span className="text-xs text-blue-600 font-bold">4.2 days faster</span>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-xs rounded-[20px]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Stock Turnover</span>
              <Package className="h-4 w-4 text-orange-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">6.4x / yr</p>
            <span className="text-xs text-emerald-600 font-bold">Optimal healthy range</span>
          </CardContent>
        </Card>

        <Card className="bg-white border border-slate-200 shadow-xs rounded-[20px]">
          <CardContent className="p-5">
            <div className="flex items-center justify-between text-slate-500 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Net Cash Flow</span>
              <Sparkles className="h-4 w-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700">+₹84.0L</p>
            <span className="text-xs text-slate-500 font-medium">6-month projected</span>
          </CardContent>
        </Card>
      </div>

      {/* Main Tabs Container */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <TabsTrigger value="funnel" className="rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-xs">
            Sales Performance Funnel
          </TabsTrigger>
          <TabsTrigger value="turnover" className="rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-xs">
            Inventory Turnover Rate
          </TabsTrigger>
          <TabsTrigger value="cashflow" className="rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-xs">
            Financial Cash Flow Projection
          </TabsTrigger>
          <TabsTrigger value="overview" className="rounded-xl text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-xs">
            Top Products & Revenue
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Sales Performance Funnel */}
        <TabsContent value="funnel" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-8 bg-white border border-slate-200 rounded-[24px]">
              <CardHeader>
                <CardTitle className="text-base font-bold text-slate-900">Conversion Funnel Stages</CardTitle>
                <CardDescription className="text-xs text-slate-500">
                  Step-by-step conversion drop-off and deal pipeline values in Indian Rupees (₹).
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {funnelData.map((item, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-slate-800">{item.stage}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-500">{item.count} deals</span>
                          <span className="text-purple-700 font-black">₹{(item.value / 100000).toFixed(1)}L</span>
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                            {item.conversion}
                          </span>
                        </div>
                      </div>
                      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${100 - idx * 18}%`,
                            backgroundColor: item.color,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-4 bg-white border border-slate-200 rounded-[24px] flex flex-col justify-between">
              <CardHeader>
                <CardTitle className="text-base font-bold text-slate-900">Funnel Metrics</CardTitle>
                <CardDescription className="text-xs text-slate-500">Key performance indicators</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100">
                  <span className="text-xs font-bold text-purple-700 block">Overall Conversion</span>
                  <p className="text-3xl font-black text-purple-900 mt-1">7.74%</p>
                  <span className="text-[11px] text-purple-600">Leads → Closed Won deals</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-600 block">Average Deal Value</span>
                  <p className="text-2xl font-black text-slate-900 mt-1">₹7,66,400</p>
                  <span className="text-[11px] text-slate-500">Across active B2B accounts</span>
                </div>
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-xs font-bold text-slate-600 block">Lead Velocity Rate</span>
                  <p className="text-2xl font-black text-emerald-600 mt-1">+14.2%</p>
                  <span className="text-[11px] text-slate-500">Month-over-month pipeline growth</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Tab 2: Inventory Turnover Rate */}
        <TabsContent value="turnover" className="space-y-6">
          <Card className="bg-white border border-slate-200 rounded-[24px]">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">Category Inventory Turnover & Stock Velocity</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Annual turnover turns, average days on hand, and active valuation per product category.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                      <th className="px-4 py-3 text-left font-bold">Category</th>
                      <th className="px-4 py-3 text-center font-bold">Turnover Rate (Turns/Yr)</th>
                      <th className="px-4 py-3 text-center font-bold">Current Stock Value</th>
                      <th className="px-4 py-3 text-center font-bold">Days on Hand</th>
                      <th className="px-4 py-3 text-center font-bold">Velocity Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {inventoryTurnoverData.map((row) => (
                      <tr key={row.category} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-bold text-slate-900">{row.category}</td>
                        <td className="px-4 py-3 text-center font-black text-purple-700">{row.turnoverRate}x</td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-700">₹{row.stockValue.toLocaleString('en-IN')}</td>
                        <td className="px-4 py-3 text-center font-semibold text-slate-600">{row.daysOnHand} days</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                            row.velocity === 'Very High' || row.velocity === 'High'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : row.velocity === 'Medium'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}>
                            {row.velocity}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Financial Cash Flow Projection */}
        <TabsContent value="cashflow" className="space-y-6">
          <Card className="bg-white border border-slate-200 rounded-[24px]">
            <CardHeader>
              <CardTitle className="text-base font-bold text-slate-900">6-Month Predictive Cash Flow (Inflow vs Outflow)</CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Forecasted cash receipts from sales invoices vs procurement &amp; operational expenses in INR (₹).
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={cashFlowProjection}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                    <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                    <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                    <Tooltip />
                    <Bar dataKey="cashIn" name="Cash Inflow" fill="#7C3AED" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="cashOut" name="Cash Outflow" fill="#F97316" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="netFlow" name="Net Cash Flow" fill="#10B981" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Top Products & Revenue */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white border border-slate-200 rounded-[24px]">
              <CardHeader>
                <CardTitle className="text-base font-bold text-slate-900">Revenue Trend (12 Months)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData}>
                      <defs>
                        <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
                      <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} />
                      <YAxis stroke="#94A3B8" fontSize={12} tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`} />
                      <Tooltip />
                      <Area type="monotone" dataKey="revenue" stroke="#7C3AED" strokeWidth={2} fill="url(#revGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200 rounded-[24px]">
              <CardHeader>
                <CardTitle className="text-base font-bold text-slate-900">Top Revenue Generating Products</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topProductsData.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <div>
                        <p className="font-bold text-slate-900">{p.name}</p>
                        <p className="text-slate-500">{p.units} units sold</p>
                      </div>
                      <p className="text-sm font-black text-purple-700">₹{p.revenue.toLocaleString('en-IN')}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
