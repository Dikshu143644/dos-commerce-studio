import { useState } from 'react';
import { motion } from 'motion/react';
import { Eye, Download, Send, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';

const mockInvoices = [
  { id: '1', invoice_number: 'INV-000078', customer: 'TechVentures Inc.', amount: 10500, tax: 1890, total: 12390, date: '2024-12-18', status: 'unpaid', due_date: '2025-01-17' },
  { id: '2', invoice_number: 'INV-000077', customer: 'Pinnacle Manufacturing', amount: 28900, tax: 5202, total: 34102, date: '2024-12-15', status: 'paid', due_date: '2025-01-14' },
  { id: '3', invoice_number: 'INV-000076', customer: 'MetroWorks Industrial', amount: 57500, tax: 10350, total: 67850, date: '2024-12-14', status: 'paid', due_date: '2025-01-13' },
  { id: '4', invoice_number: 'INV-000075', customer: 'AutoParts Direct', amount: 13200, tax: 2376, total: 15576, date: '2024-12-12', status: 'overdue', due_date: '2024-12-11' },
  { id: '5', invoice_number: 'INV-000074', customer: 'GlobalTech Solutions', amount: 7500, tax: 1350, total: 8850, date: '2024-12-10', status: 'paid', due_date: '2025-01-09' },
  { id: '6', invoice_number: 'INV-000073', customer: 'SmartBuild Contractors', amount: 19800, tax: 3564, total: 23364, date: '2024-12-08', status: 'unpaid', due_date: '2025-01-07' },
  { id: '7', invoice_number: 'INV-000072', customer: 'QuickServe Retail', amount: 3400, tax: 612, total: 4012, date: '2024-12-05', status: 'paid', due_date: '2025-01-04' },
];

const statusVariants: Record<string, 'default' | 'warning' | 'destructive'> = {
  paid: 'default',
  unpaid: 'warning',
  overdue: 'destructive',
};

export default function InvoicesPage() {
  const [previewOpen, setPreviewOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(mockInvoices[0]);

  const columns = [
    { key: 'invoice_number', title: 'Invoice #', sortable: true },
    { key: 'customer', title: 'Customer', sortable: true },
    {
      key: 'amount',
      title: 'Amount',
      sortable: true,
      render: (row: Record<string, unknown>) => `$${(row.amount as number).toLocaleString()}`,
    },
    {
      key: 'total',
      title: 'Total',
      sortable: true,
      render: (row: Record<string, unknown>) => `$${(row.total as number).toLocaleString()}`,
    },
    {
      key: 'date',
      title: 'Date',
      sortable: true,
      render: (row: Record<string, unknown>) => format(new Date(row.date as string), 'MMM d, yyyy'),
    },
    {
      key: 'status',
      title: 'Status',
      render: (row: Record<string, unknown>) => {
        const status = row.status as string;
        return (
          <Badge variant={statusVariants[status] || 'secondary'}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      key: 'actions',
      title: 'Actions',
      render: (row: Record<string, unknown>) => (
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => { setSelectedInvoice(row as typeof selectedInvoice); setPreviewOpen(true); }}
          >
            <Eye className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Download className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-primary">$166,144</p>
            <p className="text-xs text-muted-foreground">Total Invoiced</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">$124,814</p>
            <p className="text-xs text-muted-foreground">Paid</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-destructive">$15,576</p>
            <p className="text-xs text-muted-foreground">Overdue</p>
          </CardContent>
        </Card>
      </div>

      <DataTable
        columns={columns}
        data={mockInvoices as unknown as Record<string, unknown>[]}
        searchPlaceholder="Search invoices..."
      />

      {/* Invoice Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Invoice Preview
            </DialogTitle>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-foreground">StockFlow Inc.</h3>
                  <p className="text-xs text-muted-foreground">123 Business Park, Mumbai, India</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-foreground">{selectedInvoice.invoice_number}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(selectedInvoice.date), 'MMM d, yyyy')}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-xs text-muted-foreground">Bill To</p>
                <p className="text-sm font-medium text-foreground">{selectedInvoice.customer}</p>
              </div>

              <div className="rounded-[12px] border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-secondary/50">
                      <th className="px-3 py-2 text-left text-xs text-muted-foreground">Item</th>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">Qty</th>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">Price</th>
                      <th className="px-3 py-2 text-right text-xs text-muted-foreground">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-border">
                      <td className="px-3 py-2 text-foreground">Circuit Board Pro X1</td>
                      <td className="px-3 py-2 text-right">5</td>
                      <td className="px-3 py-2 text-right">$89.99</td>
                      <td className="px-3 py-2 text-right">$449.95</td>
                    </tr>
                    <tr className="border-t border-border">
                      <td className="px-3 py-2 text-foreground">LED Panel 60W</td>
                      <td className="px-3 py-2 text-right">10</td>
                      <td className="px-3 py-2 text-right">$124.99</td>
                      <td className="px-3 py-2 text-right">$1,249.90</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="space-y-1 text-right">
                <div className="flex justify-end gap-8 text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="text-foreground">${selectedInvoice.amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-end gap-8 text-sm">
                  <span className="text-muted-foreground">Tax (18%)</span>
                  <span className="text-foreground">${selectedInvoice.tax.toLocaleString()}</span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-end gap-8 text-sm font-bold">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">${selectedInvoice.total.toLocaleString()}</span>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" size="sm"><Download className="mr-1 h-3.5 w-3.5" /> PDF</Button>
                <Button size="sm"><Send className="mr-1 h-3.5 w-3.5" /> Send Email</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
