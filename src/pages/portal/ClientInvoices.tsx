import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  FileText,
  Search,
  Download,
  CreditCard,
  CheckCircle2,
  Clock,
  AlertCircle,
  Calendar,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export type ClientInvoiceStatus = 'paid' | 'pending' | 'overdue';

export interface ClientInvoice {
  id: string;
  invoice_number: string;
  order_number: string;
  po_number: string;
  issue_date: string;
  due_date: string;
  amount: number;
  tax_amount: number;
  status: ClientInvoiceStatus;
}

const mockInvoices: ClientInvoice[] = [
  {
    id: 'inv-1',
    invoice_number: 'INV-2026-089',
    order_number: 'SO-2026-089',
    po_number: 'PO-APEX-2026-0844',
    issue_date: '2026-08-25',
    due_date: '2026-09-24',
    amount: 185000,
    tax_amount: 28220,
    status: 'pending',
  },
  {
    id: 'inv-2',
    invoice_number: 'INV-2026-074',
    order_number: 'SO-2026-074',
    po_number: 'PO-APEX-2026-0820',
    issue_date: '2026-08-18',
    due_date: '2026-09-17',
    amount: 320000,
    tax_amount: 48813,
    status: 'paid',
  },
  {
    id: 'inv-3',
    invoice_number: 'INV-2026-061',
    order_number: 'SO-2026-061',
    po_number: 'PO-APEX-2026-0790',
    issue_date: '2026-07-28',
    due_date: '2026-08-27',
    amount: 145000,
    tax_amount: 22118,
    status: 'paid',
  },
];

const statusStyles: Record<ClientInvoiceStatus, { label: string; bg: string; text: string; icon: any }> = {
  paid: { label: 'Settled / Paid', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-500', icon: CheckCircle2 },
  pending: { label: 'Payment Due', bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-500', icon: Clock },
  overdue: { label: 'Overdue', bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-500', icon: AlertCircle },
};

export default function ClientInvoices() {
  useDocumentTitle('Billing & Tax Invoices | StockFlow');

  const [invoices, setInvoices] = useState<ClientInvoice[]>(mockInvoices);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [payingInvoice, setPayingInvoice] = useState<ClientInvoice | null>(null);

  const handlePay = (inv: ClientInvoice) => {
    setInvoices(
      invoices.map((i) => (i.id === inv.id ? { ...i, status: 'paid' } : i))
    );
    setPayingInvoice(null);
    toast.success(`Payment for ${inv.invoice_number} processed successfully! Receipt dispatched.`);
  };

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.po_number.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [invoices, searchTerm, statusFilter]);

  const summary = useMemo(() => {
    const total = invoices.reduce((acc, i) => acc + i.amount, 0);
    const paid = invoices.filter((i) => i.status === 'paid').reduce((acc, i) => acc + i.amount, 0);
    const due = invoices.filter((i) => i.status !== 'paid').reduce((acc, i) => acc + i.amount, 0);

    return { total, paid, due };
  }, [invoices]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tax Invoices & Statement of Accounts"
        description="View corporate tax invoices, track payment maturities, and settle outstanding balances."
      />

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Invoiced (YTD)</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">₹{summary.total.toLocaleString('en-IN')}</h3>
              <span className="text-xs text-muted-foreground mt-1 block">Contract Procurement</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <FileText className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Settled & Cleared</p>
              <h3 className="text-2xl font-bold text-emerald-500 mt-1">₹{summary.paid.toLocaleString('en-IN')}</h3>
              <span className="text-xs text-emerald-500 font-medium mt-1 block">Paid in full</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Outstanding Balance</p>
              <h3 className="text-2xl font-bold text-amber-500 mt-1">₹{summary.due.toLocaleString('en-IN')}</h3>
              <span className="text-xs text-muted-foreground mt-1 block">Net 30 terms active</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-2xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Invoice #, Order #, PO #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background border-border rounded-xl"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 bg-background border-border rounded-xl">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="paid">Paid</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="overdue">Overdue</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length === 0 ? (
        <EmptyState icon={FileText} title="No invoices found" description="You have no invoices matching the filter criteria." />
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((inv) => {
            const statusConfig = statusStyles[inv.status];
            const StatusIcon = statusConfig.icon;

            return (
              <motion.div
                key={inv.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-bold text-foreground">{inv.invoice_number}</span>
                        <span className="text-xs text-muted-foreground font-mono bg-muted/60 px-2 py-0.5 rounded-md">
                          Order: {inv.order_number}
                        </span>
                        <span className="text-xs text-muted-foreground font-mono">
                          Buyer PO: {inv.po_number}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" /> Issued: {inv.issue_date}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> Due: {inv.due_date}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-5 border-t sm:border-t-0 pt-3 sm:pt-0 border-border">
                      <div className="text-right">
                        <span className="text-lg font-bold text-foreground">₹{inv.amount.toLocaleString('en-IN')}</span>
                        <div className="flex items-center gap-1 text-xs justify-end mt-0.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border text-[11px] font-semibold ${statusConfig.bg} ${statusConfig.text}`}>
                            <StatusIcon className="h-3 w-3" />
                            {statusConfig.label}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toast.success(`Downloaded GST Tax Invoice ${inv.invoice_number}.pdf`)}
                          className="rounded-xl border-border hover:bg-muted"
                        >
                          <Download className="h-4 w-4" />
                        </Button>

                        {inv.status !== 'paid' && (
                          <Button
                            size="sm"
                            onClick={() => setPayingInvoice(inv)}
                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm text-xs"
                          >
                            <CreditCard className="h-4 w-4 mr-1.5" /> Pay Now
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pay Modal */}
      {payingInvoice && (
        <Dialog open={!!payingInvoice} onOpenChange={() => setPayingInvoice(null)}>
          <DialogContent className="max-w-md rounded-3xl bg-card border-border p-6">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Settle Invoice {payingInvoice.invoice_number}</DialogTitle>
              <DialogDescription>Pay amount via corporate net banking, NEFT, or pre-approved credit line.</DialogDescription>
            </DialogHeader>

            <div className="bg-background p-4 rounded-2xl border border-border space-y-2 text-sm my-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order Reference:</span>
                <span className="font-semibold text-foreground">{payingInvoice.order_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Invoice Due:</span>
                <span className="font-semibold text-foreground">{payingInvoice.due_date}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-2 text-base font-bold text-primary">
                <span>Payable Total:</span>
                <span>₹{payingInvoice.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

            <DialogFooter>
              <Button variant="ghost" onClick={() => setPayingInvoice(null)} className="rounded-xl">
                Cancel
              </Button>
              <Button onClick={() => handlePay(payingInvoice)} className="bg-primary text-primary-foreground rounded-xl">
                Confirm & Pay Online
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
