import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, ShoppingCart } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';

const mockOrders = [
  { id: '1', order_number: 'SO-000142', customer: 'TechVentures Inc.', status: 'processing', items: 4, total: 12450, created: '2024-12-18' },
  { id: '2', order_number: 'SO-000141', customer: 'GlobalTech Solutions', status: 'confirmed', items: 2, total: 8900, created: '2024-12-17' },
  { id: '3', order_number: 'SO-000140', customer: 'Pinnacle Manufacturing', status: 'shipped', items: 6, total: 34200, created: '2024-12-16' },
  { id: '4', order_number: 'SO-000139', customer: 'AutoParts Direct', status: 'delivered', items: 3, total: 15600, created: '2024-12-15' },
  { id: '5', order_number: 'SO-000138', customer: 'MetroWorks Industrial', status: 'delivered', items: 8, total: 67800, created: '2024-12-14' },
  { id: '6', order_number: 'SO-000137', customer: 'QuickServe Retail', status: 'draft', items: 2, total: 4200, created: '2024-12-18' },
  { id: '7', order_number: 'SO-000136', customer: 'SmartBuild Contractors', status: 'cancelled', items: 5, total: 23400, created: '2024-12-12' },
  { id: '8', order_number: 'SO-000135', customer: 'TechVentures Inc.', status: 'delivered', items: 3, total: 9800, created: '2024-12-10' },
  { id: '9', order_number: 'SO-000134', customer: 'Pinnacle Manufacturing', status: 'processing', items: 7, total: 42100, created: '2024-12-09' },
  { id: '10', order_number: 'SO-000133', customer: 'GlobalTech Solutions', status: 'shipped', items: 4, total: 18900, created: '2024-12-08' },
];

const statusVariants: Record<string, 'default' | 'secondary' | 'warning' | 'destructive' | 'info'> = {
  draft: 'secondary',
  confirmed: 'info',
  processing: 'warning',
  shipped: 'info',
  delivered: 'default',
  cancelled: 'destructive',
  returned: 'destructive',
};

export default function SalesOrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState(1);

  const filteredOrders = mockOrders.filter((o) => {
    if (activeTab === 'all') return true;
    return o.status === activeTab;
  });

  const columns = [
    { key: 'order_number', title: 'Order #', sortable: true },
    { key: 'customer', title: 'Customer', sortable: true },
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
    { key: 'items', title: 'Items', sortable: true },
    {
      key: 'total',
      title: 'Total',
      sortable: true,
      render: (row: Record<string, unknown>) => `$${(row.total as number).toLocaleString()}`,
    },
    {
      key: 'created',
      title: 'Created',
      sortable: true,
      render: (row: Record<string, unknown>) => format(new Date(row.created as string), 'MMM d, yyyy'),
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
        title="Sales Orders"
        description="Manage customer orders and track fulfillment"
        actions={
          <Button onClick={() => { setDialogOpen(true); setStep(1); }}>
            <Plus className="mr-2 h-4 w-4" /> New Order
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({mockOrders.length})</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="processing">Processing</TabsTrigger>
          <TabsTrigger value="shipped">Shipped</TabsTrigger>
          <TabsTrigger value="delivered">Delivered</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          <DataTable
            columns={columns}
            data={filteredOrders as unknown as Record<string, unknown>[]}
            searchPlaceholder="Search orders..."
          />
        </TabsContent>
      </Tabs>

      {/* New Order Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-primary" /> New Sales Order
            </DialogTitle>
            <DialogDescription>
              Step {step} of 4: {step === 1 ? 'Customer' : step === 2 ? 'Items' : step === 3 ? 'Shipping' : 'Confirm'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3, 4].map((s) => (
              <div key={s} className={`h-2 w-10 rounded-full ${s <= step ? 'bg-primary' : 'bg-secondary'}`} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Customer</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select customer" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">TechVentures Inc.</SelectItem>
                    <SelectItem value="2">GlobalTech Solutions</SelectItem>
                    <SelectItem value="3">Pinnacle Manufacturing</SelectItem>
                    <SelectItem value="4">AutoParts Direct</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-[12px] border border-border p-3">
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5 space-y-1">
                    <Label className="text-xs">Product</Label>
                    <Input placeholder="Search product" className="h-8 text-xs" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input type="number" className="h-8 text-xs" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Price</Label>
                    <Input type="number" className="h-8 text-xs" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Disc %</Label>
                    <Input type="number" className="h-8 text-xs" />
                  </div>
                  <div className="col-span-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">+</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Shipping Address</Label>
                <Input placeholder="Street address" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input placeholder="City" />
                </div>
                <div className="space-y-2">
                  <Label>State</Label>
                  <Input placeholder="State" />
                </div>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="rounded-[12px] bg-secondary/30 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Customer</span>
                <span className="text-foreground">TechVentures Inc.</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Items</span>
                <span className="text-foreground">0 items</span>
              </div>
              <div className="flex justify-between text-sm font-medium border-t border-border pt-2">
                <span className="text-foreground">Total</span>
                <span className="text-primary">$0.00</span>
              </div>
            </div>
          )}

          <DialogFooter>
            {step > 1 && <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>}
            {step < 4 ? (
              <Button onClick={() => setStep(step + 1)}>Next</Button>
            ) : (
              <Button onClick={() => { setDialogOpen(false); setStep(1); }}>Create Order</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
