import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import { Plus, FileText, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { usePurchaseOrders, useCreatePurchaseOrder } from '@/hooks/usePurchaseOrders';
import { useSuppliers } from '@/hooks/useSuppliers';
import { useProducts } from '@/hooks/useProducts';

const statusVariants: Record<string, 'default' | 'secondary' | 'warning' | 'destructive' | 'info'> = {
  draft: 'secondary',
  sent: 'info',
  confirmed: 'default',
  partially_received: 'warning',
  received: 'default',
  cancelled: 'destructive',
};

interface POLineItem {
  product_id: string;
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
}

export default function PurchaseOrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState(1);

  // Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [expectedDelivery, setExpectedDelivery] = useState('');
  const [notes, setNotes] = useState('');
  const [lineItems, setLineItems] = useState<POLineItem[]>([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [itemPrice, setItemPrice] = useState(0);

  // Queries & Mutations
  const { data: poResponse } = usePurchaseOrders();
  const { data: suppliersResponse } = useSuppliers({ pageSize: 100 });
  const { data: productsResponse } = useProducts({ pageSize: 100 });
  const createPO = useCreatePurchaseOrder();

  const purchaseOrders = useMemo(() => {
    if (Array.isArray(poResponse)) return poResponse;
    if (Array.isArray((poResponse as any)?.data)) return (poResponse as any).data;
    return [];
  }, [poResponse]);

  const suppliers = useMemo(() => {
    if (Array.isArray(suppliersResponse)) return suppliersResponse;
    if (Array.isArray((suppliersResponse as any)?.data)) return (suppliersResponse as any).data;
    return [];
  }, [suppliersResponse]);

  const products = useMemo(() => {
    if (Array.isArray(productsResponse)) return productsResponse;
    if (Array.isArray((productsResponse as any)?.data)) return (productsResponse as any).data;
    return [];
  }, [productsResponse]);

  const filteredPOs = useMemo(() => {
    if (activeTab === 'all') return purchaseOrders;
    return purchaseOrders.filter((po: any) => po.status === activeTab);
  }, [purchaseOrders, activeTab]);

  const selectedSupplier = suppliers.find((s: any) => s.id === selectedSupplierId);

  const handleProductSelect = (productId: string) => {
    setSelectedProductId(productId);
    const prod = products.find((p: any) => p.id === productId);
    if (prod) {
      setItemPrice(prod.cost_price || prod.unit_price || 0);
    }
  };

  const handleAddItem = () => {
    if (!selectedProductId) {
      toast.error('Please select a product');
      return;
    }
    if (itemQty <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }
    const prod = products.find((p: any) => p.id === selectedProductId);
    if (!prod) return;

    const existingIndex = lineItems.findIndex((i) => i.product_id === selectedProductId);
    if (existingIndex >= 0) {
      const updated = [...lineItems];
      updated[existingIndex].quantity += itemQty;
      updated[existingIndex].unit_price = itemPrice;
      setLineItems(updated);
    } else {
      setLineItems([
        ...lineItems,
        {
          product_id: prod.id,
          product_name: prod.name,
          sku: prod.sku,
          quantity: itemQty,
          unit_price: itemPrice,
        },
      ]);
    }

    setSelectedProductId('');
    setItemQty(1);
    setItemPrice(0);
  };

  const handleRemoveItem = (index: number) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const totalAmount = lineItems.reduce((acc, item) => acc + item.quantity * item.unit_price, 0);

  const resetForm = () => {
    setSelectedSupplierId('');
    setExpectedDelivery('');
    setNotes('');
    setLineItems([]);
    setStep(1);
  };

  const handleSubmitPO = () => {
    if (!selectedSupplierId) {
      toast.error('Please select a supplier');
      return;
    }
    if (lineItems.length === 0) {
      toast.error('Please add at least one line item');
      return;
    }

    createPO.mutate(
      {
        order: {
          supplier_id: selectedSupplierId,
          status: 'confirmed',
          total_amount: totalAmount,
          expected_delivery: expectedDelivery || null,
          notes: notes || null,
        },
        items: lineItems.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      },
      {
        onSuccess: () => {
          toast.success('Purchase order created successfully!');
          setDialogOpen(false);
          resetForm();
        },
        onError: (err: any) => {
          toast.error(`Failed to create PO: ${err.message}`);
        },
      }
    );
  };

  const columns = [
    { key: 'po_number', title: 'PO #', sortable: true },
    {
      key: 'supplier',
      title: 'Supplier',
      sortable: true,
      render: (row: Record<string, unknown>) => {
        const supp = (row.supplier as { name?: string; company_name?: string }) || (row.suppliers as { name?: string; company_name?: string });
        return <span className="font-semibold text-slate-800">{supp?.company_name || supp?.name || 'Vendor'}</span>;
      },
    },
    {
      key: 'status',
      title: 'Status',
      render: (row: Record<string, unknown>) => {
        const status = (row.status as string) || 'draft';
        return (
          <Badge variant={statusVariants[status] || 'secondary'} className="capitalize">
            {status.replace(/_/g, ' ')}
          </Badge>
        );
      },
    },
    {
      key: 'total_amount',
      title: 'Total Value',
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span className="font-mono font-bold text-slate-900">
          ${((row.total_amount as number) ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      key: 'expected_delivery',
      title: 'Expected Delivery',
      sortable: true,
      render: (row: Record<string, unknown>) =>
        row.expected_delivery ? format(new Date(row.expected_delivery as string), 'MMM d, yyyy') : '-',
    },
    {
      key: 'created_at',
      title: 'Date Created',
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
        title="Purchase Orders"
        description="Create, track, and manage replenishment purchase orders with verified suppliers"
        actions={
          <Button onClick={() => { setDialogOpen(true); resetForm(); }} className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-xs">
            <Plus className="mr-2 h-4 w-4" /> Create PO
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-white border border-slate-200 p-1 rounded-xl">
          <TabsTrigger value="all">All Orders ({purchaseOrders.length})</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="received">Received</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <DataTable
            columns={columns}
            data={filteredPOs as unknown as Record<string, unknown>[]}
            searchPlaceholder="Search purchase orders..."
          />
        </TabsContent>
      </Tabs>

      {/* Create PO Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-slate-900">
              <FileText className="h-5 w-5 text-orange-500" /> Create Purchase Order
            </DialogTitle>
            <DialogDescription>
              Step {step} of 3: {step === 1 ? 'Select Supplier' : step === 2 ? 'Add Order Items' : 'Review & Confirm PO'}
            </DialogDescription>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`h-2 flex-1 rounded-full transition-all ${
                  s <= step ? 'bg-orange-500' : 'bg-slate-100'
                }`}
              />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label className="text-slate-700 font-bold">Supplier *</Label>
                <Select value={selectedSupplierId} onValueChange={setSelectedSupplierId}>
                  <SelectTrigger className="rounded-xl border-slate-200">
                    <SelectValue placeholder="Select supplier vendor" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60 rounded-xl">
                    {suppliers.map((s: any) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.company_name || s.name} &middot; {s.contact_name || s.contact_person || 'Contact'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-bold">Expected Delivery Date</Label>
                <Input
                  type="date"
                  value={expectedDelivery}
                  onChange={(e) => setExpectedDelivery(e.target.value)}
                  className="rounded-xl border-slate-200"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-slate-700 font-bold">Order Notes / Terms</Label>
                <Input
                  placeholder="e.g. Standard Net 30 terms, urgent priority shipment"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="rounded-xl border-slate-200"
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 pt-2">
              <div className="rounded-[16px] bg-slate-50/80 border border-slate-200 p-4 space-y-3">
                <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Add Line Item</p>
                <div className="space-y-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-slate-600">Select Product Catalog SKU</Label>
                    <Select value={selectedProductId} onValueChange={handleProductSelect}>
                      <SelectTrigger className="rounded-xl border-slate-200 bg-white">
                        <SelectValue placeholder="Choose SKU from catalog" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60 rounded-xl">
                        {products.map((p: any) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name} ({p.sku}) &middot; ${p.cost_price || p.unit_price}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600">Quantity (Units)</Label>
                      <Input
                        type="number"
                        min="1"
                        value={itemQty}
                        onChange={(e) => setItemQty(parseInt(e.target.value) || 1)}
                        className="rounded-xl border-slate-200 bg-white text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-slate-600">Unit Price ($)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={itemPrice}
                        onChange={(e) => setItemPrice(parseFloat(e.target.value) || 0)}
                        className="rounded-xl border-slate-200 bg-white text-xs"
                      />
                    </div>
                  </div>
                  <Button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold"
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> Add Item to PO
                  </Button>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {lineItems.length === 0 ? (
                  <div className="text-xs text-slate-400 text-center py-6 border border-dashed border-slate-200 rounded-xl">
                    No items added yet. Choose a product and click 'Add Item'.
                  </div>
                ) : (
                  lineItems.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 rounded-xl bg-white border border-slate-200 shadow-2xs"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900">{item.product_name}</p>
                        <p className="text-[11px] text-slate-500 font-mono">
                          {item.sku} &middot; {item.quantity} pcs &times; ${item.unit_price}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-xs text-slate-900">
                          ${(item.quantity * item.unit_price).toFixed(2)}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveItem(idx)}
                          className="h-7 w-7 p-0 text-slate-400 hover:text-rose-500"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4 pt-2">
              <div className="rounded-[18px] bg-slate-50 border border-slate-200 p-4 space-y-3">
                <div className="flex justify-between text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Selected Supplier:</span>
                  <span className="font-bold text-slate-900">
                    {selectedSupplier?.company_name || selectedSupplier?.name || 'Vendor'}
                  </span>
                </div>
                <div className="flex justify-between text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Expected Delivery:</span>
                  <span className="font-bold text-slate-900">{expectedDelivery || 'Immediate'}</span>
                </div>
                <div className="flex justify-between text-xs pb-2 border-b border-slate-200">
                  <span className="text-slate-500">Line Items Count:</span>
                  <span className="font-bold text-slate-900">{lineItems.length} items</span>
                </div>
                <div className="flex justify-between text-sm font-black pt-1 text-slate-900">
                  <span>Grand Total PO Value:</span>
                  <span className="text-orange-600 font-mono">${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
              </div>

              {notes && (
                <div className="p-3 rounded-xl bg-orange-50/50 border border-orange-200/60 text-xs text-slate-600">
                  <strong>Notes:</strong> {notes}
                </div>
              )}
            </div>
          )}

          <DialogFooter className="pt-2">
            {step > 1 && (
              <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="rounded-xl border-slate-200">
                Back
              </Button>
            )}
            {step < 3 ? (
              <Button
                type="button"
                onClick={() => {
                  if (step === 1 && !selectedSupplierId) {
                    toast.error('Please select a supplier');
                    return;
                  }
                  if (step === 2 && lineItems.length === 0) {
                    toast.error('Please add at least one line item');
                    return;
                  }
                  setStep(step + 1);
                }}
                className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl"
              >
                Next Step
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleSubmitPO}
                disabled={createPO.isPending}
                className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl"
              >
                {createPO.isPending ? 'Submitting PO...' : 'Confirm & Create PO'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
