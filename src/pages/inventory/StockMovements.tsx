import { useState } from 'react';
import { motion } from 'motion/react';
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight, Pencil, ScanLine } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { BarcodeScanner } from '@/components/shared/BarcodeScanner';
import type { ScanResult } from '@/services/barcode/types';

const mockMovements = [
  { id: '1', date: '2024-12-18T14:30:00Z', product: 'Circuit Board Pro X1', warehouse: 'WH-MUM', type: 'in', quantity: 50, reference: 'PO-000089', createdBy: 'Rajesh Kumar' },
  { id: '2', date: '2024-12-18T11:15:00Z', product: 'Industrial Servo Motor', warehouse: 'WH-DEL', type: 'out', quantity: 5, reference: 'SO-000142', createdBy: 'Priya Singh' },
  { id: '3', date: '2024-12-17T16:45:00Z', product: 'Copper Wire 2.5mm', warehouse: 'WH-BLR', type: 'transfer', quantity: 30, reference: 'TRF-0024', createdBy: 'Amit Patel' },
  { id: '4', date: '2024-12-17T09:20:00Z', product: 'LED Panel 60W', warehouse: 'WH-MUM', type: 'out', quantity: 12, reference: 'SO-000140', createdBy: 'Priya Singh' },
  { id: '5', date: '2024-12-16T15:00:00Z', product: 'Steel Bearings Set', warehouse: 'WH-KOL', type: 'adjustment', quantity: -3, reference: 'ADJ-0012', createdBy: 'Suresh Das' },
  { id: '6', date: '2024-12-16T10:30:00Z', product: 'Thermal Paste TG-7', warehouse: 'WH-MUM', type: 'in', quantity: 200, reference: 'PO-000088', createdBy: 'Rajesh Kumar' },
  { id: '7', date: '2024-12-15T13:45:00Z', product: 'Office Chair Ergonomic', warehouse: 'WH-DEL', type: 'in', quantity: 20, reference: 'PO-000087', createdBy: 'Vikram Singh' },
  { id: '8', date: '2024-12-15T08:00:00Z', product: 'Hydraulic Pump HP-200', warehouse: 'WH-BLR', type: 'out', quantity: 2, reference: 'SO-000138', createdBy: 'Anita Sharma' },
  { id: '9', date: '2024-12-14T17:20:00Z', product: 'Packaging Tape (48mm)', warehouse: 'WH-AHM', type: 'transfer', quantity: 100, reference: 'TRF-0023', createdBy: 'Mehul Patel' },
  { id: '10', date: '2024-12-14T12:00:00Z', product: 'Wireless Mouse BT500', warehouse: 'WH-MUM', type: 'in', quantity: 75, reference: 'PO-000086', createdBy: 'Rajesh Kumar' },
];

const typeConfig: Record<string, { color: string; icon: typeof ArrowDownLeft; label: string }> = {
  in: { color: 'bg-emerald-500/20 text-emerald-400', icon: ArrowDownLeft, label: 'Stock In' },
  out: { color: 'bg-red-500/20 text-red-400', icon: ArrowUpRight, label: 'Stock Out' },
  transfer: { color: 'bg-blue-500/20 text-blue-400', icon: ArrowLeftRight, label: 'Transfer' },
  adjustment: { color: 'bg-amber-500/20 text-amber-400', icon: Pencil, label: 'Adjustment' },
};

export default function StockMovementsPage() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [warehouseFilter, setWarehouseFilter] = useState('all');
  const [scannerOpen, setScannerOpen] = useState(false);

  const handleBarcodeScan = (result: ScanResult) => {
    setScannerOpen(false);
    toast.success(`Product scanned: ${result.value}`, {
      description: 'Product added to movement',
    });
  };

  const filtered = mockMovements.filter((m) => {
    if (typeFilter !== 'all' && m.type !== typeFilter) return false;
    if (warehouseFilter !== 'all' && m.warehouse !== warehouseFilter) return false;
    return true;
  });

  const columns = [
    {
      key: 'date',
      title: 'Date/Time',
      sortable: true,
      render: (row: Record<string, unknown>) => (
        <span className="text-sm">{format(new Date(row.date as string), 'MMM d, yyyy HH:mm')}</span>
      ),
    },
    { key: 'product', title: 'Product', sortable: true },
    { key: 'warehouse', title: 'Warehouse', sortable: true },
    {
      key: 'type',
      title: 'Type',
      render: (row: Record<string, unknown>) => {
        const config = typeConfig[row.type as string];
        const Icon = config.icon;
        return (
          <Badge className={`${config.color} border-0 gap-1`}>
            <Icon className="h-3 w-3" />
            {config.label}
          </Badge>
        );
      },
    },
    {
      key: 'quantity',
      title: 'Quantity',
      sortable: true,
      render: (row: Record<string, unknown>) => {
        const qty = row.quantity as number;
        const type = row.type as string;
        const prefix = type === 'in' ? '+' : type === 'out' ? '-' : '';
        const color = type === 'in' ? 'text-emerald-400' : type === 'out' ? 'text-red-400' : 'text-foreground';
        return <span className={`font-medium ${color}`}>{prefix}{Math.abs(qty)}</span>;
      },
    },
    { key: 'reference', title: 'Reference' },
    { key: 'createdBy', title: 'Created By' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Stock Movements"
        description="Track all inventory movements across warehouses"
        actions={
          <Button variant="outline" onClick={() => setScannerOpen(true)}>
            <ScanLine className="mr-2 h-4 w-4" /> Scan Product
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Movement Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="in">Stock In</SelectItem>
            <SelectItem value="out">Stock Out</SelectItem>
            <SelectItem value="transfer">Transfer</SelectItem>
            <SelectItem value="adjustment">Adjustment</SelectItem>
          </SelectContent>
        </Select>

        <Select value={warehouseFilter} onValueChange={setWarehouseFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Warehouse" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Warehouses</SelectItem>
            <SelectItem value="WH-MUM">WH-MUM</SelectItem>
            <SelectItem value="WH-DEL">WH-DEL</SelectItem>
            <SelectItem value="WH-BLR">WH-BLR</SelectItem>
            <SelectItem value="WH-KOL">WH-KOL</SelectItem>
            <SelectItem value="WH-AHM">WH-AHM</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={filtered as unknown as Record<string, unknown>[]}
        searchPlaceholder="Search movements..."
      />

      {/* Barcode Scanner */}
      <BarcodeScanner
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        onScan={handleBarcodeScan}
        title="Scan Product for Movement"
        description="Scan a barcode to quickly add a product to a stock movement"
      />
    </motion.div>
  );
}
