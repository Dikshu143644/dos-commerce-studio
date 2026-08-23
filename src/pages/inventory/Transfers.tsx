import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowRightLeft,
  Plus,
  Check,
  X,
  Clock,
  Truck,
  Package,
  Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { useCreateTransfer, useApproveTransfer, useRejectTransfer } from '@/hooks/useTransfers';
import type { TransferStatus } from '@/types/database';

// Mock data
const mockTransfers = [
  {
    id: '1',
    transfer_number: 'TRF-0001',
    source_warehouse: 'WH-MUM (Mumbai)',
    destination_warehouse: 'WH-DEL (Delhi)',
    status: 'completed' as TransferStatus,
    requested_date: '2024-12-10T09:00:00Z',
    items_count: 3,
    requested_by: 'Rajesh Kumar',
  },
  {
    id: '2',
    transfer_number: 'TRF-0002',
    source_warehouse: 'WH-BLR (Bangalore)',
    destination_warehouse: 'WH-KOL (Kolkata)',
    status: 'in_transit' as TransferStatus,
    requested_date: '2024-12-15T11:30:00Z',
    items_count: 5,
    requested_by: 'Priya Singh',
  },
  {
    id: '3',
    transfer_number: 'TRF-0003',
    source_warehouse: 'WH-DEL (Delhi)',
    destination_warehouse: 'WH-MUM (Mumbai)',
    status: 'pending' as TransferStatus,
    requested_date: '2024-12-17T14:00:00Z',
    items_count: 2,
    requested_by: 'Amit Patel',
  },
  {
    id: '4',
    transfer_number: 'TRF-0004',
    source_warehouse: 'WH-MUM (Mumbai)',
    destination_warehouse: 'WH-AHM (Ahmedabad)',
    status: 'approved' as TransferStatus,
    requested_date: '2024-12-18T08:00:00Z',
    items_count: 4,
    requested_by: 'Suresh Das',
  },
  {
    id: '5',
    transfer_number: 'TRF-0005',
    source_warehouse: 'WH-KOL (Kolkata)',
    destination_warehouse: 'WH-BLR (Bangalore)',
    status: 'rejected' as TransferStatus,
    requested_date: '2024-12-16T10:00:00Z',
    items_count: 1,
    requested_by: 'Vikram Singh',
  },
];

const mockTransferDetail = {
  id: '3',
  transfer_number: 'TRF-0003',
  source_warehouse: 'WH-DEL (Delhi)',
  destination_warehouse: 'WH-MUM (Mumbai)',
  status: 'pending' as TransferStatus,
  requested_by: 'Amit Patel',
  created_at: '2024-12-17T14:00:00Z',
  notes: 'Urgent stock replenishment required for Mumbai warehouse.',
  items: [
    { id: '1', product: 'Circuit Board Pro X1', requested_quantity: 50, transferred_quantity: 0 },
    { id: '2', product: 'LED Panel 60W', requested_quantity: 25, transferred_quantity: 0 },
  ],
  timeline: [
    { status: 'pending', date: '2024-12-17T14:00:00Z', user: 'Amit Patel', note: 'Transfer requested' },
  ],
};

const warehouses = [
  { id: 'wh-mum', name: 'WH-MUM (Mumbai)' },
  { id: 'wh-del', name: 'WH-DEL (Delhi)' },
  { id: 'wh-blr', name: 'WH-BLR (Bangalore)' },
  { id: 'wh-kol', name: 'WH-KOL (Kolkata)' },
  { id: 'wh-ahm', name: 'WH-AHM (Ahmedabad)' },
];

const products = [
  { id: 'p1', name: 'Circuit Board Pro X1', sku: 'CB-X1' },
  { id: 'p2', name: 'Industrial Servo Motor', sku: 'ISM-200' },
  { id: 'p3', name: 'LED Panel 60W', sku: 'LED-60W' },
  { id: 'p4', name: 'Copper Wire 2.5mm', sku: 'CW-2.5' },
  { id: 'p5', name: 'Steel Bearings Set', sku: 'SBS-100' },
  { id: 'p6', name: 'Thermal Paste TG-7', sku: 'TP-TG7' },
];

const statusConfig: Record<TransferStatus, { color: string; label: string }> = {
  pending: { color: 'bg-amber-500/20 text-amber-400', label: 'Pending' },
  approved: { color: 'bg-blue-500/20 text-blue-400', label: 'Approved' },
  in_transit: { color: 'bg-purple-500/20 text-purple-400', label: 'In Transit' },
  completed: { color: 'bg-emerald-500/20 text-emerald-400', label: 'Completed' },
  rejected: { color: 'bg-red-500/20 text-red-400', label: 'Rejected' },
};

const statusSteps: TransferStatus[] = ['pending', 'approved', 'in_transit', 'completed'];

interface TransferItem {
  product_id: string;
  product_name: string;
  quantity: number;
}

export default function TransfersPage() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [createOpen, setCreateOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [isLoading] = useState(false);

  // Form state
  const [sourceWarehouse, setSourceWarehouse] = useState('');
  const [destWarehouse, setDestWarehouse] = useState('');
  const [transferItems, setTransferItems] = useState<TransferItem[]>([]);
  const [notes, setNotes] = useState('');
  const [selectedProduct, setSelectedProduct] = useState('');
  const [itemQty, setItemQty] = useState('');

  // Mutations
  const createTransfer = useCreateTransfer();
  const approveTransfer = useApproveTransfer();
  const rejectTransfer = useRejectTransfer();

  const filtered = mockTransfers.filter((t) => {
    if (statusFilter !== 'all' && t.status !== statusFilter) return false;
    return true;
  });

  const columns = [
    {
      key: 'transfer_number',
      title: 'Transfer #',
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span className="font-medium text-primary">{row.transfer_number as string}</span>
      ),
    },
    { key: 'source_warehouse', title: 'Source', sortable: true },
    { key: 'destination_warehouse', title: 'Destination', sortable: true },
    {
      key: 'status',
      title: 'Status',
      render: (row: Record<string, unknown>) => {
        const status = row.status as TransferStatus;
        const config = statusConfig[status];
        return (
          <Badge className={`${config.color} border-0`}>{config.label}</Badge>
        );
      },
    },
    {
      key: 'requested_date',
      title: 'Requested Date',
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span className="text-sm">
          {format(new Date(row.requested_date as string), 'MMM d, yyyy')}
        </span>
      ),
    },
    {
      key: 'items_count',
      title: 'Items',
      render: (row: Record<string, unknown>) => (
        <span className="text-sm">{row.items_count as number} items</span>
      ),
    },
    { key: 'requested_by', title: 'Requested By' },
  ];

  const resetForm = () => {
    setStep(1);
    setSourceWarehouse('');
    setDestWarehouse('');
    setTransferItems([]);
    setNotes('');
    setSelectedProduct('');
    setItemQty('');
  };

  const handleCreateOpen = () => {
    resetForm();
    setCreateOpen(true);
  };

  const addItem = () => {
    if (!selectedProduct || !itemQty || Number(itemQty) <= 0) return;
    const product = products.find((p) => p.id === selectedProduct);
    if (!product) return;
    if (transferItems.some((i) => i.product_id === selectedProduct)) {
      toast.error('Product already added');
      return;
    }
    setTransferItems([
      ...transferItems,
      { product_id: product.id, product_name: product.name, quantity: Number(itemQty) },
    ]);
    setSelectedProduct('');
    setItemQty('');
  };

  const removeItem = (productId: string) => {
    setTransferItems(transferItems.filter((i) => i.product_id !== productId));
  };

  const handleSubmitTransfer = () => {
    createTransfer.mutate(
      {
        source_warehouse_id: sourceWarehouse,
        destination_warehouse_id: destWarehouse,
        requested_by: 'current-user-id',
        notes: notes || undefined,
        items: transferItems.map((i) => ({
          product_id: i.product_id,
          requested_quantity: i.quantity,
        })),
      },
      {
        onSuccess: () => {
          toast.success('Transfer request created successfully');
          setCreateOpen(false);
          resetForm();
        },
        onError: () => {
          toast.error('Failed to create transfer request');
        },
      }
    );
  };

  const handleApprove = () => {
    approveTransfer.mutate(
      { transfer_id: mockTransferDetail.id, approved_by: 'current-user-id' },
      {
        onSuccess: () => {
          toast.success('Transfer approved successfully');
          setDetailOpen(false);
        },
        onError: () => {
          toast.error('Failed to approve transfer');
        },
      }
    );
  };

  const handleReject = () => {
    rejectTransfer.mutate(
      {
        transfer_id: mockTransferDetail.id,
        rejected_by: 'current-user-id',
        rejection_reason: 'Insufficient stock at source warehouse',
      },
      {
        onSuccess: () => {
          toast.success('Transfer rejected');
          setDetailOpen(false);
        },
        onError: () => {
          toast.error('Failed to reject transfer');
        },
      }
    );
  };

  const getStatusStepIndex = (status: TransferStatus) => {
    const idx = statusSteps.indexOf(status);
    return idx >= 0 ? idx : 0;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-5 w-72" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
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
        title="Transfers"
        description="Manage stock transfers between warehouses"
        actions={
          <Button onClick={handleCreateOpen} className="gap-2">
            <Plus className="h-4 w-4" />
            New Transfer
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="in_transit">In Transit</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ArrowRightLeft}
          title="No transfers found"
          description="No stock transfers match your current filters. Create a new transfer to move inventory between warehouses."
          actionLabel="New Transfer"
          onAction={handleCreateOpen}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered as unknown as Record<string, unknown>[]}
          searchPlaceholder="Search transfers..."
          onRowClick={() => setDetailOpen(true)}
        />
      )}

      {/* Create Transfer Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New Transfer Request</DialogTitle>
            <DialogDescription>
              Step {step} of 4 - {step === 1 ? 'Source Warehouse' : step === 2 ? 'Destination Warehouse' : step === 3 ? 'Add Products' : 'Review & Submit'}
            </DialogDescription>
          </DialogHeader>

          {/* Stepper */}
          <div className="flex items-center gap-2 mb-4">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className="flex-1 flex items-center gap-2">
                <div
                  className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    s <= step ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                  }`}
                >
                  {s}
                </div>
                {s < 4 && <div className={`flex-1 h-0.5 ${s < step ? 'bg-primary' : 'bg-secondary'}`} />}
              </div>
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Source Warehouse</Label>
                <Select value={sourceWarehouse} onValueChange={setSourceWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select source warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((wh) => (
                      <SelectItem key={wh.id} value={wh.id}>
                        {wh.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Destination Warehouse</Label>
                <Select value={destWarehouse} onValueChange={setDestWarehouse}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select destination warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses
                      .filter((wh) => wh.id !== sourceWarehouse)
                      .map((wh) => (
                        <SelectItem key={wh.id} value={wh.id}>
                          {wh.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select product" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} ({p.sku})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Input
                  type="number"
                  placeholder="Qty"
                  className="w-24"
                  value={itemQty}
                  onChange={(e) => setItemQty(e.target.value)}
                  min={1}
                />
                <Button variant="outline" size="icon" onClick={addItem}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {transferItems.length > 0 && (
                <div className="rounded-[12px] border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-secondary/50">
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Product</th>
                        <th className="px-3 py-2 text-left font-medium text-muted-foreground">Qty</th>
                        <th className="px-3 py-2 w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {transferItems.map((item) => (
                        <tr key={item.product_id} className="border-b border-border last:border-0">
                          <td className="px-3 py-2">{item.product_name}</td>
                          <td className="px-3 py-2">{item.quantity}</td>
                          <td className="px-3 py-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => removeItem(item.product_id)}
                            >
                              <Trash2 className="h-3.5 w-3.5 text-red-400" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Notes (optional)</Label>
                <Textarea
                  placeholder="Add any notes for this transfer..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>
              <div className="rounded-[12px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-4 space-y-2">
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">From:</span>{' '}
                  {warehouses.find((w) => w.id === sourceWarehouse)?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">To:</span>{' '}
                  {warehouses.find((w) => w.id === destWarehouse)?.name}
                </p>
                <p className="text-sm text-muted-foreground">
                  <span className="font-medium text-foreground">Items:</span>{' '}
                  {transferItems.length} product(s)
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < 4 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !sourceWarehouse) ||
                  (step === 2 && !destWarehouse) ||
                  (step === 3 && transferItems.length === 0)
                }
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleSubmitTransfer} disabled={createTransfer.isPending}>
                {createTransfer.isPending ? 'Creating...' : 'Submit Transfer'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {mockTransferDetail.transfer_number}
              <Badge className={`${statusConfig[mockTransferDetail.status].color} border-0`}>
                {statusConfig[mockTransferDetail.status].label}
              </Badge>
            </DialogTitle>
            <DialogDescription>
              Created on {format(new Date(mockTransferDetail.created_at), 'MMM d, yyyy HH:mm')} by {mockTransferDetail.requested_by}
            </DialogDescription>
          </DialogHeader>

          {/* Status Flow */}
          <div className="flex items-center gap-1 py-4">
            {statusSteps.map((s, idx) => {
              const currentIdx = getStatusStepIndex(mockTransferDetail.status);
              const isActive = idx <= currentIdx;
              const IconMap: Record<string, typeof Clock> = { pending: Clock, approved: Check, in_transit: Truck, completed: Package };
              const Icon = IconMap[s];
              return (
                <div key={s} className="flex-1 flex items-center gap-1">
                  <div
                    className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  {idx < statusSteps.length - 1 && (
                    <div className={`flex-1 h-0.5 ${idx < currentIdx ? 'bg-primary' : 'bg-secondary'}`} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Transfer Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="rounded-[12px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-4">
              <p className="text-xs text-muted-foreground mb-1">Source Warehouse</p>
              <p className="text-sm font-medium">{mockTransferDetail.source_warehouse}</p>
            </div>
            <div className="rounded-[12px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-4">
              <p className="text-xs text-muted-foreground mb-1">Destination Warehouse</p>
              <p className="text-sm font-medium">{mockTransferDetail.destination_warehouse}</p>
            </div>
          </div>

          {mockTransferDetail.notes && (
            <div className="rounded-[12px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-4">
              <p className="text-xs text-muted-foreground mb-1">Notes</p>
              <p className="text-sm">{mockTransferDetail.notes}</p>
            </div>
          )}

          {/* Items Table */}
          <div className="rounded-[12px] border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Requested Qty</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Transferred Qty</th>
                </tr>
              </thead>
              <tbody>
                {mockTransferDetail.items.map((item) => (
                  <tr key={item.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">{item.product}</td>
                    <td className="px-4 py-3">{item.requested_quantity}</td>
                    <td className="px-4 py-3">{item.transferred_quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Timeline */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-muted-foreground">Timeline</h4>
            <div className="space-y-3">
              {mockTransferDetail.timeline.map((event, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary mt-2 shrink-0" />
                  <div>
                    <p className="text-sm font-medium">{event.note}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(event.date), 'MMM d, yyyy HH:mm')} - {event.user}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Approval Actions */}
          {mockTransferDetail.status === 'pending' && (
            <DialogFooter className="gap-2">
              <Button
                variant="outline"
                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={handleReject}
                disabled={rejectTransfer.isPending}
              >
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
              <Button onClick={handleApprove} disabled={approveTransfer.isPending}>
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
