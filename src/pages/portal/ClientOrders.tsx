import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Truck,
  Eye,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export type ClientOrderStatus = 'processing' | 'dispatched' | 'delivered' | 'cancelled';

export interface ClientOrder {
  id: string;
  order_number: string;
  po_number: string;
  date: string;
  status: ClientOrderStatus;
  items_count: number;
  total_amount: number;
  courier?: string;
  awb_number?: string;
  delivery_eta?: string;
  destination: string;
  items: Array<{ name: string; sku: string; qty: number; price: number }>;
}

const mockOrders: ClientOrder[] = [
  {
    id: 'ord-1',
    order_number: 'SO-2026-089',
    po_number: 'PO-APEX-2026-0844',
    date: '2026-08-25',
    status: 'dispatched',
    items_count: 2,
    total_amount: 185000,
    courier: 'BlueDart Express',
    awb_number: 'BLD-889201948',
    delivery_eta: '28 Aug 2026',
    destination: 'Whitefield Tech Park, Bangalore',
    items: [
      { name: 'Circuit Board Pro X1', sku: 'PCB-PRO-001', qty: 15, price: 10000 },
      { name: 'Precision Steel Bearings Set', sku: 'BRG-STL-800', qty: 10, price: 3500 },
    ],
  },
  {
    id: 'ord-2',
    order_number: 'SO-2026-074',
    po_number: 'PO-APEX-2026-0820',
    date: '2026-08-18',
    status: 'delivered',
    items_count: 1,
    total_amount: 320000,
    courier: 'Delhivery Surface Logistics',
    awb_number: 'DEL-449201882',
    delivery_eta: 'Delivered on 22 Aug 2026',
    destination: 'Whitefield Tech Park, Bangalore',
    items: [
      { name: 'Industrial Servo Motor 750W', sku: 'SRV-750W-002', qty: 10, price: 32000 },
    ],
  },
  {
    id: 'ord-3',
    order_number: 'SO-2026-094',
    po_number: 'PO-APEX-2026-0891',
    date: '2026-08-27',
    status: 'processing',
    items_count: 2,
    total_amount: 98000,
    courier: 'Allocating Logistics Courier',
    awb_number: 'Pending',
    delivery_eta: '30 Aug 2026',
    destination: 'Whitefield Tech Park, Bangalore',
    items: [
      { name: 'Ultra-Bright LED Panel 60W', sku: 'LED-PAN-60W', qty: 12, price: 5200 },
      { name: 'Thermal Paste TG-7 Extreme', sku: 'THM-PST-007', qty: 20, price: 1780 },
    ],
  },
];

const statusBadgeStyles: Record<ClientOrderStatus, { label: string; bg: string; text: string; icon: any }> = {
  processing: { label: 'Order Processing', bg: 'bg-amber-500/10 border-amber-500/20', text: 'text-amber-500', icon: Clock },
  dispatched: { label: 'In Transit', bg: 'bg-blue-500/10 border-blue-500/20', text: 'text-blue-500', icon: Truck },
  delivered: { label: 'Delivered', bg: 'bg-emerald-500/10 border-emerald-500/20', text: 'text-emerald-500', icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-500', icon: Clock },
};

export default function ClientOrders() {
  useDocumentTitle('My Purchase Orders | StockFlow');

  const [orders] = useState<ClientOrder[]>(mockOrders);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<ClientOrder | null>(null);

  const filteredOrders = useMemo(() => {
    return orders.filter((ord) => {
      const matchesSearch =
        ord.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        ord.po_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ord.awb_number && ord.awb_number.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchesStatus = statusFilter === 'all' || ord.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchTerm, statusFilter]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Wholesale Purchase Orders"
        description="Track all submitted commercial orders, view dispatch stages, and download tax invoices."
      />

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-2xl border border-border">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Order #, PO #, AWB..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 bg-background border-border rounded-xl"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-44 bg-background border-border rounded-xl">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="dispatched">In Transit</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={Truck}
          title="No purchase orders found"
          description="You have no orders matching the search criteria."
        />
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((ord) => {
            const badge = statusBadgeStyles[ord.status];
            const StatusIcon = badge.icon;

            return (
              <motion.div
                key={ord.id}
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      {/* Left: Info */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-bold text-lg text-foreground">{ord.order_number}</span>
                          <span className="text-xs text-muted-foreground font-mono bg-muted/60 px-2 py-0.5 rounded-md">
                            Buyer PO: {ord.po_number}
                          </span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.bg} ${badge.text}`}>
                            <StatusIcon className="h-3 w-3" />
                            {badge.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5" /> Order Placed: {ord.date}
                          </span>
                          <span className="flex items-center gap-1">
                            <Truck className="h-3.5 w-3.5" /> Courier: <strong className="text-foreground">{ord.courier}</strong> ({ord.awb_number})
                          </span>
                          <span>{ord.items_count} Product Line Items</span>
                        </div>

                        <p className="text-xs text-muted-foreground">
                          Delivery ETA: <strong className="text-foreground">{ord.delivery_eta}</strong>
                        </p>
                      </div>

                      {/* Right: Amount & Actions */}
                      <div className="flex flex-col sm:flex-row sm:items-center gap-4 lg:text-right">
                        <div>
                          <span className="text-xs text-muted-foreground block">Order Invoiced</span>
                          <span className="text-xl font-bold text-foreground">₹{ord.total_amount.toLocaleString('en-IN')}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedOrder(ord)}
                            className="rounded-xl border-border hover:bg-muted"
                          >
                            <Eye className="h-4 w-4 mr-1.5" /> View Details
                          </Button>

                          <Button
                            size="sm"
                            asChild
                            className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-sm"
                          >
                            <Link to={`/portal/tracking?order=${ord.order_number}`}>
                              <Truck className="h-4 w-4 mr-1.5" /> Track
                            </Link>
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Order Detail Modal */}
      {selectedOrder && (
        <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
          <DialogContent className="max-w-2xl rounded-3xl bg-card border-border p-6">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-xl font-bold">Order Details — {selectedOrder.order_number}</DialogTitle>
                  <DialogDescription>Buyer PO: {selectedOrder.po_number}</DialogDescription>
                </div>
                <Button
                  size="sm"
                  onClick={() => toast.success(`Tax Invoice for ${selectedOrder.order_number} downloaded`)}
                  className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white flex items-center gap-1.5"
                >
                  <Download className="h-4 w-4" /> Download Invoice
                </Button>
              </div>
            </DialogHeader>

            <div className="space-y-4 text-sm mt-2 border border-border p-5 rounded-2xl bg-background">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-muted-foreground block">Order Date:</span>
                  <span className="font-semibold text-foreground">{selectedOrder.date}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Logistics Provider:</span>
                  <span className="font-semibold text-foreground">{selectedOrder.courier}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">AWB Tracking Reference:</span>
                  <span className="font-mono font-semibold text-orange-500">{selectedOrder.awb_number}</span>
                </div>
                <div>
                  <span className="text-muted-foreground block">Destination Address:</span>
                  <span className="font-semibold text-foreground">{selectedOrder.destination}</span>
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <h5 className="font-bold text-xs uppercase text-muted-foreground mb-2">Itemized Components:</h5>
                <div className="space-y-2">
                  {selectedOrder.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-xs bg-muted/40 p-2.5 rounded-xl">
                      <div>
                        <span className="font-semibold text-foreground block">{it.name}</span>
                        <span className="text-muted-foreground font-mono">{it.sku} &times; {it.qty} units</span>
                      </div>
                      <span className="font-bold text-foreground self-center">₹{(it.qty * it.price).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between border-t border-border pt-3 font-bold text-base text-primary">
                <span>Total Amount (Inc. GST):</span>
                <span>₹{selectedOrder.total_amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
