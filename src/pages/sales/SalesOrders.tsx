import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Plus, ShoppingCart, Package, Check, X, Truck, CheckCircle2,
  Search, Trash2, ScanLine, CreditCard, Building2, User
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
import { BarcodeScanner } from '@/components/shared/BarcodeScanner';
import type { ScanResult } from '@/services/barcode/types';
import { useSalesOrders, useSalesOrder, useCreateSalesOrder } from '@/hooks/useSalesOrders';
import { useConfirmOrder, useProcessOrder, useShipOrder, useDeliverOrder, useCancelOrder } from '@/hooks/useSalesWorkflow';
import { useInvoice } from '@/hooks/useInvoices';
import { useRecordPayment } from '@/hooks/usePayments';
import { useCustomers } from '@/hooks/useCustomers';
import { useProducts } from '@/hooks/useProducts';
import { useWarehouses } from '@/hooks/useWarehouses';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
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
  useDocumentTitle('Sales Orders & Commercial Fulfillment | DOS-CRM-ERP');
  const { user } = useAuth();
  const userId = user?.id ?? '';
  const [activeTab, setActiveTab] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
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
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleBarcodeScan = (result: ScanResult) => {
    setScannerOpen(false);
    toast.success(`Product barcode scanned: ${result.value}`, {
      description: 'Added to current sales order item list',
    });
  };

  // Data hooks
  const statusFilter = activeTab === 'all' ? undefined : (activeTab as OrderStatus);
  const { data: ordersResult, isLoading } = useSalesOrders({ status: statusFilter });
  const { data: allOrdersResult } = useSalesOrders({});
  const { data: selectedOrder, isLoading: orderLoading } = useSalesOrder(selectedOrderId);
  const { data: invoice } = useInvoice(selectedOrderId);
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

  const orders = useMemo(() => {
    if (Array.isArray(ordersResult)) return ordersResult;
    if (Array.isArray((ordersResult as any)?.data)) return (ordersResult as any).data;
    return [];
  }, [ordersResult]);

  const allOrders = useMemo(() => {
    if (Array.isArray(allOrdersResult)) return allOrdersResult;
    if (Array.isArray((allOrdersResult as any)?.data)) return (allOrdersResult as any).data;
    return [];
  }, [allOrdersResult]);

  const customers = useMemo(() => {
    if (Array.isArray(customersResult)) return customersResult;
    if (Array.isArray((customersResult as any)?.data)) return (customersResult as any).data;
    return [];
  }, [customersResult]);

  const products = useMemo(() => {
    if (Array.isArray(productsResult)) return productsResult;
    if (Array.isArray((productsResult as any)?.data)) return (productsResult as any).data;
    return [];
  }, [productsResult]);

  const warehouses = useMemo(() => {
    if (Array.isArray(warehousesResult)) return warehousesResult;
    if (Array.isArray((warehousesResult as any)?.data)) return (warehousesResult as any).data;
    return [];
  }, [warehousesResult]);

  // Set default customer and warehouse if empty
  useMemo(() => {
    if (!selectedCustomerId && customers.length > 0) {
      setSelectedCustomerId(customers[0].id);
    }
    if (!selectedWarehouseId && warehouses.length > 0) {
      setSelectedWarehouseId(warehouses[0].id);
    }
  }, [customers, warehouses, selectedCustomerId, selectedWarehouseId]);

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
    if (!productSearch) return products.slice(0, 8);
    const lower = productSearch.toLowerCase();
    return products.filter(
      (p: any) => (p.name || '').toLowerCase().includes(lower) || (p.sku || '').toLowerCase().includes(lower)
    ).slice(0, 8);
  }, [products, productSearch]);

  // Order totals calculation (INR ₹)
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

  const addProductToOrder = (product: any) => {
    const existing = orderItems.find((item) => item.product_id === product.id);
    if (existing) {
      setOrderItems(
        orderItems.map((item) =>
          item.product_id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setOrderItems([
        ...orderItems,
        {
          product_id: product.id,
          product_name: product.name,
          quantity: 1,
          unit_price: product.unit_price || 1000,
          discount_percent: 0,
        },
      ]);
    }
    toast.info(`Added ${product.name} to order`);
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
      toast.error('Please select customer, warehouse, and add at least one product');
      return;
    }

    createOrder.mutate(
      {
        order: {
          customer_id: selectedCustomerId,
          warehouse_id: selectedWarehouseId,
          status: 'confirmed',
          total_amount: orderTotals.total,
          tax_amount: orderTotals.tax,
          discount_amount: orderTotals.discount,
          shipping_address: null,
          notes: null,
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
          toast.success('Sales order confirmed and generated successfully!');
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
        onSuccess: () => toast.success('Order shipped, tax invoice generated'),
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
        payment_date: new Date().toISOString(),
        reference_number: paymentRef || undefined,
        received_by: userId,
      },
      {
        onSuccess: () => {
          toast.success('Payment recorded successfully');
          setPaymentDialogOpen(false);
          setPaymentAmount('');
          setPaymentRef('');
        },
        onError: (e) => toast.error(`Payment failed: ${e.message}`),
      }
    );
  };

  const columns = [
    {
      key: 'order_number',
      title: 'Order #',
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span className="font-mono text-xs font-bold text-slate-900">{row.order_number as string}</span>
      ),
    },
    {
      key: 'customer',
      title: 'Customer',
      render: (row: Record<string, unknown>) => {
        const c = (row as any).customers;
        return (
          <div className="flex items-center gap-2">
            <User className="h-3.5 w-3.5 text-purple-600" />
            <span className="font-semibold text-slate-800">{c?.name || c?.contact_person || (row.customer_id as string)?.slice(0, 10) || 'Verified Client'}</span>
          </div>
        );
      },
    },
    {
      key: 'status',
      title: 'Status',
      render: (row: Record<string, unknown>) => {
        const status = row.status as string;
        return (
          <Badge variant={statusVariants[status] || 'secondary'} className="font-bold text-[11px] capitalize">
            {status}
          </Badge>
        );
      },
    },
    {
      key: 'total_amount',
      title: 'Total (INR)',
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span className="font-black text-slate-900">
          ₹{((row.total_amount as number) ?? 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
        </span>
      ),
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <PageHeader
        badge="Commercial Orders"
        title="Sales Orders"
        description="Manage customer sales contracts, warehouse dispatch allocation, and order fulfillment in Indian Rupees (₹)."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setScannerOpen(true)} className="rounded-xl border-slate-200 text-xs font-semibold">
              <ScanLine className="mr-2 h-4 w-4 text-purple-600" /> Barcode Scan
            </Button>
            <Button
              onClick={() => { setDialogOpen(true); resetForm(); }}
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md shadow-purple-600/20"
            >
              <Plus className="mr-2 h-4 w-4" /> Create Sales Order
            </Button>
          </div>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-100 p-1 rounded-2xl">
          <TabsTrigger value="all" className="rounded-xl text-xs font-bold">All ({statusCounts.all || 0})</TabsTrigger>
          <TabsTrigger value="draft" className="rounded-xl text-xs font-bold">Draft ({statusCounts.draft || 0})</TabsTrigger>
          <TabsTrigger value="confirmed" className="rounded-xl text-xs font-bold">Confirmed ({statusCounts.confirmed || 0})</TabsTrigger>
          <TabsTrigger value="processing" className="rounded-xl text-xs font-bold">Processing ({statusCounts.processing || 0})</TabsTrigger>
          <TabsTrigger value="shipped" className="rounded-xl text-xs font-bold">Shipped ({statusCounts.shipped || 0})</TabsTrigger>
          <TabsTrigger value="delivered" className="rounded-xl text-xs font-bold">Delivered ({statusCounts.delivered || 0})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-2xl" />
              ))}
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={orders as unknown as Record<string, unknown>[]}
              searchPlaceholder="Search orders by number or client..."
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
        <SheetContent className="sm:max-w-2xl overflow-y-auto bg-white">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2 text-xl font-extrabold">
              <ShoppingCart className="h-5 w-5 text-purple-600" />
              {selectedOrder?.order_number ?? 'Order Detail'}
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              {selectedOrder
                ? `Created on ${format(new Date(selectedOrder.created_at), 'MMMM d, yyyy')}`
                : ''}
            </SheetDescription>
          </SheetHeader>

          {orderLoading ? (
            <div className="space-y-4 mt-6">
              <Skeleton className="h-20 w-full rounded-2xl" />
              <Skeleton className="h-40 w-full rounded-2xl" />
            </div>
          ) : selectedOrder ? (
            <div className="space-y-6 mt-6">
              {/* Status Stepper */}
              <div className="flex items-center gap-1 bg-slate-50 p-3 rounded-2xl border border-slate-200">
                {statusSteps.map((s, i) => {
                  const isCompleted = i <= currentStepIndex;
                  const isCurrent = i === currentStepIndex;
                  return (
                    <div key={s} className="flex-1 flex items-center gap-1">
                      <div
                        className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-black transition-all ${
                          isCompleted
                            ? 'bg-purple-600 text-white'
                            : 'bg-slate-200 text-slate-500'
                        } ${isCurrent ? 'ring-2 ring-purple-600 ring-offset-2' : ''}`}
                      >
                        {isCompleted ? <Check className="h-3.5 w-3.5" /> : i + 1}
                      </div>
                      <span className="text-[10px] font-bold capitalize hidden sm:inline text-slate-700">
                        {s}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                {selectedOrder.status === 'draft' && (
                  <Button size="sm" onClick={handleConfirmOrder} disabled={confirmOrder.isPending} className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Check className="mr-1 h-3.5 w-3.5" /> Confirm Order
                  </Button>
                )}
                {selectedOrder.status === 'confirmed' && (
                  <>
                    <Button size="sm" onClick={handleProcessOrder} disabled={processOrder.isPending} className="bg-amber-600 hover:bg-amber-700 text-white">
                      <Package className="mr-1 h-3.5 w-3.5" /> Move to Packing
                    </Button>
                    <Button size="sm" variant="destructive" onClick={handleCancelOrder} disabled={cancelOrder.isPending}>
                      <X className="mr-1 h-3.5 w-3.5" /> Cancel Order
                    </Button>
                  </>
                )}
                {selectedOrder.status === 'processing' && (
                  <Button size="sm" onClick={handleShipOrder} disabled={shipOrder.isPending} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                    <Truck className="mr-1 h-3.5 w-3.5" /> Dispatch &amp; Generate Invoice
                  </Button>
                )}
                {selectedOrder.status === 'shipped' && (
                  <Button size="sm" onClick={handleDeliverOrder} disabled={deliverOrder.isPending} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                    <CheckCircle2 className="mr-1 h-3.5 w-3.5" /> Mark Delivered
                  </Button>
                )}
              </div>

              <Separator />

              {/* Order Info Card */}
              <Card className="rounded-2xl border-slate-200 bg-slate-50/50">
                <CardContent className="p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-400 font-medium">Customer</span>
                      <p className="font-bold text-slate-900 text-sm mt-0.5">
                        {(selectedOrder as SalesOrderWithItems & { customers?: { name: string } | null }).customers?.name ?? 'Verified Buyer'}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Order Status</span>
                      <p className="mt-0.5">
                        <Badge variant={statusVariants[selectedOrder.status] || 'secondary'} className="capitalize font-bold">
                          {selectedOrder.status}
                        </Badge>
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">Total Amount (INR)</span>
                      <p className="font-black text-purple-700 text-base mt-0.5">
                        ₹{selectedOrder.total_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 font-medium">GST Tax (18%)</span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">
                        ₹{selectedOrder.tax_amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Line Items Table */}
              {selectedOrder.items && selectedOrder.items.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Ordered Products</h4>
                  <div className="rounded-2xl border border-slate-200 overflow-hidden">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600">
                          <th className="px-3 py-2.5 text-left font-bold">Product Name</th>
                          <th className="px-3 py-2.5 text-right font-bold">Qty</th>
                          <th className="px-3 py-2.5 text-right font-bold">Unit Price</th>
                          <th className="px-3 py-2.5 text-right font-bold">Total (₹)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedOrder.items.map((item) => (
                          <tr key={item.id} className="border-t border-slate-100">
                            <td className="px-3 py-2.5 font-semibold text-slate-900">{item.product_id.slice(0, 8)}...</td>
                            <td className="px-3 py-2.5 text-right font-bold">{item.quantity}</td>
                            <td className="px-3 py-2.5 text-right">₹{item.unit_price.toLocaleString('en-IN')}</td>
                            <td className="px-3 py-2.5 text-right font-bold text-purple-700">₹{item.total_price.toLocaleString('en-IN')}</td>
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
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold uppercase text-slate-400 tracking-wider">Statutory Tax Invoice</h4>
                    <Card className="rounded-2xl border-slate-200">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div>
                          <p className="text-sm font-extrabold text-slate-900">{invoice.invoice_number}</p>
                          <p className="text-xs text-slate-500">
                            Invoice Total: <strong className="text-purple-700">₹{invoice.total_amount.toLocaleString('en-IN')}</strong>
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setPaymentDialogOpen(true)} className="rounded-xl text-xs font-bold">
                          <CreditCard className="mr-1.5 h-3.5 w-3.5" /> Record Payment
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </SheetContent>
      </Sheet>

      {/* NEW: VISUAL 1-SCREEN SALES ORDER CREATOR MODAL */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl rounded-3xl p-6 sm:p-8 bg-white border border-slate-200 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-2xl font-black text-slate-900">
              <ShoppingCart className="h-6 w-6 text-purple-600" /> Create New Sales Order
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Select customer, fulfillment warehouse, and pick products with real-time stock and INR (₹) pricing.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-2">
            {/* Top Config Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5 text-purple-600" /> Customer Account *
                </Label>
                <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                  <SelectTrigger className="bg-white rounded-xl text-xs h-10 border-slate-300">
                    <SelectValue placeholder="Select customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {customers.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name || c.contact_person || c.company_name || 'Client'} {c.company || c.company_name ? `(${c.company || c.company_name})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5 text-purple-600" /> Dispatch Warehouse Hub *
                </Label>
                <Select value={selectedWarehouseId} onValueChange={setSelectedWarehouseId}>
                  <SelectTrigger className="bg-white rounded-xl text-xs h-10 border-slate-300">
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
            </div>

            {/* Product Picker Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Select Products from Catalog
                </Label>
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                  <Input
                    placeholder="Search SKU or name..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="pl-8 h-8 text-xs bg-slate-50 border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              {/* Visual Product Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto p-1">
                {filteredProducts.map((p: any) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between p-3 rounded-2xl bg-white border border-slate-200 hover:border-purple-300 hover:shadow-xs transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                        {p.image ? (
                          <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-purple-400">
                            <Package className="h-4 w-4" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-slate-900 truncate max-w-[140px]">{p.name}</p>
                        <p className="text-[10px] text-purple-700 font-extrabold">₹{(p.unit_price || 1000).toLocaleString('en-IN')}</p>
                      </div>
                    </div>

                    <Button
                      size="sm"
                      onClick={() => addProductToOrder(p)}
                      className="h-7 px-2.5 rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-600 hover:text-white text-xs font-bold"
                    >
                      <Plus className="h-3 w-3 mr-1" /> Add
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Items & Order Summary */}
            {orderItems.length > 0 && (
              <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <Label className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Current Order Items ({orderItems.length})
                </Label>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {orderItems.map((item, index) => (
                    <div
                      key={item.product_id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 gap-3 text-xs"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-slate-900 truncate">{item.product_name}</p>
                        <p className="text-[11px] text-slate-500">Rate: ₹{item.unit_price.toLocaleString('en-IN')}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200">
                          <button
                            type="button"
                            onClick={() => updateOrderItem(index, 'quantity', Math.max(1, item.quantity - 1))}
                            className="h-6 w-6 rounded bg-white font-bold text-xs flex items-center justify-center cursor-pointer"
                          >
                            -
                          </button>
                          <span className="font-extrabold text-xs px-2">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateOrderItem(index, 'quantity', item.quantity + 1)}
                            className="h-6 w-6 rounded bg-white font-bold text-xs flex items-center justify-center cursor-pointer"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-black text-slate-900 w-24 text-right">
                          ₹{(item.quantity * item.unit_price).toLocaleString('en-IN')}
                        </span>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-slate-400 hover:text-red-600"
                          onClick={() => removeOrderItem(index)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Subtotal / GST Calculation */}
                <div className="pt-3 border-t border-slate-200 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Subtotal:</span>
                    <span>₹{orderTotals.subtotal.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>GST (18% Input Tax Credit):</span>
                    <span>₹{orderTotals.tax.toLocaleString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between text-base font-black text-purple-700 pt-1 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span>₹{orderTotals.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="rounded-xl text-xs font-semibold">
              Cancel
            </Button>
            <Button
              onClick={handleCreateOrder}
              disabled={createOrder.isPending || orderItems.length === 0}
              className="rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs px-6 shadow-md shadow-purple-600/25"
            >
              {createOrder.isPending ? 'Generating Order...' : `Confirm Order (₹${orderTotals.total.toLocaleString('en-IN')})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-white border border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Record Customer Payment</DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Record receipt for invoice {invoice?.invoice_number}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2 text-xs">
            <div className="space-y-1.5">
              <Label className="font-bold text-slate-700">Amount (INR ₹) *</Label>
              <Input
                type="number"
                min={0}
                placeholder="₹ Amount received"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="font-bold text-slate-700">Payment Mode</Label>
              <Select value={paymentMethod} onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bank_transfer">NEFT / RTGS Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI / QR Payment</SelectItem>
                  <SelectItem value="credit_card">Corporate Credit Card</SelectItem>
                  <SelectItem value="cheque">Cheque / Demand Draft</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="font-bold text-slate-700">Bank Reference / UTR Number</Label>
              <Input
                placeholder="e.g. UTR-9982018892"
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setPaymentDialogOpen(false)} className="rounded-xl text-xs">Cancel</Button>
            <Button onClick={handleRecordPayment} disabled={recordPayment.isPending || !paymentAmount} className="rounded-xl bg-purple-600 text-white font-bold text-xs">
              Confirm Receipt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner Modal */}
      {scannerOpen && (
        <BarcodeScanner
          open={scannerOpen}
          onOpenChange={setScannerOpen}
          onScan={handleBarcodeScan}
        />
      )}
    </motion.div>
  );
}
