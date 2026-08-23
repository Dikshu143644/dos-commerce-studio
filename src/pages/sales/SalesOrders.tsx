import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Plus, ShoppingCart, Package, Check, X, Truck, CheckCircle2,
  CircleDot, Search, Trash2,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
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
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { useSalesOrders, useSalesOrder, useCreateSalesOrder } from '@/hooks/useSalesOrders';
import { useConfirmOrder, useProcessOrder, useShipOrder, useDeliverOrder, useCancelOrder } from '@/hooks/useSalesWorkflow';
import { useInvoice } from '@/hooks/useInvoices';
import { usePayments, useRecordPayment } from '@/hooks/usePayments';
import { useCustomers } from '@/hooks/useCustomers';
import { useProducts } from '@/hooks/useProducts';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useAuth } from '@/hooks/useAuth';
import type { OrderStatus, PaymentMethod } from '@/types/database';
import type { SalesOrderWithItems } from '@/hooks/useSalesOrders';

const statusVariants: Record<string, 'default' | 'secondary' | 'warning' | 'destructive' | 'info'> = {
  draft: 'secondary',
  confirmed: 'info',
  processing: 'warning',
  shipped: 'info',
  delivered: 'default',
  cancelled: 'destructive',
  returned: 'destructive',
};

const statusSteps: OrderStatus[] = ['draft', 'confirmed', 'processing', 'shipped', 'delivered'];

interface OrderLineItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  discount_percent: number;
}

export default function SalesOrdersPage() {
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const [activeTab, setActiveTab] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [selectedOrderId, setSelectedOrderId] = useState<string | undefined>(undefined);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);

  // New order form state
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState('');
  const [orderItems, setOrderItems] = useState<OrderLineItem[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('bank_transfer');
  const [paymentRef, setPaymentRef] = useState('');

  // Data hooks
  const statusFilter = activeTab === 'all' ? undefined : (activeTab as OrderStatus);
  const { data: ordersResult, isLoading } = useSalesOrders({ status: statusFilter });
  const { data: allOrdersResult } = useSalesOrders({});
  const { data: selectedOrder, isLoading: orderLoading } = useSalesOrder(selectedOrderId);
  const { data: invoice } = useInvoice(selectedOrderId);
  const { data: payments } = usePayments(selectedOrderId);
  const { data: customersResult } = useCustomers({ pageSize: 100 });
  const { data: productsResult } = useProducts({ pageSize: 100, is_active: true });
  const { data: warehousesResult } = useWarehouses({ is_active: true });

  // Mutations
  const createOrder = useCreateSalesOrder();
  const confirmOrder = useConfirmOrder();
  const processOrder = useProcessOrder();
  const shipOrder = useShipOrder();
  const deliverOrder = useDeliverOrder();
  const cancelOrder = useCancelOrder();
  const recordPayment = useRecordPayment();

  const orders = ordersResult?.data ?? [];
  const allOrders = allOrdersResult?.data ?? [];
  const customers = customersResult?.data ?? [];
  const products = productsResult?.data ?? [];
  const warehouses = warehousesResult?.data ?? [];

  // Count per status
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: allOrders.length };
    for (const o of allOrders) {
      counts[o.status] = (counts[o.status] || 0) + 1;
    }
    return counts;
  }, [allOrders]);

  // Filtered products for search
  const filteredProducts = useMemo(() => {
    if (!productSearch) return products.slice(0, 10);
    const lower = productSearch.toLowerCase();
    return products.filter(
      (p) => p.name.toLowerCase().includes(lower) || p.sku.toLowerCase().includes(lower)
    ).slice(0, 10);
  }, [products, productSearch]);

  // Order totals calculation
  const orderTotals = useMemo(() => {
    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price * (1 - item.discount_percent / 100),
      0
    );
    const tax = subtotal * 0.18;
    const discount = orderItems.reduce(
      (sum, item) => sum + item.quantity * item.unit_price * (item.discount_percent / 100),
      0
    );
    return { subtotal, tax, discount, total: subtotal + tax };
  }, [orderItems]);

  const addProductToOrder = (productId: string) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    if (orderItems.find((i) => i.product_id === productId)) {
      toast.error('Product already added');
      return;
    }
    setOrderItems([
      ...orderItems,
      {
        product_id: product.id,
        product_name: product.name,
        quantity: 1,
        unit_price: product.unit_price,
        discount_percent: 0,
      },
    ]);
    setProductSearch('');
  };

  const removeOrderItem = (index: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== index));
  };

  const updateOrderItem = (index: number, field: keyof OrderLineItem, value: number) => {
    const updated = [...orderItems];
    (updated[index] as unknown as Record<string, unknown>)[field] = value;
    setOrderItems(updated);
  };

  const handleCreateOrder = () => {
    if (!selectedCustomerId || !selectedWarehouseId || orderItems.length === 0) {
      toast.error('Please fill all required fields');
      return;
    }

    createOrder.mutate(
      {
        order: {
          customer_id: selectedCustomerId,
          warehouse_id: selectedWarehouseId,
          status: 'draft',
          order_date: new Date().toISOString(),
          total_amount: orderTotals.total,
          tax_amount: orderTotals.tax,
          discount_amount: orderTotals.discount,
          shipping_address: null,
          notes: null,
          created_by: userId,
          shipped_at: null,
          delivered_at: null,
          invoice_id: null,
        },
        items: orderItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          discount_percent: item.discount_percent,
          total_price: item.quantity * item.unit_price * (1 - item.discount_percent / 100),
        })),
      },
      {
        onSuccess: () => {
          toast.success('Sales order created successfully');
          setDialogOpen(false);
          resetForm();
        },
        onError: (error) => {
          toast.error(`Failed to create order: ${error.message}`);
        },
      }
    );
  };

  const resetForm = () => {
    setStep(1);
    setSelectedCustomerId('');
    setSelectedWarehouseId('');
    setOrderItems([]);
    setProductSearch('');
  };

  const handleConfirmOrder = () => {
    if (!selectedOrderId || !selectedOrder?.warehouse_id) return;
    confirmOrder.mutate(
      { order_id: selectedOrderId, confirmed_by: userId },
      {
        onSuccess: () => toast.success('Order confirmed'),
        onError: (e) => toast.error(`Failed: ${e.message}`),
      }
    );
  };

  const handleProcessOrder = () => {
    if (!selectedOrderId) return;
    processOrder.mutate(selectedOrderId, {
      onSuccess: () => toast.success('Order moved to processing'),
      onError: (e) => toast.error(`Failed: ${e.message}`),
    });
  };

  const handleShipOrder = () => {
    if (!selectedOrderId) return;
    shipOrder.mutate(
      { order_id: selectedOrderId, shipped_by: userId },
      {
        onSuccess: () => toast.success('Order shipped, invoice generated'),
        onError: (e) => toast.error(`Failed: ${e.message}`),
      }
    );
  };

  const handleDeliverOrder = () => {
    if (!selectedOrderId) return;
    deliverOrder.mutate(
      { order_id: selectedOrderId, delivered_by: userId },
      {
        onSuccess: () => toast.success('Order marked as delivered'),
        onError: (e) => toast.error(`Failed: ${e.message}`),
      }
    );
  };

  const handleCancelOrder = () => {
    if (!selectedOrderId) return;
    cancelOrder.mutate(
      { order_id: selectedOrderId, cancelled_by: userId, reason: 'Cancelled by user' },
      {
        onSuccess: () => toast.success('Order cancelled'),
        onError: (e) => toast.error(`Failed: ${e.message}`),
      }
    );
  };

  const handleRecordPayment = () => {
    if (!invoice || !paymentAmount) return;
    recordPayment.mutate(
      {
        invoice_id: invoice.id,
        amount: parseFloat(paymentAmount),
        payment_method: paymentMethod,
        reference_number: paymentRef || undefined,
        received_by: userId,
      },
      {
        onSuccess: () => {
          toast.success('Payment recorded');
          setPaymentDialogOpen(false);
          setPaymentAmount('');
          setPaymentRef('');
        },
        onError: (e) => toast.error(`Failed: ${e.message}`),
      }
    );
  };

  const columns = [
    { key: 'order_number', title: 'Order #', sortable: true },
    {
      key: 'customer',
      title: 'Customer',
      sortable: true,
      render: (row: Record<string, unknown>) => {
        const cust = row.customers as { name: string } | null;
        return cust?.name ?? 'Unknown';
      },
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
      key: 'total_amount',
      title: 'Total',
      sortable: true,
      render: (row: Record<string, unknown>) =>
        `$${((row.total_amount as number) ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`,
    },
    {
      key: 'created_at',
      title: 'Created',
      sortable: true,
      render: (row: Record<string, unknown>) =>
        row.created_at ? format(new Date(row.created_at as string), 'MMM d, yyyy') : '-',
    },
  ];

  const currentStepIndex = selectedOrder
    ? statusSteps.indexOf(selectedOrder.status as OrderStatus)
    : -1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Sales Orders"
        description="Manage customer orders and track fulfillment"
        actions={
          <Button onClick={() => { setDialogOpen(true); resetForm(); }}>
            <Plus className="mr-2 h-4 w-4" /> New Order
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({statusCounts.all || 0})</TabsTrigger>
          <TabsTrigger value="draft">Draft ({statusCounts.draft || 0})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({statusCounts.confirmed || 0})</TabsTrigger>
          <TabsTrigger value="processing">Processing ({statusCounts.processing || 0})</TabsTrigger>
          <TabsTrigger value="shipped">Shipped ({statusCounts.shipped || 0})</TabsTrigger>
          <TabsTrigger value="delivered">Delivered ({statusCounts.delivered || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-[12px]" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={orders as unknown as Record<string, unknown>[]}
              searchPlaceholder="Search orders..."
              onRowClick={(row) => {
                setSelectedOrderId(row.id as string);
                setSheetOpen(true);
              }}
            />
          )}
        </TabsContent>
      </Tabs>

      {/* Order Detail Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent className="sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" />
              {selectedOrder?.order_number ?? 'Loading...'}
            </SheetTitle>
            <SheetDescription>
              {selectedOrder
                ? `Created ${format(new Date(selectedOrder.created_at), 'MMM d, yyyy')}`
                : ''}
            </SheetDescription>
          </SheetHeader>

          {orderLoading ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-20 w-full rounded-[12px]" />
              <Skeleton className="h-40 w-full rounded-[12px]" />
            </div>
          ) : selectedOrder ? (
            <div className="space-y-6 mt-6">
              {/* Status Stepper */}
              <div className="flex items-center gap-1">
                {statusSteps.map((s, i) => {
                  const isComplete = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  return (
                    <div key={s} className="flex items-center gap-1 flex-1">
                      <div
                        className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-all ${
                          isComplete
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-muted-foreground'
                        } ${isCurrent ? 'ring-2 ring-primary/30' : ''}`}
                      >
                        {isComplete ? <Check className="h-3.5 w-3.5" /> : i + 1}
                      </div>
                      {i < statusSteps.length - 1 && (
                        <div
                          className={`flex-1 h-0.5 ${
                            i < currentStepIndex ? 'bg-primary' : 'bg-secondary'
                          }`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-muted-foreground px-1">
                {statusSteps.map((s) => (
                  <span key={s} className="capitalize">{s}</span>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {selectedOrder.status === 'draft' && (
                  <>
                    <Button
                      size="sm"
                      onClick={handleConfirmOrder}
                      disabled={confirmOrder.isPending}
                    >
                      <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Confirm Order
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleCancelOrder}
                      disabled={cancelOrder.isPending}
                    >
                      <X className="mr-1 h-3.5 w-3.5" /> Cancel
                    </Button>
                  </>
                )}
                {selectedOrder.status === 'confirmed' && (
                  <>
                    <Button
                      size="sm"
                      onClick={handleProcessOrder}
                      disabled={processOrder.isPending}
                    >
                      <Package className="mr-1 h-3.5 w-3.5" /> Process
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleCancelOrder}
                      disabled={cancelOrder.isPending}
                    >
                      <X className="mr-1 h-3.5 w-3.5" /> Cancel
                    </Button>
                  </>
                )}
                {selectedOrder.status === 'processing' && (
                  <Button
                    size="sm"
                    onClick={handleShipOrder}
                    disabled={shipOrder.isPending}
                  >
                    <Truck className="mr-1 h-3.5 w-3.5" /> Ship Order
                  </Button>
                )}
                {selectedOrder.status === 'shipped' && (
                  <Button
                    size="sm"
                    onClick={handleDeliverOrder}
                    disabled={deliverOrder.isPending}
                  >
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Mark Delivered
                  </Button>
                )}
              </div>

              <Separator />

              {/* Order Info */}
              <Card>
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <span className="text-muted-foreground">Customer</span>
                      <p className="font-medium text-foreground">
                        {(selectedOrder as SalesOrderWithItems & { customers?: { name: string } | null }).customers?.name ?? 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Status</span>
                      <p>
                        <Badge variant={statusVariants[selectedOrder.status] || 'secondary'}>
                          {selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total Amount</span>
                      <p className="font-medium text-primary">
                        ${selectedOrder.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tax</span>
                      <p className="font-medium text-foreground">
                        ${selectedOrder.tax_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Line Items */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Line Items</h4>
                  <div className="rounded-[12px] border border-border overflow-hidden">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-secondary/50">
                          <th className="px-3 py-2 text-left text-xs text-muted-foreground">Product</th>
                          <th className="px-3 py-2 text-right text-xs text-muted-foreground">Qty</th>
                          <th className="px-3 py-2 text-right text-xs text-muted-foreground">Price</th>
                          <th className="px-3 py-2 text-right text-xs text-muted-foreground">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item) => (
                          <tr key={item.id} className="border-t border-border">
                            <td className="px-3 py-2 text-foreground">{item.product_id.slice(0, 8)}...</td>
                            <td className="px-3 py-2 text-right">{item.quantity}</td>
                            <td className="px-3 py-2 text-right">${item.unit_price.toFixed(2)}</td>
                            <td className="px-3 py-2 text-right">${item.total_price.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Invoice Section */}
              {invoice && (
                <>
                  <Separator />
                  <div>
                    <h4 className="text-sm font-medium text-foreground mb-2">Invoice</h4>
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">{invoice.invoice_number}</p>
                            <p className="text-xs text-muted-foreground">
                              Total: ${invoice.total_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                          <Badge
                            variant={
                              invoice.payment_status === 'paid'
                                ? 'default'
                                : invoice.payment_status === 'partial'
                                  ? 'warning'
                                  : 'destructive'
                            }
                          >
                            {invoice.payment_status}
                          </Badge>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setPaymentDialogOpen(true)}
                          >
                            Record Payment
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}

              {/* Payment History */}
              {payments && payments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-foreground mb-2">Payment History</h4>
                  <div className="space-y-2">
                    {payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between rounded-[12px] bg-secondary/30 p-3"
                      >
                        <div>
                          <p className="text-sm text-foreground">
                            ${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {payment.payment_method} - {format(new Date(payment.payment_date), 'MMM d, yyyy')}
                          </p>
                        </div>
                        {payment.reference_number && (
                          <span className="text-xs text-muted-foreground">
                            Ref: {payment.reference_number}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* New Order Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" /> New Sales Order
            </DialogTitle>
            <DialogDescription>
              Step {step} of 5:{' '}
              {step === 1
                ? 'Select Customer'
                : step === 2
                  ? 'Select Warehouse'
                  : step === 3
                    ? 'Add Products'
                    : step === 4
                      ? 'Review'
                      : 'Confirm'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className={`h-2 w-10 rounded-full transition-all ${
                  s <= step ? 'bg-primary' : 'bg-secondary'
                }`}
              />
            ))}
          </div>

          {/* Step 1: Select Customer */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Select Warehouse */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Warehouse</Label>
                <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select warehouse" />
                  </SelectTrigger>
                  <SelectContent>
                    {warehouses.map((w) => (
                      <SelectItem key={w.id} value={w.id}>
                        {w.name} ({w.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 3: Add Products */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search products..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              {productSearch && (
                <div className="max-h-32 overflow-y-auto rounded-[12px] border border-border">
                  {filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-secondary/50 text-left"
                      onClick={() => addProductToOrder(p.id)}
                    >
                      <span className="text-foreground">{p.name}</span>
                      <span className="text-muted-foreground">${p.unit_price.toFixed(2)}</span>
                    </button>
                  ))}
                </div>
              )}

              {orderItems.length > 0 && (
                <div className="space-y-2">
                  {orderItems.map((item, index) => (
                    <div
                      key={item.product_id}
                      className="rounded-[12px] border border-border p-3"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-foreground">
                          {item.product_name}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => removeOrderItem(index)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Qty</Label>
                          <Input
                            type="number"
                            min={1}
                            value={item.quantity}
                            onChange={(e) =>
                              updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Price</Label>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.unit_price}
                            onChange={(e) =>
                              updateOrderItem(index, 'unit_price', parseFloat(e.target.value) || 0)
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-xs">Disc %</Label>
                          <Input
                            type="number"
                            min={0}
                            max={100}
                            value={item.discount_percent}
                            onChange={(e) =>
                              updateOrderItem(
                                index,
                                'discount_percent',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Review */}
          {step === 4 && (
            <div className="rounded-[12px] bg-secondary/30 p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer</span>
                <span className="text-foreground">
                  {customers.find((c) => c.id === selectedCustomerId)?.name ?? '-'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Warehouse</span>
                <span className="text-foreground">
                  {warehouses.find((w) => w.id === selectedWarehouseId)?.name ?? '-'}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span className="text-foreground">{orderItems.length} items</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-foreground">${orderTotals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax (18%)</span>
                <span className="text-foreground">${orderTotals.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="text-foreground">-${orderTotals.discount.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm font-bold">
                <span className="text-foreground">Grand Total</span>
                <span className="text-primary">${orderTotals.total.toFixed(2)}</span>
              </div>
            </div>
          )}

          {/* Step 5: Confirm */}
          {step === 5 && (
            <div className="text-center space-y-4 py-4">
              <div className="flex h-16 w-16 mx-auto items-center justify-center rounded-full bg-primary/10">
                <CircleDot className="h-8 w-8 text-primary" />
              </div>
              <div>
                <p className="text-foreground font-medium">Ready to Create</p>
                <p className="text-sm text-muted-foreground">
                  This will create a draft sales order for ${orderTotals.total.toFixed(2)}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            {step < 5 ? (
              <Button
                onClick={() => setStep(step + 1)}
                disabled={
                  (step === 1 && !selectedCustomerId) ||
                  (step === 2 && !selectedWarehouseId) ||
                  (step === 3 && orderItems.length === 0)
                }
              >
                Next
              </Button>
            ) : (
              <Button onClick={handleCreateOrder} disabled={createOrder.isPending}>
                {createOrder.isPending ? 'Creating...' : 'Create Order'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Payment</DialogTitle>
            <DialogDescription>
              Record a payment for invoice {invoice?.invoice_number}
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
              {invoice && (
                <p className="text-xs text-muted-foreground">
                  Outstanding: ${(invoice.total_amount - invoice.amount_paid).toFixed(2)}
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
