import { useState } from 'react';
import {
  Truck,
  Search,
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  ShieldCheck,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface TrackingEvent {
  title: string;
  location: string;
  time: string;
  date: string;
  completed: boolean;
  active?: boolean;
  description: string;
}

const trackingTimeline: TrackingEvent[] = [
  {
    title: 'Order Confirmed & Approved',
    location: 'StockFlow HQ, BKC, Mumbai',
    time: '09:30 AM',
    date: '25 Aug 2026',
    completed: true,
    description: 'Purchase Order verified against corporate credit limits and release order generated.',
  },
  {
    title: 'Warehouse Pick & Pack Completed',
    location: 'Mumbai Central Logistics Hub (WH-MUM), Sector 4',
    time: '02:45 PM',
    date: '25 Aug 2026',
    completed: true,
    description: 'Barcodes scanned, anti-static moisture packaging sealed, and weight verified (18.4 kg).',
  },
  {
    title: 'In Transit — Inter-City Cargo Dispatch',
    location: 'National Highway 48 / Pune-Bangalore Corridor',
    time: '11:15 AM',
    date: '26 Aug 2026',
    completed: true,
    active: true,
    description: 'Consignment loaded on Dedicated Container Truck MH-04-AZ-8921 with GPS real-time telemetry active.',
  },
  {
    title: 'Arrival at Regional Distribution Hub',
    location: 'Bangalore East Hub, Whitefield',
    time: 'Expected 08:00 AM',
    date: '28 Aug 2026',
    completed: false,
    description: 'Inbound consignment sorting and local delivery route assignment.',
  },
  {
    title: 'Out for Delivery & Client Acceptance',
    location: 'Apex Industrial Solutions, Whitefield Tech Park',
    time: 'Expected 02:00 PM',
    date: '28 Aug 2026',
    completed: false,
    description: 'Final delivery, digital proof-of-delivery (POD) sign-off, and physical handover.',
  },
];

export default function OrderTracking() {
  useDocumentTitle('Live Order Tracking | StockFlow');
  const [searchParams] = useSearchParams();
  const initialOrder = searchParams.get('order') || 'SO-2026-089';

  const [searchQuery, setSearchQuery] = useState(initialOrder);
  const [activeTrackingNumber, setActiveTrackingNumber] = useState(initialOrder);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setActiveTrackingNumber(searchQuery.trim());
    toast.success(`Fetched tracking status for ${searchQuery.trim()}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Shipment & Consignment Tracker"
        description="Monitor real-time GPS telemetry, hub-to-hub transit stages, and estimated delivery windows."
      />

      {/* Search Bar */}
      <Card className="rounded-3xl border-border bg-card p-6">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Enter Sales Order # (e.g. SO-2026-089) or AWB Tracking # (e.g. BLD-889201948)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border rounded-xl h-11"
            />
          </div>
          <Button type="submit" className="bg-primary text-primary-foreground font-semibold rounded-xl px-6 h-11">
            Track Consignment
          </Button>
        </form>
      </Card>

      {/* Tracking Card Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Timeline */}
        <Card className="rounded-3xl border-border bg-card shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-border gap-2">
            <div>
              <div className="flex items-center gap-3">
                <CardTitle className="text-lg font-bold">{activeTrackingNumber}</CardTitle>
                <Badge className="bg-blue-500/10 border border-blue-500/20 text-blue-400 font-semibold">
                  In Transit (75% Complete)
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Estimated Delivery: <strong className="text-foreground">Tomorrow, 28 Aug 2026 by 2:00 PM</strong>
              </p>
            </div>

            <div className="text-left sm:text-right">
              <span className="text-xs text-muted-foreground block">Carrier Partner</span>
              <span className="font-bold text-sm text-foreground">BlueDart Express (Air/Surface)</span>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="relative pl-6 space-y-8 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-border">
              {trackingTimeline.map((step, idx) => (
                <div key={idx} className="relative flex items-start gap-4">
                  {/* Circle Icon */}
                  <div
                    className={`absolute -left-6 h-6 w-6 rounded-full flex items-center justify-center border text-xs ${
                      step.completed
                        ? step.active
                          ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/30 animate-pulse'
                          : 'bg-emerald-500 border-emerald-500 text-white'
                        : 'bg-muted border-border text-muted-foreground'
                    }`}
                  >
                    {step.completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                  </div>

                  {/* Text Details */}
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <h4 className="font-bold text-sm text-foreground">{step.title}</h4>
                      <span className="text-xs text-muted-foreground">
                        {step.date} at {step.time}
                      </span>
                    </div>

                    <p className="text-xs font-medium text-orange-500 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {step.location}
                    </p>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Right: Shipment Metadata */}
        <div className="space-y-4">
          <Card className="rounded-3xl border-border bg-card shadow-sm p-6 space-y-4">
            <h3 className="font-bold text-base text-foreground flex items-center gap-2">
              <Truck className="h-4 w-4 text-orange-500" /> Carrier & Transit Details
            </h3>

            <div className="space-y-3 text-xs divide-y divide-border">
              <div className="flex justify-between pt-1">
                <span className="text-muted-foreground">AWB Number:</span>
                <span className="font-mono font-bold text-foreground">BLD-889201948</span>
              </div>
              <div className="flex justify-between pt-2.5">
                <span className="text-muted-foreground">Consignment Weight:</span>
                <span className="font-semibold text-foreground">18.40 kg (2 Boxes)</span>
              </div>
              <div className="flex justify-between pt-2.5">
                <span className="text-muted-foreground">Origin Hub:</span>
                <span className="font-semibold text-foreground">WH-MUM (Mumbai Hub)</span>
              </div>
              <div className="flex justify-between pt-2.5">
                <span className="text-muted-foreground">Destination:</span>
                <span className="font-semibold text-foreground">Bangalore Tech Park</span>
              </div>
              <div className="flex justify-between pt-2.5">
                <span className="text-muted-foreground">Vehicle Reg:</span>
                <span className="font-mono font-semibold text-foreground">MH-04-AZ-8921</span>
              </div>
            </div>

            <div className="bg-background p-3 rounded-2xl border border-border space-y-1 text-xs">
              <span className="font-bold block text-foreground flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Tamper-Evident Security Seal
              </span>
              <p className="text-muted-foreground text-[11px]">
                Barcode Seal #STK-9921 applied. Verify seal integrity upon physical receipt.
              </p>
            </div>
          </Card>

          <Card className="rounded-3xl border-border bg-card shadow-sm p-6 space-y-3">
            <h3 className="font-bold text-sm text-foreground flex items-center gap-2">
              <Package className="h-4 w-4 text-orange-500" /> Package Contents (2 items)
            </h3>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between bg-muted/40 p-2.5 rounded-xl">
                <span>Circuit Board Pro X1</span>
                <strong className="text-foreground">15 units</strong>
              </div>
              <div className="flex justify-between bg-muted/40 p-2.5 rounded-xl">
                <span>Precision Steel Bearings Set</span>
                <strong className="text-foreground">10 units</strong>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
