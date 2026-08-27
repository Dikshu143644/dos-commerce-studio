import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Search,
  Receipt,
  Building,
  TrendingDown,
  CheckCircle2,
  Clock,
  XCircle,
  PieChart as PieIcon,
  Sparkles,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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

export type ExpenseCategory =
  | 'Warehouse Rent'
  | 'Logistics & Freight'
  | 'Salaries & Wages'
  | 'Utilities & Electricity'
  | 'Packaging Materials'
  | 'Software & Subscriptions'
  | 'Equipment Maintenance'
  | 'Marketing & Ads';

export type ApprovalStatus = 'approved' | 'pending' | 'rejected';

export interface ExpenseRecord {
  id: string;
  expense_number: string;
  title: string;
  category: ExpenseCategory;
  amount: number;
  date: string;
  payment_method: 'Bank Transfer' | 'Corporate Card' | 'UPI / NetBanking' | 'Petty Cash';
  vendor: string;
  status: ApprovalStatus;
  notes?: string;
  recorded_by: string;
  receipt_url?: string;
}

const initialExpenses: ExpenseRecord[] = [
  {
    id: 'exp-1',
    expense_number: 'EXP-2026-0041',
    title: 'Central Hub Monthly Facility Lease',
    category: 'Warehouse Rent',
    amount: 145000,
    date: '2026-08-01',
    payment_method: 'Bank Transfer',
    vendor: 'Bandra Realty Holdings',
    status: 'approved',
    notes: 'Paid for August 2026 warehouse rental lease.',
    recorded_by: 'Ananya Roy (Accountant)',
    receipt_url: 'lease_aug_2026.pdf',
  },
  {
    id: 'exp-2',
    expense_number: 'EXP-2026-0042',
    title: 'Inter-City Freight Transit (MUM to DEL)',
    category: 'Logistics & Freight',
    amount: 48500,
    date: '2026-08-08',
    payment_method: 'Corporate Card',
    vendor: 'BlueDart Express Logistics',
    status: 'approved',
    notes: '2 truck consignments of electronics and servo motors.',
    recorded_by: 'Rahul Verma',
    receipt_url: 'freight_bill_48500.pdf',
  },
  {
    id: 'exp-3',
    expense_number: 'EXP-2026-0043',
    title: 'Anti-Static Packaging Foam & Corrugated Cartons',
    category: 'Packaging Materials',
    amount: 22400,
    date: '2026-08-14',
    payment_method: 'UPI / NetBanking',
    vendor: 'EcoPack India Pvt Ltd',
    status: 'approved',
    notes: 'Bulk purchase for 500 orders.',
    recorded_by: 'Warehouse Staff',
  },
  {
    id: 'exp-4',
    expense_number: 'EXP-2026-0044',
    title: 'AWS Cloud & Supabase Multi-Region Cluster',
    category: 'Software & Subscriptions',
    amount: 32000,
    date: '2026-08-15',
    payment_method: 'Corporate Card',
    vendor: 'Amazon Web Services Inc.',
    status: 'approved',
    notes: 'Monthly enterprise database and compute hosting.',
    recorded_by: 'Ananya Roy (Accountant)',
  },
  {
    id: 'exp-5',
    expense_number: 'EXP-2026-0045',
    title: 'Forklift Hydraulic System Annual Maintenance',
    category: 'Equipment Maintenance',
    amount: 18500,
    date: '2026-08-22',
    payment_method: 'Bank Transfer',
    vendor: 'Voltas Material Handling',
    status: 'pending',
    notes: 'Maintenance service at Bhiwandi Depot 2.',
    recorded_by: 'Rahul Verma',
  },
  {
    id: 'exp-6',
    expense_number: 'EXP-2026-0046',
    title: 'Google Ads & LinkedIn B2B Acquisition Campaign',
    category: 'Marketing & Ads',
    amount: 45000,
    date: '2026-08-25',
    payment_method: 'Corporate Card',
    vendor: 'Google LLC',
    status: 'pending',
    notes: 'Targeting manufacturing buyers in Maharashtra and NCR.',
    recorded_by: 'Marketing Team',
  },
];

const categoryColors: Record<ExpenseCategory, string> = {
  'Warehouse Rent': '#7C3AED',
  'Logistics & Freight': '#F97316',
  'Salaries & Wages': '#3B82F6',
  'Utilities & Electricity': '#10B981',
  'Packaging Materials': '#EC4899',
  'Software & Subscriptions': '#8B5CF6',
  'Equipment Maintenance': '#EAB308',
  'Marketing & Ads': '#06B6D4',
};

const statusConfig: Record<ApprovalStatus, { label: string; bg: string; text: string; border: string; icon: typeof CheckCircle2 }> = {
  approved: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: CheckCircle2 },
  pending: { label: 'Pending Approval', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Clock },
  rejected: { label: 'Rejected', bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', icon: XCircle },
};

export default function Expenses() {
  useDocumentTitle('OPEX Expenses & Cost Centers | DOS-CRM-ERP Finance');

  const [expenses, setExpenses] = useState<ExpenseRecord[]>(initialExpenses);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Expense Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('Warehouse Rent');
  const [amount, setAmount] = useState('');
  const [vendor, setVendor] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Corporate Card' | 'UPI / NetBanking' | 'Petty Cash'>('Bank Transfer');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [notes, setNotes] = useState('');

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !amount || !vendor) {
      toast.error('Please enter expense title, amount, and vendor');
      return;
    }

    const newExpense: ExpenseRecord = {
      id: `exp-${Date.now()}`,
      expense_number: `EXP-2026-${String(expenses.length + 42).padStart(4, '0')}`,
      title,
      category,
      amount: Number(amount),
      date,
      payment_method: paymentMethod,
      vendor,
      status: 'pending',
      notes,
      recorded_by: 'Admin User',
    };

    setExpenses([newExpense, ...expenses]);
    setIsCreateOpen(false);
    toast.success(`Expense ${newExpense.expense_number} submitted for review!`);

    // Reset
    setTitle('');
    setAmount('');
    setVendor('');
    setNotes('');
  };

  const handleApprove = (id: string) => {
    setExpenses(expenses.map((e) => (e.id === id ? { ...e, status: 'approved' } : e)));
    toast.success('Expense marked as Approved.');
  };

  const handleReject = (id: string) => {
    setExpenses(expenses.map((e) => (e.id === id ? { ...e, status: 'rejected' } : e)));
    toast.error('Expense rejected.');
  };

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesSearch =
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.expense_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.vendor.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'all' || e.category === categoryFilter;
      const matchesStatus = statusFilter === 'all' || e.status === statusFilter;
      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [expenses, searchTerm, categoryFilter, statusFilter]);

  const kpis = useMemo(() => {
    const totalApproved = expenses
      .filter((e) => e.status === 'approved')
      .reduce((acc, e) => acc + e.amount, 0);

    const totalPending = expenses
      .filter((e) => e.status === 'pending')
      .reduce((acc, e) => acc + e.amount, 0);

    const pendingCount = expenses.filter((e) => e.status === 'pending').length;

    return {
      totalApproved,
      totalPending,
      pendingCount,
    };
  }, [expenses]);

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses
      .filter((e) => e.status === 'approved')
      .forEach((e) => {
        map[e.category] = (map[e.category] || 0) + e.amount;
      });

    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      color: categoryColors[name as ExpenseCategory] || '#7C3AED',
    }));
  }, [expenses]);

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        badge="OPEX & Cost Accounting"
        title="Expense Tracking"
        description="Monitor operational disbursements, vendor payments, approval status, and cost center breakdowns."
        actions={
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="rounded-xl px-5 h-11 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-purple-600/25 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Plus className="h-4 w-4" /> Record New Expense
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Approved OPEX</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">₹{(kpis.totalApproved / 100000).toFixed(2)}L</h3>
              <p className="text-xs text-purple-600 font-semibold flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> August 2026 Cycle
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
              <Receipt className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Pending Approvals</p>
              <h3 className="text-2xl sm:text-3xl font-black text-amber-600">₹{(kpis.totalPending / 100000).toFixed(2)}L</h3>
              <p className="text-xs text-amber-600 font-semibold">{kpis.pendingCount} vouchers awaiting sign-off</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Top Spend Category</p>
              <h3 className="text-xl font-black text-slate-900">Warehouse Rent</h3>
              <p className="text-xs text-slate-500 font-medium">₹1.45L • 46.2% of Total OPEX</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
              <Building className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Daily Avg Burn</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">₹11,400</h3>
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <TrendingDown className="h-3 w-3" /> -4.2% below budget
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <TrendingDown className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Spend Chart & Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm lg:col-span-1">
          <CardHeader className="p-6 pb-2">
            <CardTitle className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <PieIcon className="h-4 w-4 text-purple-600" /> Cost Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="h-[220px] w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [`₹${Number(val).toLocaleString('en-IN')}`, 'Spend']}
                    contentStyle={{ borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 pt-2 border-t border-slate-100">
              {categoryBreakdown.slice(0, 4).map((c) => (
                <div key={c.name} className="flex items-center justify-between text-xs font-medium">
                  <span className="flex items-center gap-1.5 text-slate-600 truncate">
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: c.color }} />
                    {c.name}
                  </span>
                  <span className="font-bold text-slate-900">₹{(c.value / 1000).toFixed(1)}k</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Expenses List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search expense, vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 h-10 bg-slate-50 border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-36 h-10 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="Warehouse Rent">Warehouse Rent</SelectItem>
                  <SelectItem value="Logistics & Freight">Logistics & Freight</SelectItem>
                  <SelectItem value="Packaging Materials">Packaging Materials</SelectItem>
                  <SelectItem value="Software & Subscriptions">Software & Subscriptions</SelectItem>
                  <SelectItem value="Equipment Maintenance">Equipment Maintenance</SelectItem>
                  <SelectItem value="Marketing & Ads">Marketing & Ads</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32 h-10 bg-slate-50 border-slate-200 rounded-xl text-xs font-semibold">
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredExpenses.length === 0 ? (
            <EmptyState icon={Receipt} title="No expenses recorded" description="Record a new OPEX voucher to track disbursements." />
          ) : (
            <div className="space-y-3">
              {filteredExpenses.map((exp) => {
                const badge = statusConfig[exp.status];
                const StatusIcon = badge.icon;

                return (
                  <motion.div
                    key={exp.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2.5">
                        <span className="font-extrabold text-sm text-slate-900">{exp.title}</span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg} ${badge.text} ${badge.border}`}>
                          <StatusIcon className="h-3 w-3" /> {badge.label}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 text-xs text-slate-500">
                        <span className="font-bold text-purple-700">{exp.category}</span>
                        <span>•</span>
                        <span>Vendor: <strong className="text-slate-700">{exp.vendor}</strong></span>
                        <span>•</span>
                        <span>{exp.date}</span>
                        <span>•</span>
                        <span>{exp.payment_method}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-left sm:text-right">
                        <p className="text-lg font-black text-slate-900">₹{exp.amount.toLocaleString('en-IN')}</p>
                        <span className="text-[10px] text-slate-400">{exp.expense_number}</span>
                      </div>

                      {exp.status === 'pending' && (
                        <div className="flex items-center gap-1.5">
                          <Button
                            size="sm"
                            onClick={() => handleApprove(exp.id)}
                            className="h-8 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleReject(exp.id)}
                            className="h-8 px-2.5 rounded-lg border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold"
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Record Expense Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-xl rounded-3xl p-6 sm:p-8 bg-white border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-extrabold text-slate-900">Record Operational Expense</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Enter expense voucher details for audit and accounting ledger reconciliation.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateExpense} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Expense Title *</Label>
              <Input
                required
                placeholder="e.g., Facility Rent for Bhiwandi Hub"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-xl bg-slate-50 text-xs"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Category *</Label>
                <Select value={category} onValueChange={(val) => setCategory(val as ExpenseCategory)}>
                  <SelectTrigger className="rounded-xl bg-slate-50 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Warehouse Rent">Warehouse Rent</SelectItem>
                    <SelectItem value="Logistics & Freight">Logistics & Freight</SelectItem>
                    <SelectItem value="Salaries & Wages">Salaries & Wages</SelectItem>
                    <SelectItem value="Packaging Materials">Packaging Materials</SelectItem>
                    <SelectItem value="Software & Subscriptions">Software & Subscriptions</SelectItem>
                    <SelectItem value="Equipment Maintenance">Equipment Maintenance</SelectItem>
                    <SelectItem value="Marketing & Ads">Marketing & Ads</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Amount (₹) *</Label>
                <Input
                  type="number"
                  required
                  min="1"
                  placeholder="e.g., 45000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="rounded-xl bg-slate-50 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Vendor / Payee Name *</Label>
                <Input
                  required
                  placeholder="e.g., BlueDart Express"
                  value={vendor}
                  onChange={(e) => setVendor(e.target.value)}
                  className="rounded-xl bg-slate-50 text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-bold text-slate-700">Disbursement Date</Label>
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="rounded-xl bg-slate-50 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Payment Channel</Label>
              <Select
                value={paymentMethod}
                onValueChange={(val) => setPaymentMethod(val as any)}
              >
                <SelectTrigger className="rounded-xl bg-slate-50 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Bank Transfer">Bank Transfer (NEFT/RTGS)</SelectItem>
                  <SelectItem value="Corporate Card">Corporate Card</SelectItem>
                  <SelectItem value="UPI / NetBanking">UPI / NetBanking</SelectItem>
                  <SelectItem value="Petty Cash">Petty Cash Voucher</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-slate-700">Internal Audit Notes</Label>
              <Input
                placeholder="e.g., Invoice Ref # 99201"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="rounded-xl bg-slate-50 text-xs"
              />
            </div>

            <DialogFooter className="gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl font-bold text-xs">
                Cancel
              </Button>
              <Button type="submit" className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-5">
                Submit Voucher
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
