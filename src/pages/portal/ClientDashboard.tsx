import {
  ShoppingBag,
  Package,
  Truck,
  CreditCard,
  Sparkles,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

const activeShipments = [
  {
    id: 'ord-301',
    order_number: 'SO-2026-089',
    items_count: 3,
    status: 'In Transit',
    courier: 'BlueDart Express (AWB #889201948)',
    eta: 'Tomorrow, 2:00 PM',
    destination: 'Whitefield Tech Park, Bangalore',
    progress: 75,
  },
  {
    id: 'ord-302',
    order_number: 'SO-2026-094',
    items_count: 1,
    status: 'Packed & Dispatched',
    courier: 'Delhivery Logistics (AWB #449201882)',
    eta: '29 Aug 2026',
    destination: 'MIDC Industrial Area, Pune',
    progress: 45,
  },
];

const featuredProducts = [
  {
    id: '1',
    name: 'Circuit Board Pro X1',
    sku: 'PCB-PRO-001',
    price: 125,
    category: 'Electronics',
    image: '/images/products/circuit-board-pro.jpg',
    inStock: true,
  },
  {
    id: '2',
    name: 'Industrial Servo Motor 750W',
    sku: 'SRV-750W-002',
    price: 340,
    category: 'Industrial Parts',
    image: '/images/products/servo-motor.jpg',
    inStock: true,
  },
  {
    id: '3',
    name: 'Precision Steel Bearings Set',
    sku: 'BRG-STL-800',
    price: 45,
    category: 'Industrial Parts',
    image: '/images/products/steel-bearings.jpg',
    inStock: true,
  },
];

export default function ClientDashboard() {
  useDocumentTitle('Buyer Portal Overview | StockFlow');

  return (
    <div className="space-y-6">
      <PageHeader
        title="Client B2B Procurement Portal"
        description="Welcome back, Apex Industrial Solutions. Manage wholesale purchase orders, invoices, and live consignments."
        actions={
          <div className="flex items-center gap-3">
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2"
            >
              <Link to="/portal/catalog">
                <ShoppingBag className="h-4 w-4" /> Browse Full Catalog
              </Link>
            </Button>
          </div>
        }
      />

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Shipments</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">2 Orders</h3>
              <span className="text-xs text-emerald-500 font-medium mt-1 block">Live in transit</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
              <Truck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Orders Placed</p>
              <h3 className="text-2xl font-bold text-foreground mt-1">28 Orders</h3>
              <span className="text-xs text-muted-foreground mt-1 block">YTD Procurement</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
              <Package className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Outstanding Invoices</p>
              <h3 className="text-2xl font-bold text-red-400 mt-1">₹42,500</h3>
              <span className="text-xs text-muted-foreground mt-1 block">1 Invoice due 15 Sep</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-500">
              <CreditCard className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-border bg-card shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Credit Limit Available</p>
              <h3 className="text-2xl font-bold text-emerald-500 mt-1">₹4,57,500</h3>
              <span className="text-xs text-emerald-500 font-semibold mt-1 block">Pre-Approved Tier A</span>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Live Consignments & Fast Reorder */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Shipments */}
        <Card className="rounded-2xl border-border bg-card shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
            <div>
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Truck className="h-5 w-5 text-orange-500" /> Active Consignments & Dispatches
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-0.5">Real-time status updates from warehouse dispatch hubs</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="text-xs text-primary rounded-xl">
              <Link to="/portal/tracking">Track Live &rarr;</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {activeShipments.map((s) => (
              <div key={s.id} className="p-4 rounded-2xl bg-background border border-border space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-foreground">{s.order_number}</span>
                    <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-500/10">
                      {s.status}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">ETA: <strong className="text-foreground">{s.eta}</strong></span>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{s.courier}</span>
                    <span>{s.progress}%</span>
                  </div>
                  <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-orange-500 rounded-full" style={{ width: `${s.progress}%` }} />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <span className="text-muted-foreground truncate max-w-xs sm:max-w-md">Dest: {s.destination}</span>
                  <Button size="sm" variant="outline" asChild className="h-7 text-xs rounded-lg">
                    <Link to={`/portal/tracking?order=${s.order_number}`}>Timeline</Link>
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions & Contact RM */}
        <Card className="rounded-2xl border-border bg-card shadow-sm">
          <CardHeader className="pb-3 border-b border-border">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Building className="h-4 w-4 text-orange-500" /> Dedicated Key Account
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center font-bold text-orange-500 text-lg">
                RV
              </div>
              <div>
                <h4 className="font-bold text-sm text-foreground">Rahul Verma</h4>
                <p className="text-xs text-muted-foreground">Senior Technical Sales Manager</p>
                <p className="text-xs text-emerald-500 font-medium">rahul.v@stockflow.com</p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-background border border-border text-xs space-y-1.5">
              <span className="font-semibold block text-foreground">Assigned Warehouse Hub:</span>
              <p className="text-muted-foreground">Mumbai Central Logistics Hub (WH-MUM)</p>
              <p className="text-muted-foreground">Average Dispatch Lead Time: <strong>24 Hours</strong></p>
            </div>

            <Button asChild className="w-full bg-primary text-primary-foreground rounded-xl text-xs font-semibold">
              <Link to="/portal/catalog">Browse New Inventory Arrivals</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Featured Catalog Items for Fast Re-Order */}
      <Card className="rounded-2xl border-border bg-card shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b border-border">
          <div>
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-orange-500" /> Frequently Ordered Products
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Quick re-order items with contract pricing applied</p>
          </div>
          <Button variant="ghost" size="sm" asChild className="text-xs text-primary rounded-xl">
            <Link to="/portal/catalog">View All Products &rarr;</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {featuredProducts.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl bg-background border border-border space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-orange-500">{p.category}</span>
                    <Badge variant="outline" className="text-[10px] border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
                      In Stock
                    </Badge>
                  </div>
                  <h4 className="font-bold text-foreground text-sm mt-1">{p.name}</h4>
                  <p className="text-xs text-muted-foreground font-mono">{p.sku}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-base font-black text-foreground">₹{p.price * 80} / unit</span>
                  <Button size="sm" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl text-xs h-8">
                    <Link to="/portal/catalog">Add to Cart</Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
