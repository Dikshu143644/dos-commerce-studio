import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Plus, Package, ScanLine, LayoutGrid, List, ArrowUpRight, AlertTriangle, CheckCircle2 } from 'lucide-react';
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
import { useAuth } from '@/hooks/useAuth';
import type { ScanResult } from '@/services/barcode/types';

export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  reorderPoint: number;
  image: string;
  status: 'active' | 'inactive';
  description: string;
}

const mockProducts: ProductItem[] = [
  {
    id: '30000000-0000-0000-0000-000000000001',
    sku: 'PCB-PRO-001',
    name: 'Circuit Board Pro X1',
    category: 'Electronics',
    stock: 142,
    price: 2450.00,
    reorderPoint: 25,
    image: '/images/products/circuit-board-pro.jpg',
    status: 'active',
    description: 'Multi-layer high frequency printed circuit board for edge computing and IoT gateway controllers',
  },
  {
    id: '30000000-0000-0000-0000-000000000002',
    sku: 'SRV-750W-002',
    name: 'Industrial Servo Motor',
    category: 'Industrial Parts',
    stock: 38,
    price: 8900.00,
    reorderPoint: 10,
    image: '/images/products/servo-motor.jpg',
    status: 'active',
    description: 'High-torque AC brushless servo motor with integrated 24-bit magnetic absolute encoder',
  },
  {
    id: '30000000-0000-0000-0000-000000000003',
    sku: 'USB-HUB-7P',
    name: 'USB-C Hub 7-Port',
    category: 'Electronics',
    stock: 165,
    price: 1899.00,
    reorderPoint: 35,
    image: '/images/products/industrial-router.jpg',
    status: 'active',
    description: 'Aluminum 7-in-1 multi-port hub with 100W Power Delivery and dual 4K HDMI support',
  },
  {
    id: '30000000-0000-0000-0000-000000000004',
    sku: 'LED-PAN-60W',
    name: 'LED Panel 60W',
    category: 'Electronics',
    stock: 95,
    price: 1200.00,
    reorderPoint: 15,
    image: '/images/products/led-panel.jpg',
    status: 'active',
    description: 'Energy-efficient high CRI industrial cleanroom and factory LED lighting panel with PWM dimming',
  },
  {
    id: '30000000-0000-0000-0000-000000000005',
    sku: 'WIR-COP-250',
    name: 'Copper Wire 2.5mm',
    category: 'Raw Materials',
    stock: 280,
    price: 450.00,
    reorderPoint: 30,
    image: '/images/products/copper-wire.jpg',
    status: 'active',
    description: 'Pure oxygen-free electrolytic copper wire with double insulation for industrial automation',
  },
  {
    id: '30000000-0000-0000-0000-000000000006',
    sku: 'THM-PST-007',
    name: 'Thermal Paste TG-7 Extreme',
    category: 'Electronics',
    stock: 115,
    price: 22.50,
    reorderPoint: 50,
    image: '/images/products/thermal-paste.jpg',
    status: 'active',
    description: 'High thermal conductivity 14.5 W/mK non-conductive thermal interface compound (50g)',
  },
  {
    id: '30000000-0000-0000-0000-000000000007',
    sku: 'CON-PCB-12P',
    name: 'PCB Terminal Connector 12-Pin',
    category: 'Wiring',
    stock: 450,
    price: 15.00,
    reorderPoint: 100,
    image: '/images/products/pcb-connector.jpg',
    status: 'active',
    description: 'Screwless push-in DIN-rail mountable terminal connector blocks with gold-plated pins',
  },
  {
    id: '30000000-0000-0000-0000-000000000008',
    sku: 'ALU-SHT-3MM',
    name: 'Anodized Aluminum Sheet 3mm',
    category: 'Raw Materials',
    stock: 64,
    price: 110.00,
    reorderPoint: 20,
    image: '/images/products/aluminum-sheet.jpg',
    status: 'active',
    description: '6061-T6 aerospace-grade brushed aluminum enclosure panel sheets (1000mm x 500mm)',
  },
  {
    id: '30000000-0000-0000-0000-000000000009',
    sku: 'RES-PCK-10K',
    name: 'Precision Resistor Pack 10K Ohm',
    category: 'Electronics',
    stock: 82,
    price: 32.00,
    reorderPoint: 25,
    image: '/images/products/resistor-pack.jpg',
    status: 'active',
    description: '0.1% tolerance thin-film surface mount resistors reel of 1000 pieces',
  },
  {
    id: '30000000-0000-0000-0000-000000000010',
    sku: 'HP-200-IND',
    name: 'Hydraulic Pump HP-200',
    category: 'Industrial Parts',
    stock: 24,
    price: 850.00,
    reorderPoint: 5,
    image: '/images/products/hydraulic-pump.jpg',
    status: 'active',
    description: 'High-pressure cast iron hydraulic power unit for heavy manufacturing and pneumatic automation',
  },
  {
    id: '30000000-0000-0000-0000-000000000011',
    sku: 'OCE-100-PRO',
    name: 'Executive Ergonomic Chair OCE-100',
    category: 'Office Supplies',
    stock: 45,
    price: 320.00,
    reorderPoint: 10,
    image: '/images/products/office-chair.jpg',
    status: 'active',
    description: 'Commercial ergonomic chair with 4D adjustable armrests, breathable lumbar mesh, and aluminum base',
  },
  {
    id: '30000000-0000-0000-0000-000000000012',
    sku: 'WM-BT500-RGB',
    name: 'Wireless Ergonomic Mouse BT500',
    category: 'Electronics',
    stock: 120,
    price: 48.00,
    reorderPoint: 25,
    image: '/images/products/wireless-mouse.jpg',
    status: 'active',
    description: 'Multi-device Bluetooth and 2.4GHz wireless mouse with stealth black ergonomic grip and 4000 DPI sensor',
  },
  {
    id: '30000000-0000-0000-0000-000000000013',
    sku: 'PKG-TPE-48M',
    name: 'Industrial Packaging Tape 48mm',
    category: 'Packaging',
    stock: 350,
    price: 8.50,
    reorderPoint: 60,
    image: '/images/products/packaging-tape.jpg',
    status: 'active',
    description: 'Heavy duty high-adhesion carton sealing tape rolls with handheld dispenser',
  },
  {
    id: '30000000-0000-0000-0000-000000000014',
    sku: 'SAF-HLM-PRO',
    name: 'Industrial Safety Helmet & Visor',
    category: 'Safety Equipment',
    stock: 85,
    price: 55.00,
    reorderPoint: 20,
    image: '/images/products/safety-helmet.jpg',
    status: 'active',
    description: 'Impact-resistant polycarbonate industrial hard hat with integrated eye shield and reflective decals',
  },
  {
    id: '30000000-0000-0000-0000-000000000015',
    sku: 'VLV-PNM-24V',
    name: 'Pneumatic Solenoid Valve Block',
    category: 'Industrial Parts',
    stock: 42,
    price: 210.00,
    reorderPoint: 12,
    image: '/images/products/pneumatic-valves.jpg',
    status: 'active',
    description: '5-way 2-position 24V DC solenoid directional control manifold with brass push-in fittings',
  },
  {
    id: '30000000-0000-0000-0000-000000000016',
    sku: 'PWR-DIN-24V',
    name: 'DIN-Rail 24V 120W Power Supply',
    category: 'Electronics',
    stock: 95,
    price: 92.00,
    reorderPoint: 15,
    image: '/images/products/power-supply.jpg',
    status: 'active',
    description: 'High-efficiency industrial switching power supply with overload protection and LED status',
  },
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
  const { userRole, assignedCategory } = useAuth();

  const isStaff = userRole === 'staff';
  const staffCategory = assignedCategory || 'Electronics';

  const [dialogOpen, setDialogOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState(isStaff ? staffCategory : 'all');
  const [statusFilter, setStatusFilter] = useState('all');

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: { unit: 'pcs', taxRate: '18', category: isStaff ? staffCategory : 'Electronics' },
  });

  const handleBarcodeScan = (result: ScanResult) => {
    const product = mockProducts.find(
      (p) => p.sku === result.value || p.name.toLowerCase().includes(result.value.toLowerCase())
    );
    setScannerOpen(false);
    if (product) {
      navigate(`/inventory/products/${product.id}`);
    }
  };

  const activeCategoryFilter = isStaff ? staffCategory : categoryFilter;

  const filteredProducts = mockProducts.filter((p) => {
    if (activeCategoryFilter !== 'all' && p.category !== activeCategoryFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchQuery.trim() && !p.name.toLowerCase().includes(searchQuery.toLowerCase()) && !p.sku.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
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
      title: 'Price (INR)',
      sortable: true,
      render: (row: Record<string, unknown>) => `₹${(row.price as number).toLocaleString('en-IN')}`,
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
        title={isStaff ? `Products — ${staffCategory} Department` : "Products"}
        description={isStaff ? `Staff ERP view locked to your assigned category: ${staffCategory}` : "Manage your enterprise product catalog, specifications, and real-time inventory"}
        bannerImage="/images/pages/banner-products.jpg"
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

      {/* Staff Scoped Warning Banner */}
      {isStaff && (
        <div className="rounded-[16px] border border-orange-200 bg-orange-50/80 p-3.5 px-4 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-orange-500 text-white flex items-center justify-center font-black text-sm">
              🔒
            </div>
            <div>
              <p className="text-xs font-bold text-orange-900">
                Staff Department Scope Active: <span className="underline">{staffCategory}</span>
              </p>
              <p className="text-[11px] text-orange-700">
                You can view, update inventory stock, and edit items only in your assigned category. Admin & Manager accounts can manage all categories.
              </p>
            </div>
          </div>
          <Badge variant="outline" className="bg-white border-orange-300 text-orange-800 text-[11px] font-bold">
            {staffCategory} Only
          </Badge>
        </div>
      )}

      {/* Controls & Filters Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3 flex-1 min-w-[280px]">
          <Input
            placeholder="Search products by name, SKU..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="max-w-xs"
          />

          {!isStaff ? (
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[170px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="Electronics">Electronics</SelectItem>
                <SelectItem value="Industrial Parts">Industrial Parts</SelectItem>
                <SelectItem value="Raw Materials">Raw Materials</SelectItem>
                <SelectItem value="Wiring">Wiring</SelectItem>
              </SelectContent>
            </Select>
          ) : (
            <div className="h-9 px-3 rounded-md bg-muted border border-border flex items-center text-xs font-semibold text-foreground gap-1.5">
              <span>Category:</span>
              <span className="text-primary font-bold">{staffCategory}</span>
            </div>
          )}

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-xl border border-border">
          <Button
            size="sm"
            variant={viewMode === 'grid' ? 'default' : 'ghost'}
            className="h-8 px-3 rounded-lg text-xs"
            onClick={() => setViewMode('grid')}
          >
            <LayoutGrid className="h-3.5 w-3.5 mr-1.5" /> Visual Grid
          </Button>
          <Button
            size="sm"
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            className="h-8 px-3 rounded-lg text-xs"
            onClick={() => setViewMode('table')}
          >
            <List className="h-3.5 w-3.5 mr-1.5" /> Data Table
          </Button>
        </div>
      </div>

      {/* Grid View */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((p) => {
            const isLowStock = p.stock <= p.reorderPoint;
            return (
              <motion.div
                key={p.id}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                onClick={() => navigate(`/inventory/products/${p.id}`)}
                className="group relative flex flex-col glass rounded-2xl border border-border overflow-hidden cursor-pointer hover:border-emerald-500/50 hover:shadow-2xl hover:shadow-emerald-500/10 transition-all"
              >
                {/* Product Realistic Image Box */}
                <div className="relative w-full h-52 overflow-hidden bg-black/40">
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent opacity-80" />
                  
                  {/* Category Pill */}
                  <div className="absolute top-3 left-3">
                    <Badge variant="secondary" className="glass text-xs font-semibold px-2.5 py-0.5 border border-white/10">
                      {p.category}
                    </Badge>
                  </div>

                  {/* Stock Status Pill */}
                  <div className="absolute top-3 right-3">
                    {isLowStock ? (
                      <Badge className="bg-amber-500/90 text-white font-medium flex items-center gap-1 text-[11px] px-2 py-0.5 shadow-md">
                        <AlertTriangle className="h-3 w-3" /> Low Stock
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-500/90 text-white font-medium flex items-center gap-1 text-[11px] px-2 py-0.5 shadow-md">
                        <CheckCircle2 className="h-3 w-3" /> In Stock
                      </Badge>
                    )}
                  </div>

                  {/* Price Tag */}
                  <div className="absolute bottom-3 left-3">
                    <span className="text-xl font-bold text-white tracking-tight drop-shadow-md">
                      ${p.price.toFixed(2)}
                    </span>
                  </div>

                  {/* Quick Action Button */}
                  <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>

                {/* Card Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="text-xs text-muted-foreground font-mono tracking-wider">{p.sku}</div>
                    <h3 className="font-semibold text-base text-foreground group-hover:text-emerald-400 transition-colors line-clamp-1">
                      {p.name}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
                      {p.description}
                    </p>
                  </div>

                  {/* Stock Progress & Info */}
                  <div className="pt-2 border-t border-border/50">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="text-muted-foreground">Available Quantity:</span>
                      <span className={`font-bold ${isLowStock ? 'text-amber-400' : 'text-foreground'}`}>
                        {p.stock} units
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${isLowStock ? 'bg-amber-400' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, (p.stock / (p.reorderPoint * 3)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filteredProducts as unknown as Record<string, unknown>[]}
          selectable
          searchPlaceholder="Filter table results..."
          onRowClick={(row) => navigate(`/inventory/products/${row.id}`)}
        />
      )}

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
