import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  FileCheck2,
  Plus,
  Search,
  Download,
  Send,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Building2,
  User,
  Calendar,
  Sparkles,
  Printer,
  TrendingUp,
  FileText,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';

export interface QuotationItem {
  id: string;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number;
}

export interface Quotation {
  id: string;
  quotation_number: string;
  customer_name: string;
  customer_company: string;
  customer_email: string;
  status: QuotationStatus;
  issue_date: string;
  expiry_date: string;
  items: QuotationItem[];
  subtotal: number;
  tax_total: number;
  discount: number;
  total_amount: number;
  notes?: string;
  created_by: string;
}

const initialQuotations: Quotation[] = [
  {
    id: 'qt-101',
    quotation_number: 'QT-2026-001',
    customer_name: 'Rajesh Sharma',
    customer_company: 'Apex Industrial Solutions',
    customer_email: 'rajesh@apexindustrial.in',
    status: 'sent',
    issue_date: '2026-08-20',
    expiry_date: '2026-09-04',
    items: [
      { id: '1', description: 'Industrial Servo Motor 750W', quantity: 10, unit_price: 34000, tax_rate: 18, amount: 340000 },
      { id: '2', description: 'Precision Steel Bearings Set', quantity: 25, unit_price: 4500, tax_rate: 18, amount: 112500 },
    ],
    subtotal: 452500,
    tax_total: 81450,
    discount: 22500,
    total_amount: 511450,
    notes: 'Includes 1 year comprehensive on-site warranty and calibration services.',
    created_by: 'Rahul Verma',
  },
  {
    id: 'qt-102',
    quotation_number: 'QT-2026-002',
    customer_name: 'Sneha Patel',
    customer_company: 'MicroTech Automation Ltd',
    customer_email: 'sneha.p@microtech.com',
    status: 'accepted',
    issue_date: '2026-08-18',
    expiry_date: '2026-09-02',
    items: [
      { id: '1', description: 'Circuit Board Pro X1 (High-Freq Batch)', quantity: 50, unit_price: 12400, tax_rate: 18, amount: 620000 },
      { id: '2', description: 'Copper Wire 2.5mm Reels (100m)', quantity: 100, unit_price: 8800, tax_rate: 18, amount: 880000 },
    ],
    subtotal: 1500000,
    tax_total: 270000,
    discount: 50000,
    total_amount: 1720000,
    notes: 'Approved via Purchase Order PO-MUM-8921. Delivery to Pune depot.',
    created_by: 'Admin User',
  },
  {
    id: 'qt-103',
    quotation_number: 'QT-2026-003',
    customer_name: 'Harish Mehta',
    customer_company: 'Acura Fabricators Pvt Ltd',
    customer_email: 'harish@acurafab.com',
    status: 'draft',
    issue_date: '2026-08-26',
    expiry_date: '2026-09-10',
    items: [
      { id: '1', description: 'Heavy Duty Stepper Drivers (12V-36V)', quantity: 30, unit_price: 6500, tax_rate: 18, amount: 195000 },
    ],
    subtotal: 195000,
    tax_total: 35100,
    discount: 0,
    total_amount: 230100,
    notes: 'Draft proposal pending final volume discount confirmation from sales head.',
    created_by: 'Ananya Roy',
  },
  {
    id: 'qt-104',
    quotation_number: 'QT-2026-004',
    customer_name: 'Amit Deshmukh',
    customer_company: 'Zenith Logistics Hub',
    customer_email: 'amit@zenithlogistics.in',
    status: 'rejected',
    issue_date: '2026-08-10',
    expiry_date: '2026-08-25',
    items: [
      { id: '1', description: 'Thermal Paste TG-7 Industrial Compound', quantity: 200, unit_price: 1800, tax_rate: 18, amount: 360000 },
    ],
    subtotal: 360000,
    tax_total: 64800,
    discount: 10000,
    total_amount: 414800,
    notes: 'Client requested extended 90-day credit period which exceeded risk threshold.',
    created_by: 'Rahul Verma',
  },
];

const statusConfig: Record<QuotationStatus, { label: string; bg: string; text: string; border: string; icon: typeof CheckCircle2 }> = {
  draft: { label: 'Draft', bg: 'bg-slate-100', text: 'text-slate-700', border: 'border-slate-200', icon: Clock },
  sent: { label: 'Sent', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: Send },
  accepted: { label: 'Accepted (Won)', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
  rejected: { label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: XCircle },
  expired: { label: 'Expired', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock },
};

export default function QuotationsPage() {
  useDocumentTitle('Commercial Quotations | DOS-CRM-ERP');

  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Form State
  const [customerName, setCustomerName] = useState('');
  const [customerCompany, setCustomerCompany] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [validDays, setValidDays] = useState(15);
  const [notes, setNotes] = useState('');
  const [discount, setDiscount] = useState<number>(0);
  const [items, setItems] = useState<Array<{ description: string; quantity: number; unit_price: number; tax_rate: number }>>([
    { description: '', quantity: 1, unit_price: 0, tax_rate: 18 },
  ]);

  const handleAddItem = () => {
    setItems([...items, { description: '', quantity: 1, unit_price: 0, tax_rate: 18 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, idx) => idx !== index));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  const calculatedTotals = useMemo(() => {
    let subtotal = 0;
    let taxTotal = 0;

    items.forEach((item) => {
      const lineSubtotal = (Number(item.quantity) || 0) * (Number(item.unit_price) || 0);
      const lineTax = (lineSubtotal * (Number(item.tax_rate) || 0)) / 100;
      subtotal += lineSubtotal;
      taxTotal += lineTax;
    });

    const disc = Number(discount) || 0;
    const total = Math.max(0, subtotal + taxTotal - disc);

    return { subtotal, taxTotal, total };
  }, [items, discount]);

  const handleCreateQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName || !customerCompany) {
      toast.error('Please enter customer and company name');
      return;
    }

    const newQuotation: Quotation = {
      id: `qt-${Date.now()}`,
      quotation_number: `QT-2026-${String(quotations.length + 1).padStart(3, '0')}`,
      customer_name: customerName,
      customer_company: customerCompany,
      customer_email: customerEmail || 'customer@example.com',
      status: 'draft',
      issue_date: format(new Date(), 'yyyy-MM-dd'),
      expiry_date: format(addDays(new Date(), validDays), 'yyyy-MM-dd'),
      items: items.map((item, idx) => ({
        id: String(idx + 1),
        description: item.description || 'Custom Product Item',
        quantity: item.quantity,
        unit_price: item.unit_price,
        tax_rate: item.tax_rate,
        amount: item.quantity * item.unit_price,
      })),
      subtotal: calculatedTotals.subtotal,
      tax_total: calculatedTotals.taxTotal,
      discount: Number(discount) || 0,
      total_amount: calculatedTotals.total,
      notes,
      created_by: 'Admin User',
    };

    setQuotations([newQuotation, ...quotations]);
    setIsCreateOpen(false);
    toast.success(`Quotation ${newQuotation.quotation_number} generated successfully!`);

    // Reset
    setCustomerName('');
    setCustomerCompany('');
    setCustomerEmail('');
    setNotes('');
    setDiscount(0);
    setItems([{ description: '', quantity: 1, unit_price: 0, tax_rate: 18 }]);
  };

  const handleConvertToOrder = (qt: Quotation) => {
    setQuotations(quotations.map((q) => (q.id === qt.id ? { ...q, status: 'accepted' } : q)));
    toast.success(`Quotation ${qt.quotation_number} converted into Sales Order SO-${Date.now().toString().slice(-4)}!`);
  };

  const handleSendQuotation = (qt: Quotation) => {
    setQuotations(quotations.map((q) => (q.id === qt.id ? { ...q, status: 'sent' } : q)));
    toast.success(`Quotation ${qt.quotation_number} emailed to ${qt.customer_email}`);
  };

  const filteredQuotations = useMemo(() => {
    return quotations.filter((q) => {
      const matchesSearch =
        q.quotation_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.customer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.customer_company.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || q.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [quotations, searchTerm, statusFilter]);

  const kpis = useMemo(() => {
    const totalVal = quotations.reduce((acc, q) => acc + q.total_amount, 0);
    const accepted = quotations.filter((q) => q.status === 'accepted');
    const acceptedVal = accepted.reduce((acc, q) => acc + q.total_amount, 0);
    const conversionRate = quotations.length > 0 ? (accepted.length / quotations.length) * 100 : 0;

    return {
      total: quotations.length,
      totalValue: totalVal,
      acceptedValue: acceptedVal,
      conversionRate: Math.round(conversionRate),
    };
  }, [quotations]);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <PageHeader
        badge="Commercial CRM Pipeline"
        title="Quotations & Proposals"
        description="Draft, track, negotiate, and convert formal commercial price proposals into sales orders."
        actions={
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-xl px-5 h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-purple-600/25 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4" /> Create Quotation
          </Button>
        }
      />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Quotations</p>
              <h3 className="text-3xl font-black text-slate-900">{kpis.total}</h3>
              <p className="text-xs text-purple-600 font-semibold flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Active pipeline
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
              <FileCheck2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pipeline Value</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">₹{(kpis.totalValue / 100000).toFixed(2)}L</h3>
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> Quoted potential
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <Sparkles className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Closed Won</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">₹{(kpis.acceptedValue / 100000).toFixed(2)}L</h3>
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> Converted revenue
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conversion Rate</p>
              <h3 className="text-3xl font-black text-slate-900">{kpis.conversionRate}%</h3>
              <p className="text-xs text-slate-400 font-medium">Deal close efficiency</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Status Segment Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-96">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Search quotation #, company, or contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-2xl text-sm focus:bg-white transition-colors"
            />
          </div>

          {/* Segmented Status Buttons */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto bg-slate-100 p-1 rounded-2xl">
            {['all', 'draft', 'sent', 'accepted', 'rejected'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all cursor-pointer ${
                  statusFilter === st
                    ? 'bg-white text-purple-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {st === 'all' ? 'All Quotes' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Quotations List */}
      {filteredQuotations.length === 0 ? (
        <EmptyState
          icon={FileCheck2}
          title="No quotations found"
          description="Create a new commercial quotation to send to your enterprise buyers."
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredQuotations.map((qt) => {
            const badge = statusConfig[qt.status];
            const StatusIcon = badge.icon;

            return (
              <motion.div
                key={qt.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-purple-300 transition-all duration-200 p-6"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                  {/* Left Column Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="font-extrabold text-lg text-slate-900">{qt.quotation_number}</span>
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                        <StatusIcon className="h-3.5 w-3.5" />
                        {badge.label}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-5 text-xs text-slate-600">
                      <div className="flex items-center gap-1.5 font-bold text-slate-900">
                        <Building2 className="h-4 w-4 text-purple-600" />
                        {qt.customer_company}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <User className="h-3.5 w-3.5" />
                        {qt.customer_name} ({qt.customer_email})
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-500">
                        <Calendar className="h-3.5 w-3.5" />
                        Expires: <span className="font-semibold text-slate-700">{qt.expiry_date}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 flex items-center gap-2">
                      <span className="bg-slate-100 px-2 py-0.5 rounded font-medium">{qt.items.length} line items</span>
                      <span>•</span>
                      <span>Prepared by <strong className="text-slate-700">{qt.created_by}</strong></span>
                    </p>
                  </div>

                  {/* Right Column: Amount & Actions */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:gap-6 pt-4 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                    <div className="text-left sm:text-right">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Quoted Value</p>
                      <h4 className="text-2xl font-black text-purple-700">₹{qt.total_amount.toLocaleString('en-IN')}</h4>
                      <span className="text-[11px] text-slate-400">Incl. ₹{qt.tax_total.toLocaleString('en-IN')} GST</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedQuotation(qt);
                          setIsPreviewOpen(true);
                        }}
                        className="rounded-xl h-10 px-3.5 border-slate-200 hover:bg-purple-50 text-slate-700 hover:text-purple-700 text-xs font-bold"
                      >
                        <FileText className="h-3.5 w-3.5 mr-1" /> PDF Preview
                      </Button>

                      {qt.status === 'draft' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleSendQuotation(qt)}
                          className="rounded-xl h-10 px-3.5 border-blue-200 bg-blue-50/50 hover:bg-blue-100 text-blue-700 text-xs font-bold"
                        >
                          <Send className="h-3.5 w-3.5 mr-1" /> Email Quote
                        </Button>
                      )}

                      {qt.status === 'sent' && (
                        <Button
                          size="sm"
                          onClick={() => handleConvertToOrder(qt)}
                          className="rounded-xl h-10 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20"
                        >
                          <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" /> Convert to SO
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Create Quotation Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 bg-white border border-slate-200">
          <DialogHeader>
            <div className="flex items-center gap-2 text-purple-600 mb-1">
              <FileCheck2 className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-wider">Commercial Proposal</span>
            </div>
            <DialogTitle className="text-2xl font-extrabold text-slate-900">Create New Quotation</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Generate a formal commercial proposal with GST line-items and customer contact details.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateQuotation} className="space-y-6 pt-4">
            {/* Customer Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Company Name *</Label>
                <Input
                  required
                  placeholder="e.g., Apex Industrial Solutions"
                  value={customerCompany}
                  onChange={(e) => setCustomerCompany(e.target.value)}
                  className="rounded-xl bg-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Contact Person Name *</Label>
                <Input
                  required
                  placeholder="e.g., Rajesh Sharma"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="rounded-xl bg-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Contact Email</Label>
                <Input
                  type="email"
                  placeholder="e.g., procurement@apexindustrial.in"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="rounded-xl bg-slate-50"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700">Validity Period</Label>
                <Select value={String(validDays)} onValueChange={(val) => setValidDays(Number(val))}>
                  <SelectTrigger className="rounded-xl bg-slate-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 Days Validity</SelectItem>
                    <SelectItem value="15">15 Days Validity</SelectItem>
                    <SelectItem value="30">30 Days Validity</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Line Items Builder */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h4 className="text-sm font-bold text-slate-900">Line Items & Commercial Pricing</h4>
                <Button type="button" variant="ghost" size="sm" onClick={handleAddItem} className="text-xs font-bold text-purple-600 hover:bg-purple-50">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add Product Item
                </Button>
              </div>

              {items.map((item, idx) => (
                <div key={idx} className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-12 sm:col-span-5 space-y-1">
                    <Label className="text-[11px] font-bold text-slate-500">Product / SKU Description</Label>
                    <Input
                      placeholder="e.g., Industrial Servo Motor 750W"
                      value={item.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="h-9 bg-white text-xs rounded-lg"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2 space-y-1">
                    <Label className="text-[11px] font-bold text-slate-500">Qty</Label>
                    <Input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      className="h-9 bg-white text-xs rounded-lg"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2 space-y-1">
                    <Label className="text-[11px] font-bold text-slate-500">Unit Price (₹)</Label>
                    <Input
                      type="number"
                      min="0"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(idx, 'unit_price', Number(e.target.value))}
                      className="h-9 bg-white text-xs rounded-lg"
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-2 space-y-1">
                    <Label className="text-[11px] font-bold text-slate-500">GST %</Label>
                    <Select value={String(item.tax_rate)} onValueChange={(val) => handleItemChange(idx, 'tax_rate', Number(val))}>
                      <SelectTrigger className="h-9 bg-white text-xs rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">0%</SelectItem>
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="28">28%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="col-span-1 flex justify-end pt-5">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      disabled={items.length === 1}
                      onClick={() => handleRemoveItem(idx)}
                      className="h-8 w-8 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Discount & Totals Breakdown */}
            <div className="p-5 bg-purple-50/50 rounded-2xl border border-purple-200/80 flex flex-col sm:flex-row justify-between gap-4">
              <div className="space-y-1.5 w-full sm:w-64">
                <Label className="text-xs font-bold text-purple-900">Commercial Discount (₹)</Label>
                <Input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                  className="bg-white text-xs rounded-xl"
                  placeholder="0"
                />
              </div>

              <div className="space-y-1 text-right text-xs">
                <div className="flex justify-between sm:justify-end gap-6 text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-900">₹{calculatedTotals.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between sm:justify-end gap-6 text-slate-500">
                  <span>GST Total:</span>
                  <span className="font-semibold text-slate-900">₹{calculatedTotals.taxTotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between sm:justify-end gap-6 text-slate-500">
                  <span>Discount:</span>
                  <span className="font-semibold text-rose-600">-₹{Number(discount || 0).toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between sm:justify-end gap-6 text-sm font-black text-purple-900 pt-2 border-t border-purple-200">
                  <span>Grand Total:</span>
                  <span>₹{calculatedTotals.total.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold text-slate-700">Commercial Notes & Terms</Label>
              <Input
                placeholder="e.g., 50% advance, 50% upon delivery dispatch inspection."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl bg-slate-50 text-xs"
              />
            </div>

            <DialogFooter className="gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl font-bold">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold px-6">
                Generate & Save Quotation
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* PDF Commercial Preview Modal */}
      {selectedQuotation && (
        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-10 bg-white border border-slate-200">
            <div className="border border-slate-200 rounded-2xl p-6 sm:p-8 bg-white space-y-6 shadow-sm">
              {/* Header */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-8 w-8 rounded-lg bg-purple-600 text-white font-black text-base flex items-center justify-center">
                      D
                    </div>
                    <span className="text-xl font-black text-slate-900">DOS<span className="text-purple-600">CRM</span>-ERP</span>
                  </div>
                  <p className="text-xs text-slate-500">Commercial Sales & Multi-Warehouse Hub</p>
                  <p className="text-xs text-slate-500">GSTIN: 27AABCS1429B1Z8 | Mumbai Central HQ</p>
                </div>
                <div className="text-left sm:text-right">
                  <span className="bg-purple-100 text-purple-800 text-[10px] font-black uppercase px-2.5 py-1 rounded-md">
                    FORMAL PRICE QUOTATION
                  </span>
                  <h3 className="text-xl font-extrabold text-slate-900 mt-1">{selectedQuotation.quotation_number}</h3>
                  <p className="text-xs text-slate-500">Date: {selectedQuotation.issue_date}</p>
                  <p className="text-xs text-slate-500">Valid Till: {selectedQuotation.expiry_date}</p>
                </div>
              </div>

              {/* Client Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                <div>
                  <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">PROPOSAL PREPARED FOR:</span>
                  <p className="font-extrabold text-slate-900 text-sm">{selectedQuotation.customer_company}</p>
                  <p className="text-slate-600">Attn: {selectedQuotation.customer_name}</p>
                  <p className="text-slate-600">{selectedQuotation.customer_email}</p>
                </div>
                <div className="sm:text-right">
                  <span className="text-slate-400 font-bold uppercase tracking-wider block mb-1">ORIGIN LOGISTICS HUB:</span>
                  <p className="font-bold text-slate-800">Mumbai Central Mega Facility (WH-MUM)</p>
                  <p className="text-slate-600">Account Executive: {selectedQuotation.created_by}</p>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-600 font-bold uppercase border-y border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit Price</th>
                      <th className="py-2.5 px-3 text-right">GST %</th>
                      <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedQuotation.items.map((item, i) => (
                      <tr key={i}>
                        <td className="py-3 px-3 text-slate-400 font-medium">{i + 1}</td>
                        <td className="py-3 px-3 font-semibold text-slate-800">{item.description}</td>
                        <td className="py-3 px-3 text-right">{item.quantity}</td>
                        <td className="py-3 px-3 text-right">₹{item.unit_price.toLocaleString('en-IN')}</td>
                        <td className="py-3 px-3 text-right">{item.tax_rate}%</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">₹{item.amount.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals */}
              <div className="flex flex-col sm:flex-row justify-between items-start border-t border-slate-200 pt-4 gap-4 text-xs">
                <div className="max-w-md text-slate-500 italic">
                  <strong>Terms:</strong> {selectedQuotation.notes || 'Prices valid for 15 days. Standard GST taxes applicable at dispatch.'}
                </div>
                <div className="space-y-1.5 w-full sm:w-60 text-right">
                  <div className="flex justify-between text-slate-500">
                    <span>Taxable Value:</span>
                    <span className="font-semibold text-slate-800">₹{selectedQuotation.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>GST (CGST+SGST/IGST):</span>
                    <span className="font-semibold text-slate-800">₹{selectedQuotation.tax_total.toLocaleString('en-IN')}</span>
                  </div>
                  {selectedQuotation.discount > 0 && (
                    <div className="flex justify-between text-rose-600">
                      <span>Discount:</span>
                      <span className="font-semibold">-₹{selectedQuotation.discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-purple-700 pt-2 border-t border-slate-200">
                    <span>Final Amount:</span>
                    <span>₹{selectedQuotation.total_amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button variant="outline" onClick={() => window.print()} className="rounded-xl font-bold gap-1.5">
                <Printer className="h-4 w-4" /> Print
              </Button>
              <Button
                onClick={() => {
                  setIsPreviewOpen(false);
                  toast.success(`PDF quotation ${selectedQuotation.quotation_number} downloaded.`);
                }}
                className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold gap-1.5"
              >
                <Download className="h-4 w-4" /> Download PDF
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
