import { useState } from 'react';
import { motion } from 'motion/react';
import { Package, ClipboardList, FileText, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { EmptyState } from '@/components/shared/EmptyState';
import { useReceiveItems } from '@/hooks/useReceiving';

// Mock POs awaiting receiving
const mockPendingPOs = [
  {
    id: 'po1',
    order_number: 'PO-000089',
    supplier: 'TechComp Electronics',
    status: 'confirmed' as const,
    items_count: 4,
    total_received_pct: 0,
    expected_delivery: '2024-12-20',
    total_amount: 245000,
  },
  {
    id: 'po2',
    order_number: 'PO-000087',
    supplier: 'Industrial Supply Co',
    status: 'partially_received' as const,
    items_count: 3,
    total_received_pct: 60,
    expected_delivery: '2024-12-15',
    total_amount: 180000,
  },
  {
    id: 'po3',
    order_number: 'PO-000085',
    supplier: 'SteelWorks India',
    status: 'confirmed' as const,
    items_count: 2,
    total_received_pct: 0,
    expected_delivery: '2024-12-22',
    total_amount: 95000,
  },
];

// Mock PO line items for receiving dialog
const mockPOItems = [
  {
    id: 'poi1',
    product_id: 'p1',
    product_name: 'Circuit Board Pro X1',
    ordered_qty: 100,
    received_qty: 0,
    remaining_qty: 100,
    unit_price: 1200,
  },
  {
    id: 'poi2',
    product_id: 'p2',
    product_name: 'Industrial Servo Motor',
    ordered_qty: 20,
    received_qty: 0,
    remaining_qty: 20,
    unit_price: 8500,
  },
  {
    id: 'poi3',
    product_id: 'p3',
    product_name: 'LED Panel 60W',
    ordered_qty: 50,
    received_qty: 0,
    remaining_qty: 50,
    unit_price: 2400,
  },
  {
    id: 'poi4',
    product_id: 'p4',
    product_name: 'Thermal Paste TG-7',
    ordered_qty: 200,
    received_qty: 0,
    remaining_qty: 200,
    unit_price: 350,
  },
];

// Mock GRN history
const mockGRNs = [
  {
    id: 'grn1',
    grn_number: 'GRN-00045',
    po_reference: 'PO-000086',
    received_by: 'Rajesh Kumar',
    received_at: '2024-12-14T10:30:00Z',
    items_count: 3,
    status: 'completed',
  },
  {
    id: 'grn2',
    grn_number: 'GRN-00044',
    po_reference: 'PO-000084',
    received_by: 'Priya Singh',
    received_at: '2024-12-12T14:15:00Z',
    items_count: 5,
    status: 'completed',
  },
  {
    id: 'grn3',
    grn_number: 'GRN-00043',
    po_reference: 'PO-000083',
    received_by: 'Amit Patel',
    received_at: '2024-12-10T09:00:00Z',
    items_count: 2,
    status: 'completed',
  },
];

interface ReceiveLineItem {
  po_item_id: string;
  product_id: string;
  product_name: string;
  ordered_qty: number;
  received_qty: number;
  remaining_qty: number;
  qty_to_receive: number;
  rejection_qty: number;
  rejection_reason: string;
  batch_number: string;
  expiry_date: string;
}

export default function ReceivingPage() {
  const [receiveOpen, setReceiveOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState<typeof mockPendingPOs[0] | null>(null);
  const [lineItems, setLineItems] = useState<ReceiveLineItem[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [receiveNotes, setReceiveNotes] = useState('');
  const [isLoading] = useState(false);

  const receiveItems = useReceiveItems();

  const openReceiveDialog = (po: typeof mockPendingPOs[0]) => {
    setSelectedPO(po);
    setLineItems(
      mockPOItems.map((item) => ({
        po_item_id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        ordered_qty: item.ordered_qty,
        received_qty: item.received_qty,
        remaining_qty: item.remaining_qty,
        qty_to_receive: 0,
        rejection_qty: 0,
        rejection_reason: '',
        batch_number: '',
        expiry_date: '',
      }))
    );
    setInvoiceNumber('');
    setReceiveNotes('');
    setReceiveOpen(true);
  };

  const updateLineItem = (index: number, field: keyof ReceiveLineItem, value: string | number) => {
    const updated = [...lineItems];
    updated[index] = { ...updated[index], [field]: value };
    setLineItems(updated);
  };

  const handleReceiveSubmit = () => {
    const itemsToReceive = lineItems.filter((item) => item.qty_to_receive > 0);
    if (itemsToReceive.length === 0) {
      toast.error('Please enter at least one quantity to receive');
      return;
    }

    receiveItems.mutate(
      {
        purchase_order_id: selectedPO?.id ?? '',
        warehouse_id: 'wh-mum',
        received_by: 'current-user-id',
        supplier_invoice_number: invoiceNumber || undefined,
        notes: receiveNotes || undefined,
        items: itemsToReceive.map((item) => ({
          purchase_order_item_id: item.po_item_id,
          product_id: item.product_id,
          quantity_received: item.qty_to_receive,
          quantity_rejected: item.rejection_qty || undefined,
          rejection_reason: item.rejection_reason || undefined,
          batch_number: item.batch_number || undefined,
          expiry_date: item.expiry_date || undefined,
        })),
      },
      {
        onSuccess: () => {
          toast.success('Items received successfully. GRN has been generated.');
          setReceiveOpen(false);
        },
        onError: () => {
          toast.error('Failed to receive items');
        },
      }
    );
  };

  const grnColumns = [
    {
      key: 'grn_number',
      title: 'GRN #',
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span className="font-medium text-primary">{row.grn_number as string}</span>
      ),
    },
    { key: 'po_reference', title: 'PO Reference', sortable: true },
    { key: 'received_by', title: 'Received By' },
    {
      key: 'received_at',
      title: 'Date',
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span className="text-sm">
          {format(new Date(row.received_at as string), 'MMM d, yyyy HH:mm')}
        </span>
      ),
    },
    {
      key: 'items_count',
      title: 'Items',
      render: (row: Record<string, unknown>) => (
        <span>{row.items_count as number} items</span>
      ),
    },
    {
      key: 'status',
      title: 'Status',
      render: () => (
        <Badge className="bg-emerald-500/20 text-emerald-400 border-0">Completed</Badge>
      ),
    },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-72" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48 w-full rounded-[24px]" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Receiving"
        description="Receive goods against purchase orders and generate GRNs"
      />

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending" className="gap-2">
            <Package className="h-4 w-4" />
            Pending POs
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <FileText className="h-4 w-4" />
            GRN History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {mockPendingPOs.length === 0 ? (
            <EmptyState
              icon={Inbox}
              title="No pending orders"
              description="There are no purchase orders awaiting receiving at this time."
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockPendingPOs.map((po) => (
                <motion.div
                  key={po.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="bg-[rgba(255,255,255,0.03)] border-[rgba(255,255,255,0.06)] rounded-[24px] hover:border-primary/30 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <CardTitle className="text-base font-semibold">{po.order_number}</CardTitle>
                        <Badge
                          className={`border-0 ${
                            po.status === 'partially_received'
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {po.status === 'partially_received' ? 'Partial' : 'Confirmed'}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Supplier</span>
                          <span className="font-medium">{po.supplier}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Items</span>
                          <span>{po.items_count} line items</span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Expected</span>
                          <span>{format(new Date(po.expected_delivery), 'MMM d, yyyy')}</span>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-muted-foreground">Received</span>
                          <span className="font-medium">{po.total_received_pct}%</span>
                        </div>
                        <Progress value={po.total_received_pct} className="h-2" />
                      </div>

                      <Button
                        className="w-full gap-2"
                        size="sm"
                        onClick={() => openReceiveDialog(po)}
                      >
                        <ClipboardList className="h-4 w-4" />
                        Receive Items
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {mockGRNs.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No GRNs generated"
              description="Goods Received Notes will appear here after you receive items."
            />
          ) : (
            <DataTable
              columns={grnColumns}
              data={mockGRNs as unknown as Record<string, unknown>[]}
              searchPlaceholder="Search GRNs..."
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Receive Items Dialog */}
      <Dialog open={receiveOpen} onOpenChange={setReceiveOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Receive Items - {selectedPO?.order_number}</DialogTitle>
            <DialogDescription>
              Supplier: {selectedPO?.supplier}. Enter quantities received for each line item.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Invoice and Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Supplier Invoice #</Label>
                <Input
                  placeholder="INV-XXXXX"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input
                  placeholder="Receiving notes..."
                  value={receiveNotes}
                  onChange={(e) => setReceiveNotes(e.target.value)}
                />
              </div>
            </div>

            {/* Line Items Table */}
            <div className="rounded-[12px] border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Product</th>
                      <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Ordered</th>
                      <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Received</th>
                      <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Remaining</th>
                      <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Receive Now</th>
                      <th className="px-3 py-2.5 text-center font-medium text-muted-foreground">Reject</th>
                      <th className="px-3 py-2.5 text-left font-medium text-muted-foreground">Batch #</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item, idx) => (
                      <tr key={item.po_item_id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2.5 font-medium">{item.product_name}</td>
                        <td className="px-3 py-2.5 text-center">{item.ordered_qty}</td>
                        <td className="px-3 py-2.5 text-center">{item.received_qty}</td>
                        <td className="px-3 py-2.5 text-center text-amber-400">{item.remaining_qty}</td>
                        <td className="px-3 py-2.5">
                          <Input
                            type="number"
                            min={0}
                            max={item.remaining_qty}
                            className="w-20 mx-auto text-center h-8"
                            value={item.qty_to_receive || ''}
                            onChange={(e) =>
                              updateLineItem(idx, 'qty_to_receive', Number(e.target.value))
                            }
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <Input
                            type="number"
                            min={0}
                            className="w-16 mx-auto text-center h-8"
                            value={item.rejection_qty || ''}
                            onChange={(e) =>
                              updateLineItem(idx, 'rejection_qty', Number(e.target.value))
                            }
                          />
                        </td>
                        <td className="px-3 py-2.5">
                          <Input
                            className="w-24 h-8"
                            placeholder="Batch"
                            value={item.batch_number}
                            onChange={(e) =>
                              updateLineItem(idx, 'batch_number', e.target.value)
                            }
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setReceiveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleReceiveSubmit} disabled={receiveItems.isPending}>
              {receiveItems.isPending ? 'Processing...' : 'Confirm Receipt'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
