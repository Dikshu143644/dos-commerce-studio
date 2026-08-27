import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Search,
  Plus,
  Minus,
  ShoppingCart,
  Package,
  Star,
  Truck,
  Sparkles,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export interface CatalogProduct {
  id: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  base_price_inr: number;
  stock_quantity: number;
  min_order_qty: number;
  image: string;
  rating: number;
  reviews_count: number;
  specifications: string[];
  hubs: string[];
}

export const catalogProducts: CatalogProduct[] = [
  {
    id: 'prod-1',
    sku: 'PCB-PRO-001',
    name: 'Circuit Board Pro X1',
    category: 'Electronics',
    description: 'Multi-layer high frequency printed circuit board for edge computing and IoT gateway controllers.',
    base_price_inr: 10000,
    stock_quantity: 142,
    min_order_qty: 5,
    image: '/images/products/circuit-board-pro.jpg',
    rating: 4.9,
    reviews_count: 38,
    specifications: ['4-Layer FR4', 'Gold Plated Pads', 'Operating: -40°C to 85°C', 'Automated Surface Mount'],
    hubs: ['Mumbai Central (WH-MUM)', 'Bangalore Tech (WH-BLR)'],
  },
  {
    id: 'prod-2',
    sku: 'SRV-750W-002',
    name: 'Industrial Servo Motor 750W',
    category: 'Industrial Parts',
    description: 'High-torque AC brushless servo motor with integrated 24-bit magnetic absolute encoder.',
    base_price_inr: 27200,
    stock_quantity: 38,
    min_order_qty: 1,
    image: '/images/products/servo-motor.jpg',
    rating: 4.8,
    reviews_count: 24,
    specifications: ['750W Power Output', '3000 RPM Max Speed', 'IP65 Ingress Protection', '24-Bit Optical Encoder'],
    hubs: ['Delhi NCR Hub (WH-DEL)', 'Mumbai Central (WH-MUM)'],
  },
  {
    id: 'prod-3',
    sku: 'WIR-COP-250',
    name: 'Copper Wire 2.5mm Reel (100m)',
    category: 'Raw Materials',
    description: 'Pure oxygen-free electrolytic copper wire with double insulation for industrial automation.',
    base_price_inr: 7040,
    stock_quantity: 280,
    min_order_qty: 2,
    image: '/images/products/copper-wire.jpg',
    rating: 4.9,
    reviews_count: 52,
    specifications: ['99.99% OFC Electrolytic Copper', '100m Continuous Spool', '1100V Rated Voltage', 'Flame Retardant PVC'],
    hubs: ['Kolkata East (WH-KOL)', 'Mumbai Central (WH-MUM)'],
  },
  {
    id: 'prod-4',
    sku: 'LED-PAN-60W',
    name: 'Ultra-Bright LED Panel 60W',
    category: 'Electronics',
    description: 'Energy-efficient high CRI industrial cleanroom and factory LED lighting panel with PWM dimming.',
    base_price_inr: 5200,
    stock_quantity: 95,
    min_order_qty: 4,
    image: '/images/products/led-panel.jpg',
    rating: 4.7,
    reviews_count: 19,
    specifications: ['6000 Lumens Output', 'CRI > 90 True-Color', 'Die-cast Aluminum Housing', '50,000 Hours MTBF'],
    hubs: ['Bangalore Tech (WH-BLR)', 'Delhi NCR Hub (WH-DEL)'],
  },
  {
    id: 'prod-5',
    sku: 'BRG-STL-800',
    name: 'Precision Steel Bearings Set',
    category: 'Industrial Parts',
    description: 'ABEC-9 graded stainless steel deep groove ball bearings for high-RPM rotary machinery.',
    base_price_inr: 3600,
    stock_quantity: 18,
    min_order_qty: 5,
    image: '/images/products/steel-bearings.jpg',
    rating: 4.9,
    reviews_count: 41,
    specifications: ['ABEC-9 Precision Tolerance', 'Chrome Steel 52100 Shell', 'Synthetic High-Temp Grease', 'Dual Rubber Seals'],
    hubs: ['Mumbai Central (WH-MUM)'],
  },
  {
    id: 'prod-6',
    sku: 'THM-PST-007',
    name: 'Thermal Paste TG-7 Extreme',
    category: 'Electronics',
    description: 'High thermal conductivity 14.5 W/mK non-conductive thermal interface compound (50g tube).',
    base_price_inr: 1800,
    stock_quantity: 115,
    min_order_qty: 10,
    image: '/images/products/thermal-paste.jpg',
    rating: 4.8,
    reviews_count: 67,
    specifications: ['14.5 W/mK Conductivity', 'Zero Electrical Conductivity', '50g Syringe Dispenser', '-50°C to 240°C Range'],
    hubs: ['Mumbai Central (WH-MUM)', 'Bangalore Tech (WH-BLR)', 'Delhi NCR Hub (WH-DEL)'],
  },
];

export default function ProductCatalog() {
  useDocumentTitle('Wholesale B2B E-Commerce Catalog | DOS-CRM-ERP');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [cartCount, setCartCount] = useState(2);
  const [selectedProduct, setSelectedProduct] = useState<CatalogProduct | null>(null);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const categories = ['All', 'Electronics', 'Industrial Parts', 'Raw Materials'];

  const filteredProducts = useMemo(() => {
    return catalogProducts.filter((p) => {
      const matchesSearch =
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, selectedCategory]);

  const handleQtyChange = (productId: string, delta: number, minQty: number) => {
    setQuantities((prev) => {
      const current = prev[productId] || minQty;
      const next = Math.max(minQty, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const handleAddToCart = (product: CatalogProduct) => {
    const qty = quantities[product.id] || product.min_order_qty;
    setCartCount((prev) => prev + 1);

    // Save cart state to localStorage for Abandoned Cart WhatsApp Agent Triggering!
    try {
      const existingCart = JSON.parse(localStorage.getItem('dos_client_cart') || '[]');
      const itemIndex = existingCart.findIndex((item: any) => item.id === product.id);
      if (itemIndex > -1) {
        existingCart[itemIndex].quantity += qty;
      } else {
        existingCart.push({
          id: product.id,
          name: product.name,
          sku: product.sku,
          price: product.base_price_inr,
          quantity: qty,
          image: product.image,
          addedAt: new Date().toISOString(),
        });
      }
      localStorage.setItem('dos_client_cart', JSON.stringify(existingCart));
      localStorage.setItem('dos_cart_last_activity', new Date().toISOString());
    } catch {
      // ignore
    }

    toast.success(`Added ${qty}x ${product.name} to wholesale cart!`, {
      description: `Line Total: ₹${(qty * product.base_price_inr).toLocaleString('en-IN')}`,
    });
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <PageHeader
        badge="Direct B2B Wholesale Store"
        title="Wholesale Product Catalog"
        description="Browse enterprise-grade industrial assemblies, semiconductors, and raw materials with volume contracts."
        actions={
          <Button
            asChild
            className="rounded-2xl h-11 px-5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-lg shadow-purple-600/25 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Link to="/portal/cart">
              <ShoppingCart className="h-4 w-4" /> View Cart ({cartCount} items)
            </Link>
          </Button>
        }
      />

      {/* Promotional Bento Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider bg-orange-500 text-white shadow-sm">
              <Sparkles className="h-3.5 w-3.5" /> Bulk Tier Contract Pricing
            </span>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
              Direct-from-Warehouse Wholesale Hub
            </h2>
            <p className="text-xs sm:text-sm text-purple-200/80 leading-relaxed">
              Real-time stock reservation across Mumbai, Delhi, Bangalore & Kolkata fulfillment corridors with GST ITC input credit invoices.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 text-center">
              <p className="text-xs text-purple-200">Dispatch SLA</p>
              <p className="text-base font-black text-white">Same-Day 24h</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/15 text-center">
              <p className="text-xs text-purple-200">GST Input Credit</p>
              <p className="text-base font-black text-emerald-400">100% Verified</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            placeholder="Search by part name, SKU, specification..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-11 bg-slate-50 border-slate-200 rounded-2xl text-xs sm:text-sm"
          />
        </div>

        {/* Categories segmented bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto bg-slate-100 p-1 rounded-2xl">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedCategory === cat
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {cat === 'All' ? 'All Products' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Bento Grid */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No products found"
          description="Try modifying your search criteria or category filter."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {filteredProducts.map((p) => {
            const currentQty = quantities[p.id] || p.min_order_qty;
            const unitPrice = p.base_price_inr;
            const totalPrice = currentQty * unitPrice;

            return (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="group h-full"
              >
                <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-2xl hover:border-purple-300 transition-all duration-300 overflow-hidden flex flex-col justify-between h-full relative">
                  <div>
                    {/* Spatial Glassmorphism Image Container */}
                    <div className="relative h-56 w-full bg-slate-900 overflow-hidden flex items-center justify-center">
                      <img
                        src={p.image}
                        alt={p.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-90"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent pointer-events-none" />

                      {/* Floating Glassmorphic Badges */}
                      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5">
                        <Badge className="bg-black/60 backdrop-blur-md border border-white/20 text-white text-[11px] font-bold px-2.5 py-1 rounded-xl shadow-sm">
                          {p.category}
                        </Badge>
                      </div>

                      <div className="absolute top-3 right-3 z-10">
                        {p.stock_quantity > 20 ? (
                          <Badge className="bg-emerald-500/90 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-xl shadow-sm flex items-center gap-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                            In Stock ({p.stock_quantity})
                          </Badge>
                        ) : (
                          <Badge className="bg-amber-500/90 backdrop-blur-md text-white text-[10px] font-extrabold px-2.5 py-1 rounded-xl shadow-sm">
                            Low Stock ({p.stock_quantity} left)
                          </Badge>
                        )}
                      </div>

                      {/* SKU & Quick View button */}
                      <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between">
                        <span className="bg-slate-900/80 backdrop-blur-md text-slate-300 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md border border-white/10">
                          {p.sku}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedProduct(p);
                            setQuickViewOpen(true);
                          }}
                          className="h-7 px-2 bg-white/20 hover:bg-white/40 backdrop-blur-md text-white text-[11px] font-bold rounded-lg"
                        >
                          <Eye className="h-3 w-3 mr-1" /> Quick Specs
                        </Button>
                      </div>
                    </div>

                    {/* Content Section */}
                    <CardContent className="p-6 space-y-4">
                      <div>
                        <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mb-1">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                          <span>{p.rating}</span>
                          <span className="text-slate-400 font-normal">({p.reviews_count} verified orders)</span>
                        </div>
                        <h3 className="font-extrabold text-lg text-slate-900 group-hover:text-purple-700 transition-colors">
                          {p.name}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                          {p.description}
                        </p>
                      </div>

                      {/* Specifications Pills */}
                      <div className="space-y-1.5 pt-1">
                        {p.specifications.slice(0, 3).map((spec, i) => (
                          <div key={i} className="flex items-center gap-2 text-xs text-slate-600">
                            <span className="h-1.5 w-1.5 rounded-full bg-purple-600 shrink-0" />
                            <span className="truncate">{spec}</span>
                          </div>
                        ))}
                      </div>

                      {/* Pricing Tier Card */}
                      <div className="bg-gradient-to-br from-purple-50/70 to-indigo-50/50 p-4 rounded-2xl border border-purple-200/80 flex items-center justify-between mt-2">
                        <div>
                          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Wholesale Rate</span>
                          <span className="text-2xl font-black text-purple-700">₹{unitPrice.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-slate-500 font-semibold ml-1">/ unit</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[11px] text-emerald-700 font-extrabold block">Min. {p.min_order_qty} Units</span>
                          <span className="text-[10px] text-slate-500 font-medium">GST 18% Applicable</span>
                        </div>
                      </div>
                    </CardContent>
                  </div>

                  {/* Quantity Stepper & Add to Order Cart Button */}
                  <div className="p-6 pt-0 space-y-3 border-t border-slate-100 mt-2">
                    <div className="flex items-center justify-between pt-3">
                      <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-2xl p-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleQtyChange(p.id, -1, p.min_order_qty)}
                          className="h-8 w-8 rounded-xl text-slate-700 hover:bg-white hover:shadow-xs"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </Button>
                        <span className="font-extrabold text-sm px-2 text-slate-900">{currentQty}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleQtyChange(p.id, 1, p.min_order_qty)}
                          className="h-8 w-8 rounded-xl text-slate-700 hover:bg-white hover:shadow-xs"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </Button>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider block">Line Total</span>
                        <span className="font-black text-base text-slate-900">₹{totalPrice.toLocaleString('en-IN')}</span>
                      </div>
                    </div>

                    <Button
                      onClick={() => handleAddToCart(p)}
                      className="w-full h-11 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold shadow-md shadow-purple-600/20 flex items-center justify-center gap-2 transition-all hover:scale-102"
                    >
                      <ShoppingCart className="h-4 w-4" /> Add to Order Cart
                    </Button>
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Quick Specs Modal */}
      {selectedProduct && (
        <Dialog open={quickViewOpen} onOpenChange={setQuickViewOpen}>
          <DialogContent className="max-w-2xl rounded-3xl p-6 sm:p-8 bg-white border border-slate-200">
            <DialogHeader>
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <Package className="h-5 w-5" />
                <span className="text-xs font-bold uppercase tracking-wider">{selectedProduct.sku}</span>
              </div>
              <DialogTitle className="text-2xl font-extrabold text-slate-900">{selectedProduct.name}</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Full technical datasheet and multi-warehouse stocking corridors.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="rounded-2xl overflow-hidden bg-slate-900 aspect-square">
                <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Technical Specifications</h4>
                  <ul className="space-y-2 text-xs font-medium text-slate-700">
                    {selectedProduct.specifications.map((s, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t border-slate-100 pt-3">
                  <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Fulfillment Warehouses</h4>
                  <div className="space-y-1 text-xs">
                    {selectedProduct.hubs.map((hub, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-600">
                        <Truck className="h-3.5 w-3.5 text-emerald-600" /> {hub}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400">Wholesale Price</span>
                    <p className="text-2xl font-black text-purple-700">₹{selectedProduct.base_price_inr.toLocaleString('en-IN')}</p>
                  </div>
                  <Button
                    onClick={() => {
                      handleAddToCart(selectedProduct);
                      setQuickViewOpen(false);
                    }}
                    className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold"
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
