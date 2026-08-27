import { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Percent,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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

const monthlyPnLData = [
  { month: 'Sep 25', revenue: 1980000, cogs: 1120000, opex: 410000, net: 450000 },
  { month: 'Oct 25', revenue: 2240000, cogs: 1280000, opex: 430000, net: 530000 },
  { month: 'Nov 25', revenue: 2150000, cogs: 1210000, opex: 420000, net: 520000 },
  { month: 'Dec 25', revenue: 2480000, cogs: 1390000, opex: 460000, net: 630000 },
  { month: 'Jan 26', revenue: 2310000, cogs: 1300000, opex: 440000, net: 570000 },
  { month: 'Feb 26', revenue: 2190000, cogs: 1240000, opex: 430000, net: 520000 },
  { month: 'Mar 26', revenue: 2650000, cogs: 1480000, opex: 490000, net: 680000 },
  { month: 'Apr 26', revenue: 2390000, cogs: 1350000, opex: 450000, net: 590000 },
  { month: 'May 26', revenue: 2540000, cogs: 1420000, opex: 470000, net: 650000 },
  { month: 'Jun 26', revenue: 2720000, cogs: 1510000, opex: 500000, net: 710000 },
  { month: 'Jul 26', revenue: 2610000, cogs: 1460000, opex: 480000, net: 670000 },
  { month: 'Aug 26', revenue: 2840000, cogs: 1580000, opex: 520000, net: 740000 },
];

export default function ProfitLoss() {
  useDocumentTitle('Profit & Loss Statement | DOS-CRM-ERP Finance');

  const [period, setPeriod] = useState<'current_month' | 'quarter' | 'ytd'>('current_month');

  // Dynamic values depending on period
  const pnlSummary = useMemo(() => {
    if (period === 'current_month') {
      const rev = 2840000;
      const cogs = 1580000;
      const gross = rev - cogs;
      const opex = 520000;
      const ebitda = gross - opex;
      const tax = Math.round(ebitda * 0.18);
      const net = ebitda - tax;

      return {
        revenue: rev,
        cogs,
        gross,
        grossMargin: ((gross / rev) * 100).toFixed(1),
        opex,
        ebitda,
        ebitdaMargin: ((ebitda / rev) * 100).toFixed(1),
        tax,
        net,
        netMargin: ((net / rev) * 100).toFixed(1),
        title: 'August 2026 (Current Period)',
      };
    } else if (period === 'quarter') {
      const rev = 8170000;
      const cogs = 4550000;
      const gross = rev - cogs;
      const opex = 1500000;
      const ebitda = gross - opex;
      const tax = Math.round(ebitda * 0.18);
      const net = ebitda - tax;

      return {
        revenue: rev,
        cogs,
        gross,
        grossMargin: ((gross / rev) * 100).toFixed(1),
        opex,
        ebitda,
        ebitdaMargin: ((ebitda / rev) * 100).toFixed(1),
        tax,
        net,
        netMargin: ((net / rev) * 100).toFixed(1),
        title: 'Q2 2026-27 (Jun - Aug 2026)',
      };
    } else {
      const rev = 29500000;
      const cogs = 16440000;
      const gross = rev - cogs;
      const opex = 5400000;
      const ebitda = gross - opex;
      const tax = Math.round(ebitda * 0.18);
      const net = ebitda - tax;

      return {
        revenue: rev,
        cogs,
        gross,
        grossMargin: ((gross / rev) * 100).toFixed(1),
        opex,
        ebitda,
        ebitdaMargin: ((ebitda / rev) * 100).toFixed(1),
        tax,
        net,
        netMargin: ((net / rev) * 100).toFixed(1),
        title: 'FY 2026-27 (Year-to-Date)',
      };
    }
  }, [period]);

  const handleExportExcel = () => {
    toast.success('P&L Statement exported to Excel (XLSX) format.');
  };

  const handleExportPDF = () => {
    toast.success('P&L Executive Summary PDF generated.');
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <PageHeader
        badge="Executive Finance Suite"
        title="Profit & Loss Statement"
        description="Comprehensive Income Statement tracking Gross Margin, COGS, EBITDA, OPEX, and Net Profitability."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="rounded-xl h-11 px-4 border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold gap-1.5"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export Excel
            </Button>
            <Button
              size="sm"
              onClick={handleExportPDF}
              className="rounded-xl h-11 px-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 gap-1.5"
            >
              <Download className="h-4 w-4" /> Download PDF
            </Button>
          </div>
        }
      />

      {/* Period Selection Segment Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Statement Period:</span>
          <span className="text-sm font-extrabold text-slate-900">{pnlSummary.title}</span>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setPeriod('current_month')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              period === 'current_month' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Monthly (Aug 2026)
          </button>
          <button
            type="button"
            onClick={() => setPeriod('quarter')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              period === 'quarter' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Q2 (Jun - Aug)
          </button>
          <button
            type="button"
            onClick={() => setPeriod('ytd')}
            className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              period === 'ytd' ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            FY 2026-27 YTD
          </button>
        </div>
      </div>

      {/* 4 Executive KPI Cards with Margin Meters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* 1. Gross Revenue */}
        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Revenue</span>
              <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-black px-2 py-0.5 rounded-full">
                +14.2% YoY
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">₹{(pnlSummary.revenue / 100000).toFixed(2)}L</h3>
            <p className="text-xs text-slate-500 font-medium">B2B Wholesale & Product Sales</p>
          </CardContent>
        </Card>

        {/* 2. Gross Profit & Margin */}
        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600">Gross Profit</span>
              <span className="bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-0.5">
                <Percent className="h-2.5 w-2.5" /> {pnlSummary.grossMargin}% Margin
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-purple-700">₹{(pnlSummary.gross / 100000).toFixed(2)}L</h3>
            <div className="w-full bg-slate-100 rounded-full h-1.5">
              <div className="bg-purple-600 h-1.5 rounded-full" style={{ width: `${pnlSummary.grossMargin}%` }} />
            </div>
          </CardContent>
        </Card>

        {/* 3. EBITDA */}
        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">EBITDA</span>
              <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-black px-2 py-0.5 rounded-full">
                {pnlSummary.ebitdaMargin}% Op Margin
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">₹{(pnlSummary.ebitda / 100000).toFixed(2)}L</h3>
            <p className="text-xs text-slate-500 font-medium">After ₹{(pnlSummary.opex / 100000).toFixed(2)}L OPEX</p>
          </CardContent>
        </Card>

        {/* 4. Net Profit */}
        <Card className="rounded-3xl border-2 border-emerald-500/80 bg-white shadow-xl shadow-emerald-600/5 hover:shadow-2xl transition-all duration-300">
          <CardContent className="p-6 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">Net Profit (PAT)</span>
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                {pnlSummary.netMargin}% Net Margin
              </span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600">₹{(pnlSummary.net / 100000).toFixed(2)}L</h3>
            <p className="text-xs text-emerald-700 font-medium">Post Corporate Tax Provision</p>
          </CardContent>
        </Card>
      </div>

      {/* 12-Month Bar Chart */}
      <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <CardHeader className="p-6 pb-2 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-extrabold text-slate-900">12-Month Financial Performance Trend</CardTitle>
            <p className="text-xs text-slate-400">Monthly breakdown of Revenue, COGS, OPEX and Net Operating Profit</p>
          </div>
          <div className="flex items-center gap-4 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-purple-700">
              <span className="h-2.5 w-2.5 rounded-full bg-purple-600" /> Revenue
            </span>
            <span className="flex items-center gap-1.5 text-orange-600">
              <span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> COGS
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Net Profit
            </span>
          </div>
        </CardHeader>
        <CardContent className="p-6 pt-4">
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyPnLData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
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
                <Bar dataKey="revenue" fill="#7C3AED" radius={[6, 6, 0, 0]} name="Revenue" />
                <Bar dataKey="cogs" fill="#F97316" radius={[6, 6, 0, 0]} name="COGS" />
                <Bar dataKey="net" fill="#10B981" radius={[6, 6, 0, 0]} name="Net Profit" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Income Statement Detailed Table */}
      <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
        <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-extrabold text-slate-900">Income Statement Schedule</CardTitle>
            <p className="text-xs text-slate-400 mt-0.5">Audited line-item statement for statutory and management reporting</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
            <ShieldCheck className="h-3.5 w-3.5" /> All Figures in INR (₹)
          </span>
        </CardHeader>

        <CardContent className="p-0">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
              <tr>
                <th className="py-3 px-6">Accounting Line Item</th>
                <th className="py-3 px-6 text-right">Amount (₹)</th>
                <th className="py-3 px-6 text-right">% of Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {/* 1. REVENUE */}
              <tr className="bg-purple-50/40 font-bold text-purple-900">
                <td className="py-3 px-6 flex items-center gap-2">
                  <span>1. REVENUE FROM OPERATIONS</span>
                </td>
                <td className="py-3 px-6 text-right font-black">₹{pnlSummary.revenue.toLocaleString('en-IN')}</td>
                <td className="py-3 px-6 text-right">100.0%</td>
              </tr>
              <tr className="text-slate-600">
                <td className="py-2.5 px-8">Product Sales (Wholesale B2B & Retail)</td>
                <td className="py-2.5 px-6 text-right">₹{Math.round(pnlSummary.revenue * 0.92).toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-6 text-right">92.0%</td>
              </tr>
              <tr className="text-slate-600">
                <td className="py-2.5 px-8">Logistics & Handling Services</td>
                <td className="py-2.5 px-6 text-right">₹{Math.round(pnlSummary.revenue * 0.08).toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-6 text-right">8.0%</td>
              </tr>

              {/* 2. COGS */}
              <tr className="bg-orange-50/40 font-bold text-orange-900">
                <td className="py-3 px-6">2. COST OF GOODS SOLD (COGS)</td>
                <td className="py-3 px-6 text-right font-black">-₹{pnlSummary.cogs.toLocaleString('en-IN')}</td>
                <td className="py-3 px-6 text-right">{((pnlSummary.cogs / pnlSummary.revenue) * 100).toFixed(1)}%</td>
              </tr>
              <tr className="text-slate-600">
                <td className="py-2.5 px-8">Direct Raw Material Ingestion</td>
                <td className="py-2.5 px-6 text-right">₹{Math.round(pnlSummary.cogs * 0.72).toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-6 text-right">40.1%</td>
              </tr>
              <tr className="text-slate-600">
                <td className="py-2.5 px-8">Inbound Freight & Clearing Duties</td>
                <td className="py-2.5 px-6 text-right">₹{Math.round(pnlSummary.cogs * 0.28).toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-6 text-right">15.5%</td>
              </tr>

              {/* GROSS PROFIT */}
              <tr className="bg-purple-100/60 font-extrabold text-purple-950 text-sm">
                <td className="py-3.5 px-6">GROSS PROFIT</td>
                <td className="py-3.5 px-6 text-right text-purple-700 font-black">₹{pnlSummary.gross.toLocaleString('en-IN')}</td>
                <td className="py-3.5 px-6 text-right text-purple-700">{pnlSummary.grossMargin}%</td>
              </tr>

              {/* 3. OPEX */}
              <tr className="bg-slate-50 font-bold text-slate-800">
                <td className="py-3 px-6">3. OPERATING EXPENSES (OPEX)</td>
                <td className="py-3 px-6 text-right font-black">-₹{pnlSummary.opex.toLocaleString('en-IN')}</td>
                <td className="py-3 px-6 text-right">{((pnlSummary.opex / pnlSummary.revenue) * 100).toFixed(1)}%</td>
              </tr>
              <tr className="text-slate-600">
                <td className="py-2.5 px-8">Warehouse Leases (Mumbai, Delhi, BLR, KOL)</td>
                <td className="py-2.5 px-6 text-right">₹{Math.round(pnlSummary.opex * 0.45).toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-6 text-right">8.2%</td>
              </tr>
              <tr className="text-slate-600">
                <td className="py-2.5 px-8">Logistics & Fleet Outbound Delivery</td>
                <td className="py-2.5 px-6 text-right">₹{Math.round(pnlSummary.opex * 0.35).toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-6 text-right">6.4%</td>
              </tr>
              <tr className="text-slate-600">
                <td className="py-2.5 px-8">Software, Cloud & ERP Subscriptions</td>
                <td className="py-2.5 px-6 text-right">₹{Math.round(pnlSummary.opex * 0.20).toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-6 text-right">3.7%</td>
              </tr>

              {/* EBITDA */}
              <tr className="bg-blue-50/50 font-bold text-blue-900">
                <td className="py-3 px-6">EBITDA</td>
                <td className="py-3 px-6 text-right font-black">₹{pnlSummary.ebitda.toLocaleString('en-IN')}</td>
                <td className="py-3 px-6 text-right">{pnlSummary.ebitdaMargin}%</td>
              </tr>

              {/* 4. TAX PROVISION */}
              <tr className="text-slate-600">
                <td className="py-2.5 px-8">Income Tax Provision (18% Corporate Rate)</td>
                <td className="py-2.5 px-6 text-right font-semibold text-rose-600">-₹{pnlSummary.tax.toLocaleString('en-IN')}</td>
                <td className="py-2.5 px-6 text-right">4.7%</td>
              </tr>

              {/* NET PROFIT */}
              <tr className="bg-emerald-100 text-emerald-950 font-black text-sm">
                <td className="py-4 px-6 flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-emerald-700" />
                  <span>NET PROFIT AFTER TAX (PAT)</span>
                </td>
                <td className="py-4 px-6 text-right text-emerald-700 text-base">₹{pnlSummary.net.toLocaleString('en-IN')}</td>
                <td className="py-4 px-6 text-right text-emerald-700 text-base">{pnlSummary.netMargin}%</td>
              </tr>
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
