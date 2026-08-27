import { useState, useMemo } from 'react';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  FileSpreadsheet,
  Activity,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/shared/PageHeader';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const cashFlowHistory = [
  { month: 'Sep 25', inflow: 1850000, outflow: 1480000, net: 370000, balance: 3400000 },
  { month: 'Oct 25', inflow: 2100000, outflow: 1620000, net: 480000, balance: 3880000 },
  { month: 'Nov 25', inflow: 2050000, outflow: 1590000, net: 460000, balance: 4340000 },
  { month: 'Dec 25', inflow: 2380000, outflow: 1810000, net: 570000, balance: 4910000 },
  { month: 'Jan 26', inflow: 2200000, outflow: 1720000, net: 480000, balance: 5390000 },
  { month: 'Feb 26', inflow: 2150000, outflow: 1690000, net: 460000, balance: 5850000 },
  { month: 'Mar 26', inflow: 2580000, outflow: 1950000, net: 630000, balance: 6480000 },
  { month: 'Apr 26', inflow: 2320000, outflow: 1780000, net: 540000, balance: 7020000 },
  { month: 'May 26', inflow: 2490000, outflow: 1860000, net: 630000, balance: 7650000 },
  { month: 'Jun 26', inflow: 2650000, outflow: 1980000, net: 670000, balance: 8320000 },
  { month: 'Jul 26', inflow: 2540000, outflow: 1920000, net: 620000, balance: 8940000 },
  { month: 'Aug 26', inflow: 2790000, outflow: 2080000, net: 710000, balance: 9650000 },
];

export default function CashFlow() {
  useDocumentTitle('Cash Flow & Treasury | DOS-CRM-ERP Finance');

  const [timeframe, setTimeframe] = useState<'12m' | '6m'>('12m');

  const currentMetrics = useMemo(() => {
    const latest = cashFlowHistory[cashFlowHistory.length - 1];
    const totalInflow = cashFlowHistory.reduce((a, b) => a + b.inflow, 0);
    const totalOutflow = cashFlowHistory.reduce((a, b) => a + b.outflow, 0);
    const monthlyBurn = 2080000;
    const runwayMonths = (latest.balance / monthlyBurn).toFixed(1);

    return {
      currentBalance: latest.balance,
      monthlyInflow: latest.inflow,
      monthlyOutflow: latest.outflow,
      netCashMonthly: latest.net,
      totalInflow,
      totalOutflow,
      runwayMonths,
    };
  }, []);

  const handleExport = () => {
    toast.success('Cash Flow Statement & Treasury Forecast exported to Excel (XLSX).');
  };

  const displayedHistory = useMemo(() => {
    if (timeframe === '6m') {
      return cashFlowHistory.slice(6);
    }
    return cashFlowHistory;
  }, [timeframe]);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <PageHeader
        badge="Treasury & Liquidity Management"
        title="Cash Flow Statement"
        description="Monitor operating liquidity, customer payment inflows, vendor outflows, and cash runway projections."
        actions={
          <Button
            onClick={handleExport}
            className="rounded-xl px-5 h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-purple-600/20 gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" /> Export Cash Flow Excel
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="rounded-3xl border-2 border-emerald-500/70 bg-white shadow-lg shadow-emerald-500/5 hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Liquid Cash Reserves</p>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-600">₹{(currentMetrics.currentBalance / 100000).toFixed(2)}L</h3>
              <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5" /> {currentMetrics.runwayMonths} Months Operating Runway
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <Wallet className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Operating Inflow</p>
              <h3 className="text-2xl sm:text-3xl font-black text-purple-700">₹{(currentMetrics.monthlyInflow / 100000).toFixed(2)}L</h3>
              <p className="text-xs text-purple-600 font-semibold flex items-center gap-1">
                <ArrowDownLeft className="h-3.5 w-3.5 text-purple-600" /> +9.8% vs last month
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
              <ArrowDownLeft className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Cash Outflow</p>
              <h3 className="text-2xl sm:text-3xl font-black text-orange-600">₹{(currentMetrics.monthlyOutflow / 100000).toFixed(2)}L</h3>
              <p className="text-xs text-slate-500 font-medium">Vendor POs & Facility Overhead</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
              <ArrowUpRight className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Net Monthly Cash</p>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-600">+₹{(currentMetrics.netCashMonthly / 100000).toFixed(2)}L</h3>
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Positive cash generation
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center">
              <Activity className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Treasury Chart */}
      <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-extrabold text-slate-900">Cash Flow Telemetry & Reserve Growth</CardTitle>
            <p className="text-xs text-slate-400">Tracking Operating Inflows vs Cash Outflows and Cumulative Treasury</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-bold">
              <button
                type="button"
                onClick={() => setTimeframe('12m')}
                className={`px-3 py-1 rounded-lg transition-all ${timeframe === '12m' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500'}`}
              >
                12 Months
              </button>
              <button
                type="button"
                onClick={() => setTimeframe('6m')}
                className={`px-3 py-1 rounded-lg transition-all ${timeframe === '6m' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500'}`}
              >
                Last 6 Months
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 pt-4">
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={displayedHistory} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                <defs>
                  <linearGradient id="inflowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94A3B8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₹${(val / 100000).toFixed(0)}L`}
                />
                <Tooltip
                  formatter={(value: any) => [`₹${Number(value).toLocaleString('en-IN')}`, '']}
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
                    fontSize: '12px',
                    fontWeight: 600,
                  }}
                />
                <Area type="monotone" dataKey="balance" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#balanceGrad)" name="Cash Reserves" />
                <Area type="monotone" dataKey="inflow" stroke="#7C3AED" strokeWidth={2} fillOpacity={1} fill="url(#inflowGrad)" name="Monthly Inflow" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Statement Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-purple-700">
            <TrendingUp className="h-5 w-5" />
            <h4 className="font-extrabold text-slate-900 text-sm">Operating Activities</h4>
          </div>
          <p className="text-xs text-slate-500">Receipts from customer orders and collections from sales invoices.</p>
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Client Collections:</span>
              <span className="font-bold text-slate-900">₹27,90,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Supplier Payments:</span>
              <span className="font-semibold text-rose-600">-₹15,80,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">OPEX Overhead:</span>
              <span className="font-semibold text-rose-600">-₹5,20,000</span>
            </div>
            <div className="flex justify-between font-extrabold text-emerald-600 pt-2 border-t border-slate-100">
              <span>Net Operating Cash:</span>
              <span>+₹6,90,000</span>
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-blue-700">
            <Activity className="h-5 w-5" />
            <h4 className="font-extrabold text-slate-900 text-sm">Investing Activities</h4>
          </div>
          <p className="text-xs text-slate-500">Capital investments in warehouse automation and equipment upgrades.</p>
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Conveyor Sorting Rig:</span>
              <span className="font-semibold text-rose-600">-₹85,000</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Barcode Scanner Fleet:</span>
              <span className="font-semibold text-rose-600">-₹25,000</span>
            </div>
            <div className="flex justify-between font-extrabold text-slate-900 pt-2 border-t border-slate-100">
              <span>Net Investing Cash:</span>
              <span>-₹1,10,000</span>
            </div>
          </div>
        </Card>

        <Card className="rounded-3xl border border-slate-200/90 bg-white p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-emerald-700">
            <ShieldCheck className="h-5 w-5" />
            <h4 className="font-extrabold text-slate-900 text-sm">Financing & Reserves</h4>
          </div>
          <p className="text-xs text-slate-500">Working capital credit lines, interest income, and cash reserves.</p>
          <div className="space-y-2 pt-2 border-t border-slate-100 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-600">Treasury Interest Yield:</span>
              <span className="font-semibold text-emerald-600">+₹13,500</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Working Capital Line:</span>
              <span className="font-semibold text-slate-800">₹0 Drawn</span>
            </div>
            <div className="flex justify-between font-extrabold text-emerald-600 pt-2 border-t border-slate-100">
              <span>Net Financing Cash:</span>
              <span>+₹13,500</span>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
