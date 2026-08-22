import { motion } from 'motion/react';
import { ArrowLeft, Edit, Package, AlertTriangle, Warehouse } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { format } from 'date-fns';

const mockProduct = {
  id: '1',
  name: 'Circuit Board Pro X1',
  sku: 'SKU-1001',
  category: 'Electronics',
  description: 'High-performance circuit board designed for industrial automation systems. Features 6-layer PCB with gold-plated connectors and integrated power regulation.',
  hsnCode: '8534.00',
  unit: 'pcs',
  purchasePrice: 52.00,
  sellingPrice: 89.99,
  taxRate: 18.0,
  minStockLevel: 20,
  maxStockLevel: 500,
  reorderPoint: 50,
  isActive: true,
  createdAt: '2024-01-15T10:30:00Z',
};

const warehouseStock = [
  { warehouse: 'Main Warehouse - Mumbai', code: 'WH-MUM', quantity: 85, reserved: 12 },
  { warehouse: 'North Hub - Delhi', code: 'WH-DEL', quantity: 32, reserved: 5 },
  { warehouse: 'South Center - Bangalore', code: 'WH-BLR', quantity: 18, reserved: 3 },
  { warehouse: 'East Wing - Kolkata', code: 'WH-KOL', quantity: 10, reserved: 0 },
];

const recentMovements = [
  { date: '2024-12-18', type: 'in', quantity: 50, warehouse: 'WH-MUM', reference: 'PO-000089', by: 'Rajesh Kumar' },
  { date: '2024-12-17', type: 'out', quantity: 15, warehouse: 'WH-MUM', reference: 'SO-000142', by: 'Priya Singh' },
  { date: '2024-12-16', type: 'transfer', quantity: 10, warehouse: 'WH-DEL', reference: 'TRF-0023', by: 'Amit Patel' },
  { date: '2024-12-15', type: 'out', quantity: 8, warehouse: 'WH-BLR', reference: 'SO-000138', by: 'Priya Singh' },
  { date: '2024-12-14', type: 'in', quantity: 100, warehouse: 'WH-MUM', reference: 'PO-000085', by: 'Rajesh Kumar' },
];

const typeColors: Record<string, string> = {
  in: 'bg-emerald-500/20 text-emerald-400',
  out: 'bg-red-500/20 text-red-400',
  transfer: 'bg-blue-500/20 text-blue-400',
  adjustment: 'bg-amber-500/20 text-amber-400',
};

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const totalStock = warehouseStock.reduce((sum, w) => sum + w.quantity, 0);
  const totalReserved = warehouseStock.reduce((sum, w) => sum + w.reserved, 0);
  const margin = ((mockProduct.sellingPrice - mockProduct.purchasePrice) / mockProduct.sellingPrice * 100).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/inventory/products')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{mockProduct.name}</h1>
            <p className="text-sm text-muted-foreground">{mockProduct.sku}</p>
          </div>
          <Badge variant={mockProduct.isActive ? 'default' : 'secondary'}>
            {mockProduct.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">Adjust Stock</Button>
          <Button><Edit className="mr-2 h-4 w-4" /> Edit</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column */}
        <div className="space-y-6 lg:col-span-1">
          {/* Product Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" /> Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex h-40 items-center justify-center rounded-[16px] bg-secondary/50">
                <Package className="h-16 w-16 text-muted-foreground/50" />
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Category</span>
                  <span className="text-foreground">{mockProduct.category}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">HSN Code</span>
                  <span className="text-foreground">{mockProduct.hsnCode}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Unit</span>
                  <span className="text-foreground">{mockProduct.unit}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created</span>
                  <span className="text-foreground">{format(new Date(mockProduct.createdAt), 'MMM d, yyyy')}</span>
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{mockProduct.description}</p>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Margins</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Purchase Price</span>
                <span className="text-foreground">${mockProduct.purchasePrice.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Selling Price</span>
                <span className="text-foreground font-medium">${mockProduct.sellingPrice.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax Rate</span>
                <span className="text-foreground">{mockProduct.taxRate}%</span>
              </div>
              <Separator />
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Margin</span>
                <span className="text-primary font-medium">{margin}%</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Stock Summary */}
          <div className="grid grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{totalStock}</p>
                <p className="text-xs text-muted-foreground">Total Stock</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{totalReserved}</p>
                <p className="text-xs text-muted-foreground">Reserved</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{totalStock - totalReserved}</p>
                <p className="text-xs text-muted-foreground">Available</p>
              </CardContent>
            </Card>
          </div>

          {/* Warehouse Stock */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-primary" /> Stock by Warehouse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="px-3 py-2 text-left text-muted-foreground font-medium">Warehouse</th>
                      <th className="px-3 py-2 text-right text-muted-foreground font-medium">Quantity</th>
                      <th className="px-3 py-2 text-right text-muted-foreground font-medium">Reserved</th>
                      <th className="px-3 py-2 text-right text-muted-foreground font-medium">Available</th>
                      <th className="px-3 py-2 text-right text-muted-foreground font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {warehouseStock.map((ws) => (
                      <tr key={ws.code} className="border-b border-border last:border-0">
                        <td className="px-3 py-3">
                          <p className="text-foreground">{ws.warehouse}</p>
                          <p className="text-xs text-muted-foreground">{ws.code}</p>
                        </td>
                        <td className="px-3 py-3 text-right text-foreground">{ws.quantity}</td>
                        <td className="px-3 py-3 text-right text-muted-foreground">{ws.reserved}</td>
                        <td className="px-3 py-3 text-right text-foreground">{ws.quantity - ws.reserved}</td>
                        <td className="px-3 py-3 text-right">
                          {ws.quantity < mockProduct.reorderPoint ? (
                            <Badge variant="warning" className="text-xs">
                              <AlertTriangle className="mr-1 h-3 w-3" /> Low
                            </Badge>
                          ) : (
                            <Badge variant="default" className="text-xs">OK</Badge>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Recent Movements */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Stock Movements</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentMovements.map((m, i) => (
                  <div key={i} className="flex items-center justify-between rounded-[12px] bg-secondary/30 p-3">
                    <div className="flex items-center gap-3">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[m.type]}`}>
                        {m.type.toUpperCase()}
                      </span>
                      <div>
                        <p className="text-sm text-foreground">
                          {m.type === 'in' ? '+' : m.type === 'out' ? '-' : ''}{m.quantity} units
                        </p>
                        <p className="text-xs text-muted-foreground">{m.reference} &middot; {m.warehouse}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{format(new Date(m.date), 'MMM d, yyyy')}</p>
                      <p className="text-xs text-muted-foreground">{m.by}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
