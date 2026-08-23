import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Edit, Package, AlertTriangle, Warehouse, ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Pencil, Repeat2, SlidersHorizontal, Printer, QrCode } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, ReferenceLine, Tooltip, Cell } from 'recharts';
import { format } from 'date-fns';
import { generateBarcode, generateQRCode } from '@/services/barcode/generator';
import type { BarcodeFormat } from '@/services/barcode/types';

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
  barcode: '4901234567890',
  barcodeFormat: 'EAN_13' as BarcodeFormat,
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
  { date: '2024-12-13', type: 'adjustment', quantity: -2, warehouse: 'WH-MUM', reference: 'ADJ-0045', by: 'Vikram Mehta' },
  { date: '2024-12-12', type: 'out', quantity: 20, warehouse: 'WH-DEL', reference: 'SO-000135', by: 'Priya Singh' },
  { date: '2024-12-11', type: 'transfer', quantity: 15, warehouse: 'WH-BLR', reference: 'TRF-0022', by: 'Amit Patel' },
  { date: '2024-12-10', type: 'in', quantity: 75, warehouse: 'WH-KOL', reference: 'PO-000082', by: 'Rajesh Kumar' },
  { date: '2024-12-09', type: 'out', quantity: 5, warehouse: 'WH-KOL', reference: 'SO-000130', by: 'Neha Sharma' },
  { date: '2024-12-08', type: 'adjustment', quantity: 3, warehouse: 'WH-DEL', reference: 'ADJ-0044', by: 'Vikram Mehta' },
  { date: '2024-12-07', type: 'out', quantity: 12, warehouse: 'WH-MUM', reference: 'SO-000128', by: 'Priya Singh' },
  { date: '2024-12-06', type: 'in', quantity: 60, warehouse: 'WH-DEL', reference: 'PO-000080', by: 'Rajesh Kumar' },
  { date: '2024-12-05', type: 'transfer', quantity: 8, warehouse: 'WH-KOL', reference: 'TRF-0021', by: 'Amit Patel' },
  { date: '2024-12-04', type: 'out', quantity: 18, warehouse: 'WH-BLR', reference: 'SO-000125', by: 'Neha Sharma' },
  { date: '2024-12-03', type: 'in', quantity: 40, warehouse: 'WH-BLR', reference: 'PO-000078', by: 'Rajesh Kumar' },
  { date: '2024-12-02', type: 'adjustment', quantity: -5, warehouse: 'WH-KOL', reference: 'ADJ-0043', by: 'Vikram Mehta' },
  { date: '2024-12-01', type: 'out', quantity: 22, warehouse: 'WH-MUM', reference: 'SO-000120', by: 'Priya Singh' },
  { date: '2024-11-30', type: 'transfer', quantity: 12, warehouse: 'WH-DEL', reference: 'TRF-0020', by: 'Amit Patel' },
  { date: '2024-11-29', type: 'in', quantity: 90, warehouse: 'WH-MUM', reference: 'PO-000075', by: 'Rajesh Kumar' },
];

const typeColors: Record<string, string> = {
  in: 'bg-emerald-500/20 text-emerald-400',
  out: 'bg-red-500/20 text-red-400',
  transfer: 'bg-blue-500/20 text-blue-400',
  adjustment: 'bg-amber-500/20 text-amber-400',
};

const movementTypeIcons: Record<string, typeof ArrowDownLeft> = {
  in: ArrowDownLeft,
  out: ArrowUpRight,
  transfer: ArrowLeftRight,
  adjustment: Pencil,
};

const warehouseChartData = warehouseStock.map((ws) => ({
  name: ws.code,
  quantity: ws.quantity,
  available: ws.quantity - ws.reserved,
}));

export default function ProductDetailPage() {
  const navigate = useNavigate();
  const [showPrintView, setShowPrintView] = useState(false);
  const totalStock = warehouseStock.reduce((sum, w) => sum + w.quantity, 0);
  const totalReserved = warehouseStock.reduce((sum, w) => sum + w.reserved, 0);
  const margin = ((mockProduct.sellingPrice - mockProduct.purchasePrice) / mockProduct.sellingPrice * 100).toFixed(1);

  const barcodeImage = generateBarcode(mockProduct.barcode, mockProduct.barcodeFormat);
  const qrCodeImage = generateQRCode({
    sku: mockProduct.sku,
    name: mockProduct.name,
    price: mockProduct.sellingPrice,
    warehouse: warehouseStock[0]?.warehouse,
  });

  const handlePrintBarcode = () => {
    setShowPrintView(true);
    setTimeout(() => {
      window.print();
      setShowPrintView(false);
    }, 300);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Low Stock Warning Banner */}
      {totalStock < mockProduct.reorderPoint && (
        <div className="flex items-center gap-3 rounded-[16px] border border-amber-500/30 bg-amber-500/10 p-4">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">Low Stock Warning</p>
            <p className="text-xs text-amber-400/80">
              Total stock ({totalStock} units) is below the reorder point ({mockProduct.reorderPoint} units). Consider placing a purchase order.
            </p>
          </div>
        </div>
      )}

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
          <Button variant="outline" onClick={() => navigate('/inventory/adjustments')}>
            <SlidersHorizontal className="mr-2 h-4 w-4" /> Quick Adjust
          </Button>
          <Button variant="outline" onClick={() => navigate('/inventory/transfers')}>
            <Repeat2 className="mr-2 h-4 w-4" /> Quick Transfer
          </Button>
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

          {/* Barcode & QR Code */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="h-4 w-4 text-primary" /> Barcode & QR Code
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {mockProduct.barcode && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">Product Barcode</p>
                  <div className="flex items-center justify-center rounded-[12px] bg-secondary/50 p-3">
                    <img
                      src={barcodeImage}
                      alt={`Barcode: ${mockProduct.barcode}`}
                      className="max-w-full h-auto"
                    />
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Product QR Code</p>
                <div className="flex items-center justify-center rounded-[12px] bg-secondary/50 p-3">
                  <img
                    src={qrCodeImage}
                    alt={`QR Code for ${mockProduct.sku}`}
                    className="w-32 h-32"
                  />
                </div>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={handlePrintBarcode}
              >
                <Printer className="mr-2 h-4 w-4" /> Print Barcode Label
              </Button>
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

          {/* Warehouse Stock Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Warehouse className="h-4 w-4 text-primary" /> Stock by Warehouse
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={warehouseChartData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis type="number" stroke="#71717a" fontSize={12} />
                    <YAxis type="category" dataKey="name" stroke="#71717a" fontSize={12} width={70} />
                    <Tooltip
                      content={({ active, payload }) =>
                        active && payload?.length ? (
                          <div className="glass rounded-[12px] px-3 py-2 text-xs">
                            <p className="text-foreground font-medium">{payload[0].payload.name}</p>
                            <p className="text-muted-foreground">Quantity: {payload[0].value}</p>
                          </div>
                        ) : null
                      }
                    />
                    <ReferenceLine x={mockProduct.reorderPoint} stroke="#f59e0b" strokeDasharray="5 5" label={{ value: 'Reorder Point', fill: '#f59e0b', fontSize: 11, position: 'top' }} />
                    <Bar dataKey="quantity" radius={[0, 4, 4, 0]}>
                      {warehouseChartData.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={entry.quantity < mockProduct.reorderPoint ? '#ef4444' : '#10b981'}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Warehouse Stock Table */}
          <Card>
            <CardHeader>
              <CardTitle>Warehouse Stock Detail</CardTitle>
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

          {/* Movement History Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Movement History (Last 20)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentMovements.map((m, i) => {
                  const TypeIcon = movementTypeIcons[m.type];
                  return (
                    <div key={i} className="flex items-center justify-between rounded-[12px] bg-secondary/30 p-3">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                          m.type === 'in' ? 'bg-emerald-500/10' :
                          m.type === 'out' ? 'bg-red-500/10' :
                          m.type === 'transfer' ? 'bg-blue-500/10' :
                          'bg-amber-500/10'
                        }`}>
                          <TypeIcon className={`h-4 w-4 ${
                            m.type === 'in' ? 'text-emerald-400' :
                            m.type === 'out' ? 'text-red-400' :
                            m.type === 'transfer' ? 'text-blue-400' :
                            'text-amber-400'
                          }`} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[m.type]}`}>
                              {m.type.toUpperCase()}
                            </span>
                            <p className="text-sm text-foreground">
                              {m.type === 'in' ? '+' : m.type === 'out' ? '-' : m.type === 'adjustment' ? (m.quantity > 0 ? '+' : '') : ''}{m.quantity} units
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{m.reference} &middot; {m.warehouse} &middot; {m.by}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">{format(new Date(m.date), 'MMM d, yyyy')}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Print-friendly barcode label (hidden, shown only when printing) */}
      {showPrintView && (
        <div className="fixed inset-0 z-[9999] bg-white p-8 print:block hidden" id="print-barcode-label">
          <div className="flex flex-col items-center gap-4 text-black">
            <h2 className="text-lg font-bold">{mockProduct.name}</h2>
            <p className="text-sm">{mockProduct.sku}</p>
            <img src={barcodeImage} alt="Barcode" className="w-64" />
            <p className="text-xs font-mono">{mockProduct.barcode}</p>
            <img src={qrCodeImage} alt="QR Code" className="w-32 h-32" />
          </div>
        </div>
      )}
    </motion.div>
  );
}
