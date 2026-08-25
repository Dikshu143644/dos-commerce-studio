import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { RotateCcw, Plus, CheckCircle2, X } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter,
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
import { useReturns, useInitiateReturn, useApproveReturn } from '@/hooks/useReturns';
import { useSalesOrders, useSalesOrder } from '@/hooks/useSalesOrders';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useAuth } from '@/hooks/useAuth';
import type { SalesReturn, ReturnCondition, SalesOrderItem } from '@/types/database';

const returnStatusVariants: Record<string, 'default' | 'warning' | 'destructive' | 'info' | 'secondary'> = {
  pending: 'warning',
  approved: 'info',
  completed: 'default',
  rejected: 'destructive',
};

interface ReturnItemForm {
  sales_order_item_id: string;
  product_id: string;
  quantity: number;
  reason: string;
  condition: ReturnCondition;
  max_quantity: number;
}

export default function ReturnsPage() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedReturn, setSelectedReturn] = useState<SalesReturn | null>(null);
  const [selectedOrderId, setSelectedOrderId] = useState('');
  const [returnNotes, setReturnNotes] = useState('');
  const [returnReason, setReturnReason] = useState('customer_request');
  const [returnItems, setReturnItems] = useState<ReturnItemForm[]>([]);
  const [approveWarehouseId, setApproveWarehouseId] = useState('');

  // Data hooks
  const { data: returnsData, isLoading } = useReturns({});
  const { data: deliveredOrders } = useSalesOrders({ status: 'delivered' });
  const { data: selectedOrderDetail } = useSalesOrder(selectedOrderId || undefined);
  const { data: warehousesResult } = useWarehouses({ is_active: true });
  const initiateReturn = useInitiateReturn();
  const approveReturn = useApproveReturn();

  const returns = useMemo<SalesReturn[]>(() => {
    if (Array.isArray(returnsData)) return returnsData as SalesReturn[];
    if (Array.isArray((returnsData as any)?.data)) return (returnsData as any).data as SalesReturn[];
    return [];
  }, [returnsData]);

  const warehouses = useMemo(() => {
    if (Array.isArray(warehousesResult)) return warehousesResult;
    if (Array.isArray((warehousesResult as any)?.data)) return (warehousesResult as any).data;
    return [];
  }, [warehousesResult]);

  const deliveredOrdersList = useMemo(() => {
    if (Array.isArray(deliveredOrders)) return deliveredOrders;
    if (Array.isArray((deliveredOrders as any)?.data)) return (deliveredOrders as any).data;
    return [];
  }, [deliveredOrders]);

  // When order is selected, populate return items
  const handleOrderSelect = (orderId: string) => {
    setSelectedOrderId(orderId);
    setReturnItems([]);
  };

  // Populate items when order detail loads
  useMemo(() => {
    if (selectedOrderDetail?.items && selectedOrderId) {
      const items: ReturnItemForm[] = selectedOrderDetail.items.map((item: SalesOrderItem) => ({
        sales_order_item_id: item.id,
        product_id: item.product_id,
        quantity: 0,
        reason: '',
        condition: 'resellable' as ReturnCondition,
        max_quantity: item.quantity,
      }));
      setReturnItems(items);
    }
  }, [selectedOrderDetail, selectedOrderId]);

  const handleSubmitReturn = () => {
    if (!selectedOrderId || !selectedOrderDetail) return;

    const validItems = returnItems.filter((i) => i.quantity > 0);
    if (validItems.length === 0) {
      toast.error('Please specify at least one item to return');
      return;
    }

    initiateReturn.mutate(
      {
        sales_order_id: selectedOrderId,
        customer_id: selectedOrderDetail.customer_id,
        reason: returnReason,
        notes: returnNotes || undefined,
        items: validItems.map((i) => ({
          sales_order_item_id: i.sales_order_item_id,
          product_id: i.product_id,
          quantity: i.quantity,
          reason: i.reason || undefined,
          condition: i.condition,
        })),
      },
      {
        onSuccess: () => {
          toast.success('Return request created');
          setDialogOpen(false);
          resetForm();
        },
        onError: (e) => toast.error(`Failed: ${e.message}`),
      }
    );
  };

  const handleApproveReturn = () => {
    if (!selectedReturn || !approveWarehouseId) {
      toast.error('Please select a warehouse for stock restoration');
      return;
    }
    approveReturn.mutate(
      {
        return_id: selectedReturn.id,
        approved_by: userId,
        warehouse_id: approveWarehouseId,
      },
      {
        onSuccess: () => {
          toast.success('Return approved, stock restored');
          setSheetOpen(false);
        },
        onError: (e) => toast.error(`Failed: ${e.message}`),
      }
    );
  };

  const resetForm = () => {
    setSelectedOrderId('');
    setReturnNotes('');
    setReturnReason('customer_request');
    setReturnItems([]);
  };

  const updateReturnItem = (index: number, field: keyof ReturnItemForm, value: string | number) => {
    const updated = [...returnItems];
    (updated[index] as unknown as Record<string, unknown>)[field] = value;
    setReturnItems(updated);
  };

  const columns = [
    { key: 'return_number', title: 'Return #', sortable: true },
    {
      key: 'sales_order_id',
      title: 'Order Ref',
      render: (row: Record<string, unknown>) =>
        (row.sales_order_id as string)?.slice(0, 8) ?? '-',
    },
    {
      key: 'customer_id',
      title: 'Customer',
      render: (row: Record<string, unknown>) =>
        (row.customer_id as string)?.slice(0, 8) ?? '-',
    },
    {
      key: 'status',
      title: 'Status',
      render: (row: Record<string, unknown>) => {
        const status = (row.status as string) || 'pending';
        return (
          <Badge variant={returnStatusVariants[status] || 'secondary'}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        );
      },
    },
    {
      key: 'total_refund_amount',
      title: 'Refund Amount',
      sortable: true,
      render: (row: Record<string, unknown>) =>
        `$${((row.total_refund_amount as number) ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'created_at',
      title: 'Date',
      sortable: true,
      render: (row: Record<string, unknown>) =>
        row.created_at ? format(new Date(row.created_at as string), 'MMM d, yyyy') : '-',
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
        title="Returns"
        description="Manage sales returns and stock restoration"
        actions={
          <Button onClick={() => { setDialogOpen(true); resetForm(); }}>
            <Plus className="mr-2 h-4 w-4" /> New Return
          </Button>
        }
      />

      {/* Returns Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full rounded-[12px]" />
          ))}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={returns as unknown as Record<string, unknown>[]}
          searchPlaceholder="Search returns..."
          onRowClick={(row) => {
            setSelectedReturn(row as unknown as SalesReturn);
            setSheetOpen(true);
          }}
        />
      )}

      {/* Return Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" />
              {selectedReturn?.return_number ?? 'Return'}
            </SheetTitle>
            <SheetDescription>
              {selectedReturn?.created_at
                ? `Created ${format(new Date(selectedReturn.created_at), 'MMM d, yyyy')}`
                : ''}
            </SheetDescription>
          </SheetHeader>

          {selectedReturn && (
            <div className="space-y-6 mt-6">
              {/* Return Info */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Status</span>
                      <p>
                        <Badge variant={returnStatusVariants[selectedReturn.status || 'pending'] || 'secondary'}>
                          {(selectedReturn.status || 'pending').charAt(0).toUpperCase() + (selectedReturn.status || 'pending').slice(1)}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Refund Amount</span>
                      <p className="font-medium text-foreground">
                        ${(selectedReturn.total_refund_amount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Reason</span>
                      <p className="font-medium text-foreground capitalize">
                        {(selectedReturn.reason || 'customer_request').replace('_', ' ')}
                      </p>
                    </div>
                    {selectedReturn.notes && (
                      <div>
                        <span className="text-muted-foreground">Notes</span>
                        <p className="text-foreground text-sm">{selectedReturn.notes}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Approve/Reject Actions */}
              {selectedReturn.status === 'pending' && (
                <div className="space-y-3">
                  <Separator />
                  <h4 className="text-sm font-medium text-foreground">Actions</h4>
                  <div className="space-y-2">
                    <Label>Warehouse for Stock Restoration</Label>
                    <Select value={approveWarehouseId} onValueChange={setApproveWarehouseId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select warehouse" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehouses.map((w: any) => (
                          <SelectItem key={w.id} value={w.id}>
                            {w.name} ({w.code})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={handleApproveReturn}
                      disabled={approveReturn.isPending || !approveWarehouseId}
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Approve
                    </Button>
                    <Button size="sm" variant="destructive" disabled>
                      <X className="mr-1 h-3.5 w-3.5" /> Reject
                    </Button>
                  </div>
                  {approveWarehouseId && (
                    <p className="text-xs text-muted-foreground">
                      Approving will restore stock to the selected warehouse.
                    </p>
                  )}
                </div>
              )}

              {selectedReturn.status === 'approved' && (
                <Card className="border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <p className="text-sm text-foreground">
                        Return approved. Stock has been restored to the warehouse.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* New Return Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5 text-primary" /> New Return
            </DialogTitle>
            <DialogDescription>Create a return request for a delivered order</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Select Order */}
            <div className="space-y-2">
              <Label>Delivered Order</Label>
              <Select value={selectedOrderId} onValueChange={handleOrderSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a delivered order" />
                </SelectTrigger>
                <SelectContent>
                  {deliveredOrdersList.map((order: any) => (
                    <SelectItem key={order.id} value={order.id}>
                      {order.order_number} - ${(order.total_amount || 0).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Return Reason */}
            <div className="space-y-2">
              <Label>Reason</Label>
              <Select value={returnReason} onValueChange={setReturnReason}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="damaged">Damaged</SelectItem>
                  <SelectItem value="wrong_item">Wrong Item</SelectItem>
                  <SelectItem value="quality_issue">Quality Issue</SelectItem>
                  <SelectItem value="customer_request">Customer Request</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Return Items */}
            {returnItems.length > 0 && (
              <div className="space-y-3">
                <Label>Items to Return</Label>
                {returnItems.map((item, index) => (
                  <div
                    key={item.sales_order_item_id}
                    className="rounded-[12px] border border-amber-500/20 bg-amber-500/5 p-3 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground font-medium">
                        {item.product_id.slice(0, 8)}...
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Max: {item.max_quantity}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="space-y-1">
                        <Label className="text-xs">Qty</Label>
                        <Input
                          type="number"
                          min={0}
                          max={item.max_quantity}
                          value={item.quantity}
                          onChange={(e) =>
                            updateReturnItem(index, 'quantity', parseInt(e.target.value) || 0)
                          }
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Condition</Label>
                        <Select
                          value={item.condition}
                          onValueChange={(v) => updateReturnItem(index, 'condition', v)}
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="resellable">Resellable</SelectItem>
                            <SelectItem value="damaged">Damaged</SelectItem>
                            <SelectItem value="defective">Defective</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Reason</Label>
                        <Input
                          placeholder="Optional"
                          value={item.reason}
                          onChange={(e) => updateReturnItem(index, 'reason', e.target.value)}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Additional notes..."
                value={returnNotes}
                onChange={(e) => setReturnNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitReturn}
              disabled={initiateReturn.isPending || !selectedOrderId}
            >
              {initiateReturn.isPending ? 'Submitting...' : 'Submit Return'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
