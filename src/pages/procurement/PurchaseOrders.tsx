import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, FileText } from 'lucide-react';
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

const mockPOs = [
  { id: '1', po_number: 'PO-000089', supplier: 'MicroChip Supplies Ltd', status: 'confirmed', items: 5, total: 24500, expected_delivery: '2024-12-22', created: '2024-12-15' },
  { id: '2', po_number: 'PO-000088', supplier: 'TechComponents Global', status: 'sent', items: 3, total: 18200, expected_delivery: '2024-12-25', created: '2024-12-14' },
  { id: '3', po_number: 'PO-000087', supplier: 'Steel Masters India', status: 'partially_received', items: 8, total: 45600, expected_delivery: '2024-12-20', created: '2024-12-12' },
  { id: '4', po_number: 'PO-000086', supplier: 'Global Electronics Corp', status: 'received', items: 4, total: 32100, expected_delivery: '2024-12-18', created: '2024-12-10' },
  { id: '5', po_number: 'PO-000085', supplier: 'PackRight Solutions', status: 'draft', items: 2, total: 8900, expected_delivery: '2024-12-30', created: '2024-12-16' },
  { id: '6', po_number: 'PO-000084', supplier: 'HydroTech Systems', status: 'confirmed', items: 6, total: 67800, expected_delivery: '2024-12-28', created: '2024-12-13' },
  { id: '7', po_number: 'PO-000083', supplier: 'CopperLine Industries', status: 'received', items: 3, total: 15400, expected_delivery: '2024-12-15', created: '2024-12-08' },
  { id: '8', po_number: 'PO-000082', supplier: 'LED World Distributors', status: 'cancelled', items: 4, total: 22300, expected_delivery: '2024-12-20', created: '2024-12-07' },
];

const statusVariants: Record<string, 'default' | 'secondary' | 'warning' | 'destructive' | 'info'> = {
  draft: 'secondary',
  sent: 'info',
  confirmed: 'default',
  partially_received: 'warning',
  received: 'default',
  cancelled: 'destructive',
};

export default function PurchaseOrdersPage() {
  const [activeTab, setActiveTab] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [step, setStep] = useState(1);

  const filteredPOs = mockPOs.filter((po) => {
    if (activeTab === 'all') return true;
    return po.status === activeTab;
  });

  const columns = [
    { key: 'po_number', title: 'PO #', sortable: true },
    { key: 'supplier', title: 'Supplier', sortable: true },
    {
      key: 'status',
      title: 'Status',
      render: (row: Record<string, unknown>) => {
        const status = row.status as string;
        return (
          <Badge variant={statusVariants[status] || 'secondary'}>
            {status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
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
      key: 'expected_delivery',
      title: 'Expected Delivery',
      sortable: true,
      render: (row: Record<string, unknown>) => format(new Date(row.expected_delivery as string), 'MMM d, yyyy'),
    },
    {
      key: 'created',
      title: 'Created',
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
        title="Purchase Orders"
        description="Create and manage purchase orders for your suppliers"
        actions={
          <Button onClick={() => { setDialogOpen(true); setStep(1); }}>
            <Plus className="mr-2 h-4 w-4" /> Create PO
          </Button>
        }
      />

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">All ({mockPOs.length})</TabsTrigger>
          <TabsTrigger value="draft">Draft</TabsTrigger>
          <TabsTrigger value="sent">Sent</TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
          <TabsTrigger value="partially_received">Partial</TabsTrigger>
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
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Create Purchase Order
            </DialogTitle>
            <DialogDescription>
              Step {step} of 3: {step === 1 ? 'Select Supplier' : step === 2 ? 'Add Items' : 'Review & Confirm'}
            </DialogDescription>
          </DialogHeader>

          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-2 w-12 rounded-full ${s <= step ? 'bg-primary' : 'bg-secondary'}`} />
            ))}
          </div>

          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Supplier</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select supplier" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">MicroChip Supplies Ltd</SelectItem>
                    <SelectItem value="2">TechComponents Global</SelectItem>
                    <SelectItem value="3">Steel Masters India</SelectItem>
                    <SelectItem value="4">Global Electronics Corp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expected Delivery</Label>
                <Input type="date" />
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Input placeholder="Additional notes for this order" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="rounded-[12px] border border-border p-3 space-y-3">
                <div className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-5 space-y-1">
                    <Label className="text-xs">Product</Label>
                    <Input placeholder="Search product" className="h-8 text-xs" />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Qty</Label>
                    <Input type="number" placeholder="0" className="h-8 text-xs" />
                  </div>
                  <div className="col-span-3 space-y-1">
                    <Label className="text-xs">Price</Label>
                    <Input type="number" placeholder="0.00" className="h-8 text-xs" />
                  </div>
                  <div className="col-span-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0">+</Button>
                  </div>
                </div>
              </div>
              <div className="text-sm text-muted-foreground text-center py-4">
                Add line items to this purchase order
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-[12px] bg-secondary/30 p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Supplier</span>
                  <span className="text-foreground">MicroChip Supplies Ltd</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Items</span>
                  <span className="text-foreground">0 items</span>
                </div>
                <div className="flex justify-between text-sm font-medium border-t border-border pt-2 mt-2">
                  <span className="text-foreground">Total</span>
                  <span className="text-primary">$0.00</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            {step > 1 && (
              <Button variant="outline" onClick={() => setStep(step - 1)}>Back</Button>
            )}
            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)}>Next</Button>
            ) : (
              <Button onClick={() => { setDialogOpen(false); setStep(1); }}>Create PO</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
