import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Plus, Package, ScanLine } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { BarcodeScanner } from '@/components/shared/BarcodeScanner';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { ScanResult } from '@/services/barcode/types';

const mockProducts = [
  { id: '1', sku: 'SKU-1001', name: 'Circuit Board Pro X1', category: 'Electronics', stock: 145, price: 89.99, status: 'active' },
  { id: '2', sku: 'SKU-1002', name: 'Industrial Servo Motor', category: 'Industrial Parts', stock: 8, price: 345.00, status: 'active' },
  { id: '3', sku: 'SKU-1003', name: 'Copper Wire 2.5mm (100m)', category: 'Raw Materials', stock: 234, price: 42.50, status: 'active' },
  { id: '4', sku: 'SKU-1004', name: 'LED Panel 60W Commercial', category: 'Electronics', stock: 67, price: 124.99, status: 'active' },
  { id: '5', sku: 'SKU-1005', name: 'Steel Bearings Set (10pc)', category: 'Industrial Parts', stock: 5, price: 78.00, status: 'active' },
  { id: '6', sku: 'SKU-1006', name: 'Office Chair Ergonomic', category: 'Office Supplies', stock: 42, price: 299.99, status: 'active' },
  { id: '7', sku: 'SKU-1007', name: 'Thermal Paste TG-7', category: 'Electronics', stock: 312, price: 12.99, status: 'active' },
  { id: '8', sku: 'SKU-1008', name: 'Hydraulic Pump HP-200', category: 'Industrial Parts', stock: 3, price: 1249.00, status: 'inactive' },
  { id: '9', sku: 'SKU-1009', name: 'Packaging Tape (48mm)', category: 'Packaging', stock: 890, price: 4.99, status: 'active' },
  { id: '10', sku: 'SKU-1010', name: 'Wireless Mouse BT500', category: 'Electronics', stock: 156, price: 34.99, status: 'active' },
];

const productSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  sku: z.string().min(3, 'SKU is required'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  purchasePrice: z.string().min(1, 'Purchase price is required'),
  sellingPrice: z.string().min(1, 'Selling price is required'),
  taxRate: z.string().optional(),
  unit: z.string().optional(),
  minStock: z.string().optional(),
  maxStock: z.string().optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

export default function ProductsPage() {
  useDocumentTitle('Products');
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { unit: 'pcs', taxRate: '18' },
  });

  const handleBarcodeScan = (result: ScanResult) => {
    // Look up product by barcode value, navigate to detail
    const product = mockProducts.find(
      (p) => p.sku === result.value || p.name.toLowerCase().includes(result.value.toLowerCase())
    );
    setScannerOpen(false);
    if (product) {
      navigate(`/inventory/products/${product.id}`);
    }
  };

  const filteredProducts = mockProducts.filter((p) => {
    if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  const columns = [
    { key: 'sku', title: 'SKU', sortable: true },
    { key: 'name', title: 'Product Name', sortable: true },
    { key: 'category', title: 'Category', sortable: true },
    {
      key: 'stock',
      title: 'Stock',
      sortable: true,
      render: (row: Record<string, unknown>) => {
        const stock = row.stock as number;
        return (
          <span className={stock < 10 ? 'text-amber-400 font-medium' : 'text-foreground'}>
            {stock} {stock < 10 && '⚠'}
          </span>
        );
      },
    },
    {
      key: 'price',
      title: 'Price',
      sortable: true,
      render: (row: Record<string, unknown>) => `$${(row.price as number).toFixed(2)}`,
    },
    {
      key: 'status',
      title: 'Status',
      render: (row: Record<string, unknown>) => (
        <Badge variant={row.status === 'active' ? 'default' : 'secondary'}>
          {(row.status as string).charAt(0).toUpperCase() + (row.status as string).slice(1)}
        </Badge>
      ),
    },
  ];

  const onSubmit = (_data: ProductFormData) => {
    setDialogOpen(false);
    form.reset();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Products"
        description="Manage your product catalog and inventory"
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setScannerOpen(true)}>
              <ScanLine className="mr-2 h-4 w-4" /> Scan Barcode
            </Button>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Product
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Electronics">Electronics</SelectItem>
            <SelectItem value="Industrial Parts">Industrial Parts</SelectItem>
            <SelectItem value="Raw Materials">Raw Materials</SelectItem>
            <SelectItem value="Office Supplies">Office Supplies</SelectItem>
            <SelectItem value="Packaging">Packaging</SelectItem>
          </SelectContent>
        </Select>

        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filteredProducts as unknown as Record<string, unknown>[]}
        selectable
        searchPlaceholder="Search products by name, SKU..."
        onRowClick={(row) => navigate(`/inventory/products/${row.id}`)}
      />

      {/* Add Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-primary" /> Add New Product
            </DialogTitle>
            <DialogDescription>
              Fill in the product details below to add it to your catalog.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Product Name</Label>
                <Input id="name" placeholder="Enter product name" {...form.register('name')} />
                {form.formState.errors.name && <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="sku">SKU</Label>
                <Input id="sku" placeholder="SKU-XXXX" {...form.register('sku')} />
                {form.formState.errors.sku && <p className="text-xs text-destructive">{form.formState.errors.sku.message}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" placeholder="Select or type category" {...form.register('category')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" placeholder="Product description" {...form.register('description')} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="purchasePrice">Purchase Price ($)</Label>
                <Input id="purchasePrice" type="number" step="0.01" {...form.register('purchasePrice')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="sellingPrice">Selling Price ($)</Label>
                <Input id="sellingPrice" type="number" step="0.01" {...form.register('sellingPrice')} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input id="taxRate" type="number" {...form.register('taxRate')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit</Label>
                <Input id="unit" placeholder="pcs" {...form.register('unit')} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="minStock">Min Stock</Label>
                <Input id="minStock" type="number" {...form.register('minStock')} />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Product</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Barcode Scanner */}
      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleBarcodeScan}
        title="Scan Product Barcode"
        description="Scan a barcode to quickly find and navigate to a product"
      />
    </motion.div>
  );
}
