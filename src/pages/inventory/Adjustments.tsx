import { useState } from 'react';
import { motion } from 'motion/react';
import { ClipboardEdit, Plus, Minus, TrendingUp, TrendingDown } from 'lucide-react';
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
import { useCreateAdjustment } from '@/hooks/useAdjustments';
import type { AdjustmentReason } from '@/types/database';

// Mock adjustment history
const mockAdjustments = [
  {
    id: '1',
    date: '2024-12-18T14:00:00Z',
    product: 'Steel Bearings Set',
    warehouse: 'WH-KOL',
    reason: 'damaged',
    quantity: -3,
    user: 'Suresh Das',
  },
  {
    id: '2',
    date: '2024-12-17T10:30:00Z',
    product: 'Thermal Paste TG-7',
    warehouse: 'WH-MUM',
    reason: 'count_correction',
    quantity: 12,
    user: 'Rajesh Kumar',
  },
  {
    id: '3',
    date: '2024-12-16T16:00:00Z',
    product: 'LED Panel 60W',
    warehouse: 'WH-DEL',
    reason: 'expired',
    quantity: -8,
    user: 'Priya Singh',
  },
  {
    id: '4',
    date: '2024-12-15T09:15:00Z',
    product: 'Copper Wire 2.5mm',
    warehouse: 'WH-BLR',
    reason: 'count_correction',
    quantity: 25,
    user: 'Amit Patel',
  },
  {
    id: '5',
    date: '2024-12-14T11:45:00Z',
    product: 'Circuit Board Pro X1',
    warehouse: 'WH-MUM',
    reason: 'quality_reject',
    quantity: -5,
    user: 'Vikram Singh',
  },
  {
    id: '6',
    date: '2024-12-13T08:00:00Z',
    product: 'Hydraulic Pump HP-200',
    warehouse: 'WH-AHM',
    reason: 'sample',
    quantity: -2,
    user: 'Mehul Patel',
  },
  {
    id: '7',
    date: '2024-12-12T15:30:00Z',
    product: 'Office Chair Ergonomic',
    warehouse: 'WH-DEL',
    reason: 'other',
    quantity: 5,
    user: 'Anita Sharma',
  },
];

const reasonLabels: Record<string, string> = {
  damaged: 'Damaged',
  expired: 'Expired',
  theft: 'Theft',
  count_correction: 'Count Correction',
  quality_reject: 'Quality Reject',
  sample: 'Sample',
  other: 'Other',
};

const reasonColors: Record<string, string> = {
  damaged: 'bg-red-500/20 text-red-400',
  expired: 'bg-amber-500/20 text-amber-400',
  theft: 'bg-red-500/20 text-red-400',
  count_correction: 'bg-blue-500/20 text-blue-400',
  quality_reject: 'bg-purple-500/20 text-purple-400',
  sample: 'bg-cyan-500/20 text-cyan-400',
  other: 'bg-zinc-500/20 text-zinc-400',
};

const warehouses = [
  { id: 'wh-mum', name: 'WH-MUM (Mumbai)' },
  { id: 'wh-del', name: 'WH-DEL (Delhi)' },
  { id: 'wh-blr', name: 'WH-BLR (Bangalore)' },
  { id: 'wh-kol', name: 'WH-KOL (Kolkata)' },
  { id: 'wh-ahm', name: 'WH-AHM (Ahmedabad)' },
];

const products = [
  { id: 'p1', name: 'Circuit Board Pro X1', sku: 'CB-X1', current_stock: 145 },
  { id: 'p2', name: 'Industrial Servo Motor', sku: 'ISM-200', current_stock: 32 },
  { id: 'p3', name: 'LED Panel 60W', sku: 'LED-60W', current_stock: 78 },
  { id: 'p4', name: 'Copper Wire 2.5mm', sku: 'CW-2.5', current_stock: 230 },
  { id: 'p5', name: 'Steel Bearings Set', sku: 'SBS-100', current_stock: 56 },
  { id: 'p6', name: 'Thermal Paste TG-7', sku: 'TP-TG7', current_stock: 412 },
  { id: 'p7', name: 'Hydraulic Pump HP-200', sku: 'HP-200', current_stock: 8 },
  { id: 'p8', name: 'Office Chair Ergonomic', sku: 'OCE-100', current_stock: 23 },
];

const adjustmentReasons: AdjustmentReason[] = [
  'damaged',
  'expired',
  'theft',
  'count_correction',
  'quality_reject',
  'sample',
  'other',
];

export default function AdjustmentsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [isLoading] = useState(false);

  // Form state
  const [formWarehouse, setFormWarehouse] = useState('');
  const [formProduct, setFormProduct] = useState('');
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'remove'>('remove');
  const [quantity, setQuantity] = useState('');
  const [reason, setReason] = useState<AdjustmentReason | ''>('');
  const [adjustNotes, setAdjustNotes] = useState('');

  const createAdjustment = useCreateAdjustment();

  const selectedProduct = products.find((p) => p.id === formProduct);

  const filtered = mockAdjustments.filter((a) => {
    if (warehouseFilter !== 'all' && a.warehouse !== warehouseFilter) return false;
    if (reasonFilter !== 'all' && a.reason !== reasonFilter) return false;
    return true;
  });

  const columns = [
    {
      key: 'date',
      title: 'Date',
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span className="text-sm">{format(new Date(row.date as string), 'MMM d, yyyy HH:mm')}</span>
      ),
    },
    { key: 'product', title: 'Product', sortable: true },
    { key: 'warehouse', title: 'Warehouse', sortable: true },
    {
      key: 'reason',
      title: 'Reason',
      render: (row: Record<string, unknown>) => {
        const r = row.reason as string;
        return (
          <Badge className={`${reasonColors[r] || 'bg-zinc-500/20 text-zinc-400'} border-0`}>
            {reasonLabels[r] || r}
          </Badge>
        );
      },
    },
    {
      key: 'quantity',
      title: 'Quantity',
      sortable: true,
      render: (row: Record<string, unknown>) => {
        const qty = row.quantity as number;
        const isPositive = qty > 0;
        return (
          <div className="flex items-center gap-1.5">
            {isPositive ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-red-400" />
            )}
            <span className={`font-medium ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
              {isPositive ? '+' : ''}{qty}
            </span>
          </div>
        );
      },
    },
    { key: 'user', title: 'Adjusted By' },
  ];

  const resetForm = () => {
    setFormWarehouse('');
    setFormProduct('');
    setAdjustmentType('remove');
    setQuantity('');
    setReason('');
    setAdjustNotes('');
  };

  const handleSubmit = () => {
    if (!formWarehouse || !formProduct || !quantity || !reason) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (reason === 'other' && !adjustNotes.trim()) {
      toast.error('Notes are required when reason is "Other"');
      return;
    }

    const qty = Number(quantity);
    const adjustedQty = adjustmentType === 'remove' ? -qty : qty;

    createAdjustment.mutate(
      {
        product_id: formProduct,
        warehouse_id: formWarehouse,
        quantity: adjustedQty,
        reason: reason,
        notes: adjustNotes || undefined,
        created_by: 'current-user-id',
      },
      {
        onSuccess: () => {
          toast.success('Stock adjustment recorded successfully');
          setDialogOpen(false);
          resetForm();
        },
        onError: () => {
          toast.error('Failed to create stock adjustment');
        },
      }
    );
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
        title="Stock Adjustments"
        description="Manage inventory adjustments and track stock corrections"
        actions={
          <Button onClick={() => { resetForm(); setDialogOpen(true); }} className="gap-2">
            <Plus className="h-4 w-4" />
            New Adjustment
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Warehouse" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Warehouses</SelectItem>
            <SelectItem value="WH-MUM">WH-MUM</SelectItem>
            <SelectItem value="WH-DEL">WH-DEL</SelectItem>
            <SelectItem value="WH-BLR">WH-BLR</SelectItem>
            <SelectItem value="WH-KOL">WH-KOL</SelectItem>
            <SelectItem value="WH-AHM">WH-AHM</SelectItem>
          </SelectContent>
        </Select>

        <Select value={reasonFilter} onValueChange={setReasonFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Reason" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Reasons</SelectItem>
            {adjustmentReasons.map((r) => (
              <SelectItem key={r} value={r}>
                {reasonLabels[r]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={ClipboardEdit}
          title="No adjustments found"
          description="No stock adjustments match your current filters. Create a new adjustment to correct inventory levels."
          actionLabel="New Adjustment"
          onAction={() => { resetForm(); setDialogOpen(true); }}
        />
      ) : (
        <DataTable
          columns={columns}
          data={filtered as unknown as Record<string, unknown>[]}
          searchPlaceholder="Search adjustments..."
        />
      )}

      {/* New Adjustment Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Stock Adjustment</DialogTitle>
            <DialogDescription>
              Adjust inventory levels for a product in a specific warehouse.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Warehouse</Label>
              <Select value={formWarehouse} onValueChange={setFormWarehouse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select warehouse" />
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

            <div className="space-y-2">
              <Label>Product</Label>
              <Select value={formProduct} onValueChange={setFormProduct}>
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

            {selectedProduct && (
              <div className="rounded-[12px] bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)] p-4">
                <p className="text-xs text-muted-foreground mb-1">Current Stock</p>
                <p className="text-2xl font-bold text-foreground">{selectedProduct.current_stock}</p>
                <p className="text-xs text-muted-foreground mt-1">{selectedProduct.name}</p>
              </div>
            )}

            <div className="space-y-2">
              <Label>Adjustment Type</Label>
              <div className="flex gap-2">
                <Button
                  variant={adjustmentType === 'add' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => setAdjustmentType('add')}
                >
                  <TrendingUp className="h-4 w-4" />
                  Add Stock
                </Button>
                <Button
                  variant={adjustmentType === 'remove' ? 'default' : 'outline'}
                  size="sm"
                  className="flex-1 gap-2"
                  onClick={() => setAdjustmentType('remove')}
                >
                  <Minus className="h-4 w-4" />
                  Remove Stock
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input
                type="number"
                min={1}
                placeholder="Enter quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={reason} onValueChange={(v) => setReason(v as AdjustmentReason)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select reason" />
                </SelectTrigger>
                <SelectContent>
                  {adjustmentReasons.map((r) => (
                    <SelectItem key={r} value={r}>
                      {reasonLabels[r]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>
                Notes {reason === 'other' && <span className="text-red-400">*</span>}
              </Label>
              <Textarea
                placeholder={reason === 'other' ? 'Notes are required for "Other" reason...' : 'Optional notes...'}
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createAdjustment.isPending}>
              {createAdjustment.isPending ? 'Saving...' : 'Submit Adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
