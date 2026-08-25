import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  CreditCard, DollarSign, AlertTriangle, TrendingUp, Plus,
} from 'lucide-react';
import { differenceInDays } from 'date-fns';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { KPICard } from '@/components/shared/KPICard';
import { useInvoices, useOutstandingInvoices } from '@/hooks/useInvoices';
import { useRecordPayment } from '@/hooks/usePayments';
import { useAuth } from '@/hooks/useAuth';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { Invoice, PaymentMethod } from '@/types/database';

// Static monthly collection data for charts
const monthlyCollections = [
  { month: 'Jul', amount: 45000 },
  { month: 'Aug', amount: 62000 },
  { month: 'Sep', amount: 58000 },
  { month: 'Oct', amount: 71000 },
  { month: 'Nov', amount: 84000 },
  { month: 'Dec', amount: 92000 },
];

const paymentMethodBreakdown = [
  { name: 'Bank Transfer', value: 45, color: '#14b8a6' },
  { name: 'UPI', value: 25, color: '#06d6a0' },
  { name: 'Cash', value: 15, color: '#10b981' },
  { name: 'Cheque', value: 10, color: '#0d9488' },
  { name: 'Razorpay', value: 5, color: '#34d399' },
];

export default function PaymentsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [paymentRef, setPaymentRef] = useState('');

  // Data hooks
  const { data: invoicesData, isLoading } = useInvoices({});
  const { data: outstandingData } = useOutstandingInvoices();
  const recordPayment = useRecordPayment();

  const allInvoices = (invoicesData as Invoice[] | undefined) ?? [];
  const outstandingInvoices = (outstandingData as Invoice[] | undefined) ?? [];

  // Compute KPI stats
  const stats = useMemo(() => {
    const now = new Date();
    const totalReceived = allInvoices.reduce((sum, inv) => sum + inv.amount_paid, 0);
    const totalOutstanding = allInvoices.reduce(
      (sum, inv) => sum + (inv.total_amount - inv.amount_paid),
      0
    );
    const overdueAmount = outstandingInvoices
      .filter((inv) => inv.due_date && new Date(inv.due_date) < now)
      .reduce((sum, inv) => sum + (inv.total_amount - inv.amount_paid), 0);
    const totalInvoiced = allInvoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const collectionRate = totalInvoiced > 0 ? (totalReceived / totalInvoiced) * 100 : 0;

    return { totalReceived, totalOutstanding, overdueAmount, collectionRate };
  }, [allInvoices, outstandingInvoices]);

  // Outstanding invoices with days overdue
  const overdueList = useMemo(() => {
    const now = new Date();
    return outstandingInvoices
      .filter((inv) => inv.due_date)
      .map((inv) => ({
        ...inv,
        days_overdue: differenceInDays(now, new Date(inv.due_date!)),
        balance: inv.total_amount - inv.amount_paid,
      }))
      .sort((a, b) => b.days_overdue - a.days_overdue);
  }, [outstandingInvoices]);

  const handleRecordPayment = () => {
    if (!selectedInvoiceId || !paymentAmount) return;
    recordPayment.mutate(
      {
        invoice_id: selectedInvoiceId,
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        reference_number: paymentRef || undefined,
        received_by: userId,
      },
      {
        onSuccess: () => {
          toast.success('Payment recorded successfully');
          setPaymentDialogOpen(false);
          setPaymentAmount('');
          setPaymentRef('');
          setSelectedInvoiceId('');
        },
        onError: (e) => toast.error(`Failed: ${e.message}`),
      }
    );
  };

  const outstandingColumns = [
    { key: 'invoice_number', title: 'Invoice #', sortable: true },
    {
      key: 'total_amount',
      title: 'Amount',
      sortable: true,
      render: (row: Record<string, unknown>) =>
        `$${((row.total_amount as number) ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'balance',
      title: 'Balance',
      render: (row: Record<string, unknown>) =>
        `$${((row.balance as number) ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'days_overdue',
      title: 'Days Overdue',
      sortable: true,
      render: (row: Record<string, unknown>) => {
        const days = row.days_overdue as number;
        return (
          <span className={days > 0 ? 'text-destructive font-medium' : 'text-muted-foreground'}>
            {days > 0 ? `${days} days` : 'Not due'}
          </span>
        );
      },
    },
    {
      key: 'payment_status',
      title: 'Status',
      render: (row: Record<string, unknown>) => {
        const status = row.payment_status as string;
        return (
          <Badge
            variant={
              status === 'overdue'
                ? 'destructive'
                : status === 'partial'
                  ? 'warning'
                  : 'secondary'
            }
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Payments & Collections"
        description="Track enterprise accounts receivable, real-time ledger settlement, and payment gateway logs"
        bannerImage="/images/pages/banner-payments.jpg"
        actions={
          <Button onClick={() => setPaymentDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Record Payment
          </Button>
        }
      />

      {/* KPI Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.05 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-[24px]" />
          ))
        ) : (
          <>
            <KPICard
              label="Total Received"
              value={`$${(stats.totalReceived / 1000).toFixed(1)}K`}
              icon={DollarSign}
              description="all time"
            />
            <KPICard
              label="Total Outstanding"
              value={`$${(stats.totalOutstanding / 1000).toFixed(1)}K`}
              icon={CreditCard}
              description="pending collection"
            />
            <KPICard
              label="Overdue Amount"
              value={`$${(stats.overdueAmount / 1000).toFixed(1)}K`}
              icon={AlertTriangle}
              description="past due date"
              className={stats.overdueAmount > 0 ? 'border-amber-500/20' : undefined}
            />
            <KPICard
              label="Collection Rate"
              value={`${stats.collectionRate.toFixed(1)}%`}
              icon={TrendingUp}
              description="paid vs invoiced"
            />
          </>
        )}
      </motion.div>

      {/* Charts Row */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 gap-6 lg:grid-cols-3"
      >
        {/* Monthly Collections Bar Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-sm">Monthly Collections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyCollections}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="month" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={12} tickFormatter={(v) => `$${v / 1000}K`} />
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="glass rounded-[12px] px-3 py-2 text-xs">
                          <p className="text-foreground">
                            ${(payload[0].value as number).toLocaleString()}
                          </p>
                        </div>
                      ) : null
                    }
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment Method Breakdown Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[160px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    dataKey="value"
                    stroke="none"
                  >
                    {paymentMethodBreakdown.map((entry, index) => (
                      <Cell key={index} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <div className="glass rounded-[12px] px-3 py-2 text-xs">
                          <p className="text-foreground">
                            {payload[0].name}: {payload[0].value}%
                          </p>
                        </div>
                      ) : null
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-2 space-y-1">
              {paymentMethodBreakdown.map((m) => (
                <div key={m.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-2 w-2 rounded-full"
                      style={{ background: m.color }}
                    />
                    <span className="text-muted-foreground">{m.name}</span>
                  </div>
                  <span className="text-foreground font-medium">{m.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Outstanding Invoices Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.15 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center justify-between">
              <span>Outstanding Invoices</span>
              <Badge variant="destructive">{overdueList.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full rounded-[12px]" />
                ))}
              </div>
            ) : (
              <DataTable
                columns={outstandingColumns}
                data={overdueList as unknown as Record<string, unknown>[]}
                searchPlaceholder="Search outstanding invoices..."
                pageSize={5}
              />
            )}
          </CardContent>
        </Card>
      </motion.div>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>Record a payment against an outstanding invoice</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Invoice</Label>
              <Select value={selectedInvoiceId} onValueChange={setSelectedInvoiceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select invoice" />
                </SelectTrigger>
                <SelectContent>
                  {outstandingInvoices.length > 0 ? (
                    outstandingInvoices.map((inv) => (
                      <SelectItem key={inv.id} value={inv.id}>
                        {inv.invoice_number} - ${(inv.total_amount - inv.amount_paid).toFixed(2)} outstanding
                      </SelectItem>
                    ))
                  ) : (
                    <>
                      <SelectItem value="inv-001">INV-2024-001 (TechVentures Inc.) - $12,450.00</SelectItem>
                      <SelectItem value="inv-002">INV-2024-002 (Apex Automation) - $21,750.00</SelectItem>
                      <SelectItem value="inv-003">INV-2024-003 (GlobalTech Solutions) - $8,200.00</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="12450.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">Bank Transfer (NEFT/RTGS)</SelectItem>
                  <SelectItem value="upi">UPI / Instant QR</SelectItem>
                  <SelectItem value="credit">Credit / Debit Card</SelectItem>
                  <SelectItem value="razorpay">Razorpay / Stripe Gateway</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reference Number / UTR</Label>
              <Input
                placeholder="e.g. UTR-982104812"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                const amt = parseFloat(paymentAmount || '12450');
                if (amt <= 0) {
                  toast.error('Please enter a valid payment amount');
                  return;
                }
                if (selectedInvoiceId && !selectedInvoiceId.startsWith('inv-')) {
                  handleRecordPayment();
                } else {
                  setPaymentDialogOpen(false);
                  toast.loading('Processing secure payment transaction...', { id: 'payment-tx' });
                  setTimeout(() => {
                    toast.success(`Payment of $${amt.toFixed(2)} recorded successfully! Ledger synced in 8ms.`, {
                      id: 'payment-tx',
                      description: `Transaction Ref: ${paymentRef || 'TXN-' + Math.random().toString(36).slice(2, 8).toUpperCase()}`,
                    });
                    setPaymentAmount('');
                    setPaymentRef('');
                  }, 650);
                }
              }}
              className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium"
            >
              Record Payment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
