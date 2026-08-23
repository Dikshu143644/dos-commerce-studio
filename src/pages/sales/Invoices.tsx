import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { FileText, Download, Send, DollarSign, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { useInvoices, useEmailInvoice } from '@/hooks/useInvoices';
import { usePayments, useRecordPayment } from '@/hooks/usePayments';
import type { Invoice, PaymentStatus, PaymentMethod } from '@/types/database';
import type { InvoiceFilters } from '@/services/sales';

const paymentStatusVariants: Record<string, 'default' | 'warning' | 'destructive' | 'secondary' | 'info'> = {
  unpaid: 'destructive',
  partial: 'warning',
  paid: 'default',
  overdue: 'destructive',
  refunded: 'secondary',
};

export default function InvoicesPage() {
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | ''>('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [paymentRef, setPaymentRef] = useState('');

  const filters: InvoiceFilters = {};
  if (statusFilter) {
    filters.payment_status = statusFilter;
  }

  const { data: invoicesData, isLoading } = useInvoices(filters);
  const { data: payments } = usePayments(selectedInvoice?.sales_order_id);
  const recordPayment = useRecordPayment();
  const emailInvoice = useEmailInvoice();

  const invoices = (invoicesData as Invoice[] | undefined) ?? [];

  // Summary stats
  const stats = useMemo(() => {
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.total_amount, 0);
    const totalCollected = invoices.reduce((sum, inv) => sum + inv.amount_paid, 0);
    const totalOutstanding = totalInvoiced - totalCollected;
    return { totalInvoiced, totalCollected, totalOutstanding };
  }, [invoices]);

  const handleRecordPayment = () => {
    if (!selectedInvoice || !paymentAmount) return;
    recordPayment.mutate(
      {
        invoice_id: selectedInvoice.id,
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        reference_number: paymentRef || undefined,
        received_by: 'current_user',
      },
      {
        onSuccess: () => {
          toast.success('Payment recorded successfully');
          setPaymentDialogOpen(false);
          setPaymentAmount('');
          setPaymentRef('');
        },
        onError: (e) => toast.error(`Failed: ${e.message}`),
      }
    );
  };

  const handleEmailInvoice = () => {
    if (!selectedInvoice) return;
    emailInvoice.mutate(
      { order_id: selectedInvoice.sales_order_id, recipient_email: '' },
      {
        onSuccess: () => toast.success('Invoice email sent'),
        onError: (e) => toast.error(`Failed: ${e.message}`),
      }
    );
  };

  const columns = [
    { key: 'invoice_number', title: 'Invoice #', sortable: true },
    {
      key: 'sales_order_id',
      title: 'Order Ref',
      render: (row: Record<string, unknown>) =>
        (row.sales_order_id as string)?.slice(0, 8) ?? '-',
    },
    {
      key: 'total_amount',
      title: 'Amount',
      sortable: true,
      render: (row: Record<string, unknown>) =>
        `$${((row.total_amount as number) ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'amount_paid',
      title: 'Paid',
      sortable: true,
      render: (row: Record<string, unknown>) =>
        `$${((row.amount_paid as number) ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'balance',
      title: 'Balance',
      render: (row: Record<string, unknown>) => {
        const balance = (row.total_amount as number) - (row.amount_paid as number);
        return (
          <span className={balance > 0 ? 'text-destructive' : 'text-primary'}>
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        );
      },
    },
    {
      key: 'payment_status',
      title: 'Status',
      render: (row: Record<string, unknown>) => {
        const status = row.payment_status as string;
        const isOverdue = status === 'overdue';
        return (
          <Badge
            variant={paymentStatusVariants[status] || 'secondary'}
            className={isOverdue ? 'animate-pulse' : ''}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      key: 'generated_at',
      title: 'Date',
      sortable: true,
      render: (row: Record<string, unknown>) =>
        row.generated_at
          ? format(new Date(row.generated_at as string), 'MMM d, yyyy')
          : '-',
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
        title="Invoices"
        description="Manage and track customer invoices and payments"
      />

      {/* Summary Cards */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-3"
      >
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <FileText className="h-4 w-4 text-primary" />
            </div>
            <p className="text-2xl font-bold text-primary">
              ${stats.totalInvoiced.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">Total Invoiced</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-foreground" />
            </div>
            <p className="text-2xl font-bold text-foreground">
              ${stats.totalCollected.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">Total Collected</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <AlertCircle className="h-4 w-4 text-destructive" />
            </div>
            <p className="text-2xl font-bold text-destructive">
              ${stats.totalOutstanding.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-muted-foreground">Total Outstanding</p>
          </CardContent>
        </Card>
      </motion.div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as PaymentStatus | '')}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all_statuses">All Statuses</SelectItem>
            <SelectItem value="unpaid">Unpaid</SelectItem>
            <SelectItem value="partial">Partial</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
            <SelectItem value="overdue">Overdue</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Invoice Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-[12px]" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={invoices as unknown as Record<string, unknown>[]}
          searchPlaceholder="Search invoices..."
          onRowClick={(row) => {
            setSelectedInvoice(row as unknown as Invoice);
            setSheetOpen(true);
          }}
        />
      )}

      {/* Invoice Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {selectedInvoice?.invoice_number ?? 'Invoice'}
            </SheetTitle>
            <SheetDescription>
              {selectedInvoice?.generated_at
                ? `Generated ${format(new Date(selectedInvoice.generated_at), 'MMM d, yyyy')}`
                : ''}
            </SheetDescription>
          </SheetHeader>

          {selectedInvoice && (
            <div className="space-y-6 mt-6">
              {/* Invoice Preview Card (dark theme PDF-like) */}
              <Card className="bg-secondary/20 border-primary/10">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">StockFlow Inc.</h3>
                      <p className="text-xs text-muted-foreground">
                        123 Business Park, Mumbai, India
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-foreground">
                        {selectedInvoice.invoice_number}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(selectedInvoice.generated_at), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Customer ID</p>
                      <p className="font-medium text-foreground">
                        {selectedInvoice.customer_id.slice(0, 8)}...
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Due Date</p>
                      <p className="font-medium text-foreground">
                        {selectedInvoice.due_date
                          ? format(new Date(selectedInvoice.due_date), 'MMM d, yyyy')
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground">
                        ${selectedInvoice.subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tax (18%)</span>
                      <span className="text-foreground">
                        ${selectedInvoice.tax_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Discount</span>
                      <span className="text-foreground">
                        -${selectedInvoice.discount_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <Separator />
                    <div className="flex justify-between font-bold">
                      <span className="text-foreground">Total</span>
                      <span className="text-primary">
                        ${selectedInvoice.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount Paid</span>
                      <span className="text-foreground">
                        ${selectedInvoice.amount_paid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-foreground">Outstanding</span>
                      <span className="text-destructive">
                        ${(selectedInvoice.total_amount - selectedInvoice.amount_paid).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Status */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-muted-foreground">Payment Status:</span>
                <Badge
                  variant={paymentStatusVariants[selectedInvoice.payment_status] || 'secondary'}
                  className={selectedInvoice.payment_status === 'overdue' ? 'animate-pulse' : ''}
                >
                  {selectedInvoice.payment_status.charAt(0).toUpperCase() +
                    selectedInvoice.payment_status.slice(1)}
                </Badge>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  onClick={() => setPaymentDialogOpen(true)}
                  disabled={selectedInvoice.payment_status === 'paid'}
                >
                  <DollarSign className="mr-1 h-3.5 w-3.5" /> Record Payment
                </Button>
                <Button size="sm" variant="outline">
                  <Download className="mr-1 h-3.5 w-3.5" /> Download PDF
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleEmailInvoice}
                  disabled={emailInvoice.isPending}
                >
                  <Send className="mr-1 h-3.5 w-3.5" /> Email Invoice
                </Button>
              </div>

              {/* Payment History */}
              {payments && payments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-3">Payment History</h4>
                  <div className="rounded-[12px] border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-secondary/50">
                          <th className="px-3 py-2 text-left text-xs text-muted-foreground">
                            Date
                          </th>
                          <th className="px-3 py-2 text-left text-xs text-muted-foreground">
                            Method
                          </th>
                          <th className="px-3 py-2 text-right text-xs text-muted-foreground">
                            Amount
                          </th>
                          <th className="px-3 py-2 text-left text-xs text-muted-foreground">
                            Reference
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {payments.map((p) => (
                          <tr key={p.id} className="border-t border-border">
                            <td className="px-3 py-2 text-foreground">
                              {format(new Date(p.payment_date), 'MMM d, yyyy')}
                            </td>
                            <td className="px-3 py-2">
                              <Badge variant="secondary" className="text-xs">
                                {p.payment_method}
                              </Badge>
                            </td>
                            <td className="px-3 py-2 text-right text-foreground">
                              ${p.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-3 py-2 text-muted-foreground">
                              {p.reference_number || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for {selectedInvoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input
                type="number"
                min={0}
                step={0.01}
                placeholder="0.00"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
              {selectedInvoice && (
                <p className="text-xs text-muted-foreground">
                  Outstanding: $
                  {(selectedInvoice.total_amount - selectedInvoice.amount_paid).toFixed(2)}
                </p>
              )}
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
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="razorpay">Razorpay</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Reference Number</Label>
              <Input
                placeholder="Optional"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRecordPayment} disabled={recordPayment.isPending}>
              {recordPayment.isPending ? 'Recording...' : 'Record Payment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
