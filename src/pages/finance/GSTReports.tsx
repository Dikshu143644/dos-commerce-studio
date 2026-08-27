import { useState, useMemo } from 'react';
import {
  Download,
  FileSpreadsheet,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface HSNEntry {
  hsn: string;
  description: string;
  uqc: string;
  total_qty: number;
  total_value: number;
  taxable_value: number;
  igst: number;
  cgst: number;
  sgst: number;
}

const mockHsnData: HSNEntry[] = [
  { hsn: '8501', description: 'Electric Motors & Generators (Servo 750W)', uqc: 'NOS', total_qty: 48, total_value: 1632000, taxable_value: 1383050, igst: 124474, cgst: 62237, sgst: 62237 },
  { hsn: '8534', description: 'Printed Circuits & Boards (Circuit Board Pro X1)', uqc: 'NOS', total_qty: 210, total_value: 2625000, taxable_value: 2224576, igst: 200211, cgst: 100105, sgst: 100105 },
  { hsn: '7408', description: 'Copper Wire of Refined Copper (2.5mm Reels)', uqc: 'KGS', total_qty: 650, total_value: 572000, taxable_value: 484745, igst: 43627, cgst: 21813, sgst: 21813 },
  { hsn: '9405', description: 'Lamps & Lighting Fittings (LED Panels 60W)', uqc: 'NOS', total_qty: 120, total_value: 780000, taxable_value: 696428, igst: 41785, cgst: 20892, sgst: 20892 },
  { hsn: '8482', description: 'Ball or Roller Bearings (Steel Bearings Set)', uqc: 'SET', total_qty: 320, total_value: 1440000, taxable_value: 1220338, igst: 109830, cgst: 54915, sgst: 54915 },
];

export default function GSTReports() {
  useDocumentTitle('GST Compliance & Tax Returns | DOS-CRM-ERP Finance');

  const [returnPeriod, setReturnPeriod] = useState('2026-08');

  const totals = useMemo(() => {
    const totalTaxable = mockHsnData.reduce((acc, h) => acc + h.taxable_value, 0);
    const totalIgst = mockHsnData.reduce((acc, h) => acc + h.igst, 0);
    const totalCgst = mockHsnData.reduce((acc, h) => acc + h.cgst, 0);
    const totalSgst = mockHsnData.reduce((acc, h) => acc + h.sgst, 0);
    const totalOutputTax = totalIgst + totalCgst + totalSgst;

    // Simulated Input Tax Credit (ITC) from Supplier Purchase Orders
    const itcEligible = Math.round(totalOutputTax * 0.62);
    const netCashTax = totalOutputTax - itcEligible;

    return {
      totalTaxable,
      totalIgst,
      totalCgst,
      totalSgst,
      totalOutputTax,
      itcEligible,
      netCashTax,
    };
  }, []);

  const handleExportJson = () => {
    toast.success('GST Portal JSON Payload (Offline Tool format) generated successfully.');
  };

  const handleExportExcel = () => {
    toast.success('GSTR-1 & 3B Comprehensive Excel Workbook downloaded.');
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <PageHeader
        badge="Statutory Tax & Compliance Engine"
        title="GST Compliance & Returns"
        description="Automated GSTR-1 outward supplies, HSN Table 12 classification, GSTR-3B tax offset, and ITC matching."
        actions={
          <div className="flex items-center gap-3">
            <Select value={returnPeriod} onValueChange={setReturnPeriod}>
              <SelectTrigger className="w-48 bg-white border-slate-200 rounded-xl text-xs font-bold">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2026-08">August 2026 (Active Period)</SelectItem>
                <SelectItem value="2026-07">July 2026 (Filed)</SelectItem>
                <SelectItem value="2026-06">June 2026 (Filed)</SelectItem>
              </SelectContent>
            </Select>

            <Button
              onClick={handleExportExcel}
              variant="outline"
              size="sm"
              className="rounded-xl h-10 px-4 border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold gap-1.5"
            >
              <FileSpreadsheet className="h-4 w-4 text-emerald-600" /> Export Excel
            </Button>

            <Button
              onClick={handleExportJson}
              size="sm"
              className="rounded-xl h-10 px-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-purple-600/20 gap-1.5"
            >
              <Download className="h-4 w-4" /> Export Portal JSON
            </Button>
          </div>
        }
      />

      {/* 4 Statutory KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Taxable Outward</p>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-900">₹{(totals.totalTaxable / 100000).toFixed(2)}L</h3>
            <p className="text-xs text-purple-600 font-semibold">5 Active HSN Chapters</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-purple-700">Gross Output GST Liability</p>
            <h3 className="text-2xl sm:text-3xl font-black text-purple-700">₹{(totals.totalOutputTax / 100000).toFixed(2)}L</h3>
            <p className="text-xs text-slate-400 font-medium">IGST + CGST + SGST</p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Eligible Input Tax Credit (ITC)</p>
            <h3 className="text-2xl sm:text-3xl font-black text-emerald-600">₹{(totals.itcEligible / 100000).toFixed(2)}L</h3>
            <p className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> Auto-matched via Supplier POs
            </p>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-2 border-orange-400/80 bg-white shadow-xl shadow-orange-500/5 hover:shadow-2xl transition-all duration-300">
          <CardContent className="p-6 space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-orange-600">Net Cash Payable</p>
            <h3 className="text-2xl sm:text-3xl font-black text-orange-600">₹{(totals.netCashTax / 100000).toFixed(2)}L</h3>
            <p className="text-xs text-orange-700 font-semibold">Due by 20th Sep 2026</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for GSTR-1 and GSTR-3B */}
      <Tabs defaultValue="gstr1" className="space-y-6">
        <TabsList className="bg-slate-100 p-1 rounded-2xl border border-slate-200">
          <TabsTrigger value="gstr1" className="rounded-xl px-5 py-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-xs">
            GSTR-1 (Outward Supplies & HSN Table 12)
          </TabsTrigger>
          <TabsTrigger value="gstr3b" className="rounded-xl px-5 py-2 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-purple-700 data-[state=active]:shadow-xs">
            GSTR-3B (Monthly Summary & ITC Offset)
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: GSTR-1 HSN Table */}
        <TabsContent value="gstr1" className="space-y-4">
          <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden">
            <CardHeader className="p-6 border-b border-slate-100 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg font-extrabold text-slate-900">Table 12: HSN Summary of Outward Supplies</CardTitle>
                <p className="text-xs text-slate-400 mt-0.5">Mandatory 4-digit / 6-digit classification for B2B electronic invoices</p>
              </div>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
                GSTIN: 27AABCS1429B1Z8
              </span>
            </CardHeader>

            <CardContent className="p-0 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-6">HSN Code</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-3 text-center">UQC</th>
                    <th className="py-3 px-3 text-right">Qty</th>
                    <th className="py-3 px-4 text-right">Taxable Value (₹)</th>
                    <th className="py-3 px-4 text-right">IGST (₹)</th>
                    <th className="py-3 px-4 text-right">CGST (₹)</th>
                    <th className="py-3 px-4 text-right">SGST (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {mockHsnData.map((h, i) => (
                    <tr key={i} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-6 font-extrabold text-purple-700">{h.hsn}</td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">{h.description}</td>
                      <td className="py-3.5 px-3 text-center text-slate-500">{h.uqc}</td>
                      <td className="py-3.5 px-3 text-right font-bold text-slate-900">{h.total_qty}</td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900">₹{h.taxable_value.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4 text-right text-purple-700">₹{h.igst.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4 text-right text-slate-600">₹{h.cgst.toLocaleString('en-IN')}</td>
                      <td className="py-3.5 px-4 text-right text-slate-600">₹{h.sgst.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                  <tr className="bg-purple-50/50 font-black text-slate-900 text-xs border-t-2 border-purple-200">
                    <td colSpan={4} className="py-4 px-6 uppercase text-purple-900">Total Outward Supplies</td>
                    <td className="py-4 px-4 text-right">₹{totals.totalTaxable.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-4 text-right text-purple-700">₹{totals.totalIgst.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-4 text-right">₹{totals.totalCgst.toLocaleString('en-IN')}</td>
                    <td className="py-4 px-4 text-right">₹{totals.totalSgst.toLocaleString('en-IN')}</td>
                  </tr>
                </tbody>
              </table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: GSTR-3B Tax Offset */}
        <TabsContent value="gstr3b" className="space-y-4">
          <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm overflow-hidden p-6 sm:p-8 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-2">
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">GSTR-3B Monthly Tax Computation & ITC Set-Off</h3>
                <p className="text-xs text-slate-400">Electronic liability register and input credit reconciliation matrix</p>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <ShieldCheck className="h-4 w-4" /> Ready for Portal Upload
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-200 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-800">1. Gross Output Tax</span>
                <p className="text-2xl font-black text-purple-900">₹{totals.totalOutputTax.toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-slate-500">From commercial invoices generated in period.</p>
              </div>

              <div className="p-5 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">2. Less: ITC Offset</span>
                <p className="text-2xl font-black text-emerald-700">-₹{totals.itcEligible.toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-slate-500">From Supplier goods receipt notes (GRN).</p>
              </div>

              <div className="p-5 bg-orange-50/50 rounded-2xl border border-orange-200 space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-800">3. Net Cash Tax</span>
                <p className="text-2xl font-black text-orange-600">₹{totals.netCashTax.toLocaleString('en-IN')}</p>
                <p className="text-[11px] text-slate-500">To be discharged via electronic cash ledger.</p>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
