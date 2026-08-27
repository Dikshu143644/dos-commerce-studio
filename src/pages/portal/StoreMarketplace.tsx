import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  ShoppingCart,
  MapPin,
  Menu,
  X,
  ChevronDown,
  ChevronRight,
  Star,
  ShieldCheck,
  CheckCircle2,
  Eye,
  User,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/hooks/useAuth';

export interface StoreProduct {
  id: string;
  sku: string;
  name: string;
  brand: string;
  category: 'Electronics' | 'Industrial Parts' | 'Raw Materials' | 'Safety & Packaging';
  description: string;
  price_inr: number;
  mrp_inr: number;
  discount_pct: number;
  stock_quantity: number;
  min_order_qty: number;
  image: string;
  rating: number;
  reviews_count: number;
  is_sponsored?: boolean;
  is_bestseller?: boolean;
  delivery_time: string;
  specifications: string[];
}

export const marketplaceProducts: StoreProduct[] = [
  {
    id: 'prod-1',
    sku: 'PCB-PRO-001',
    name: 'Circuit Board Pro X1 (High-Freq Edge Computing PCB)',
    brand: 'AMD / DOS Fab',
    category: 'Electronics',
    description: 'Multi-layer high frequency printed circuit board for edge computing and IoT gateway controllers.',
    price_inr: 10000,
    mrp_inr: 14999,
    discount_pct: 33,
    stock_quantity: 142,
    min_order_qty: 5,
    image: '/images/products/circuit-board-pro.jpg',
    rating: 4.9,
    reviews_count: 113,
    is_sponsored: true,
    is_bestseller: true,
    delivery_time: 'FREE delivery Tomorrow 8am - 12pm',
    specifications: ['4-Layer FR4 Substrate', 'Gold Plated Solder Pads', 'Operating: -40°C to 85°C', 'Automated Surface Mount'],
  },
  {
    id: 'prod-2',
    sku: 'SRV-750W-002',
    name: 'Industrial Servo Motor 750W (AC Brushless with 24-bit Encoder)',
    brand: 'Apex Motion',
    category: 'Industrial Parts',
    description: 'High-torque AC brushless servo motor with integrated 24-bit magnetic absolute encoder.',
    price_inr: 27200,
    mrp_inr: 34000,
    discount_pct: 20,
    stock_quantity: 38,
    min_order_qty: 1,
    image: '/images/products/servo-motor.jpg',
    rating: 4.8,
    reviews_count: 86,
    is_bestseller: true,
    delivery_time: 'FREE delivery by Saturday, 29 Aug',
    specifications: ['750W Power Output', '3000 RPM Max Speed', 'IP65 Ingress Protection', '24-Bit Optical Encoder'],
  },
  {
    id: 'prod-3',
    sku: 'WIR-COP-250',
    name: 'Copper Wire 2.5mm Industrial Continuous Spool Reel (100m)',
    brand: 'Luminex Conductors',
    category: 'Raw Materials',
    description: 'Pure oxygen-free electrolytic copper wire with double insulation for industrial automation.',
    price_inr: 7040,
    mrp_inr: 9200,
    discount_pct: 23,
    stock_quantity: 280,
    min_order_qty: 2,
    image: '/images/products/copper-wire.jpg',
    rating: 4.9,
    reviews_count: 245,
    delivery_time: 'FREE delivery Tomorrow by 2 PM',
    specifications: ['99.99% OFC Electrolytic Copper', '100m Continuous Spool', '1100V Rated Voltage', 'Flame Retardant PVC'],
  },
  {
    id: 'prod-4',
    sku: 'LED-PAN-60W',
    name: 'Ultra-Bright Cleanroom Industrial LED Panel 60W PWM',
    brand: 'Luminex Pro',
    category: 'Electronics',
    description: 'Energy-efficient high CRI industrial cleanroom and factory LED lighting panel with PWM dimming.',
    price_inr: 5200,
    mrp_inr: 7500,
    discount_pct: 31,
    stock_quantity: 95,
    min_order_qty: 4,
    image: '/images/products/led-panel.jpg',
    rating: 4.7,
    reviews_count: 64,
    delivery_time: 'FREE delivery Sunday, 30 Aug',
    specifications: ['6000 Lumens Output', 'CRI > 90 True-Color', 'Die-cast Aluminum Housing', '50,000 Hours MTBF'],
  },
  {
    id: 'prod-5',
    sku: 'BRG-STL-800',
    name: 'Precision Steel Deep Groove Ball Bearings Set (ABEC-9)',
    brand: 'FAG Germany / DOS',
    category: 'Industrial Parts',
    description: 'ABEC-9 graded stainless steel deep groove ball bearings for high-RPM rotary machinery.',
    price_inr: 3600,
    mrp_inr: 4800,
    discount_pct: 25,
    stock_quantity: 18,
    min_order_qty: 5,
    image: '/images/products/steel-bearings.jpg',
    rating: 4.9,
    reviews_count: 142,
    delivery_time: 'FREE delivery Tomorrow 8am - 12pm',
    specifications: ['ABEC-9 Precision Tolerance', 'Chrome Steel 52100 Shell', 'Synthetic High-Temp Grease', 'Dual Rubber Seals'],
  },
  {
    id: 'prod-6',
    sku: 'THM-PST-007',
    name: 'Thermal Paste TG-7 Extreme High-Conductivity 14.5 W/mK (50g)',
    brand: 'KryoShield',
    category: 'Electronics',
    description: 'High thermal conductivity 14.5 W/mK non-conductive thermal interface compound (50g tube).',
    price_inr: 1800,
    mrp_inr: 2500,
    discount_pct: 28,
    stock_quantity: 115,
    min_order_qty: 10,
    image: '/images/products/thermal-paste.jpg',
    rating: 4.8,
    reviews_count: 318,
    delivery_time: 'FREE delivery Tomorrow by 11 AM',
    specifications: ['14.5 W/mK Conductivity', 'Zero Electrical Conductivity', '50g Syringe Dispenser', '-50°C to 240°C Range'],
  },
];

export default function StoreMarketplace() {
  useDocumentTitle('DOS-SHOP — Enterprise Wholesale Marketplace & B2B Store');
  const { profile } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [cartCount, setCartCount] = useState(2);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginInput, setLoginInput] = useState('');
  const [quickViewProduct, setQuickViewProduct] = useState<StoreProduct | null>(null);

  const filteredProducts = useMemo(() => {
    return marketplaceProducts.filter((p) => {
      const matchQuery =
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat =
        selectedCategory === 'All Categories' || p.category === selectedCategory;
      return matchQuery && matchCat;
    });
  }, [searchQuery, selectedCategory]);

  const handleAddToCart = (p: StoreProduct) => {
    setCartCount((prev) => prev + 1);

    // Save to localStorage for Abandoned Cart WhatsApp AI Agent
    try {
      const cart = JSON.parse(localStorage.getItem('dos_client_cart') || '[]');
      const itemIdx = cart.findIndex((i: any) => i.id === p.id);
      if (itemIdx > -1) {
        cart[itemIdx].quantity += p.min_order_qty;
      } else {
        cart.push({
          id: p.id,
          name: p.name,
          sku: p.sku,
          price: p.price_inr,
          quantity: p.min_order_qty,
          image: p.image,
          addedAt: new Date().toISOString(),
        });
      }
      localStorage.setItem('dos_client_cart', JSON.stringify(cart));
      localStorage.setItem('dos_cart_last_activity', new Date().toISOString());
    } catch {
      // ignore
    }

    toast.success(`Added to Cart: ${p.name}`, {
      description: `Price: ₹${p.price_inr.toLocaleString('en-IN')} (Min Qty: ${p.min_order_qty})`,
    });
  };

  const handleOtpLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput) {
      toast.error('Please enter email or mobile number');
      return;
    }
    toast.success(`OTP sent to ${loginInput}! Logging in as Verified B2B Buyer...`);
    setLoginModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#EAEDED] text-slate-900 font-sans">
      {/* 1. TOP AMAZON-NAVY HEADER (#131921) */}
      <header className="bg-[#131921] text-white sticky top-0 z-50 shadow-md">
        {/* Main Row */}
        <div className="max-w-[1500px] mx-auto px-4 py-2.5 flex items-center justify-between gap-4">
          {/* Logo & Pin Code */}
          <div className="flex items-center gap-6 shrink-0">
            <Link to="/portal/catalog" className="flex items-center gap-2 hover:outline hover:outline-1 hover:outline-white p-1 rounded">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 text-white font-black text-lg">
                D
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-black tracking-tight text-white leading-none">
                  DOS<span className="text-orange-400">SHOP</span>
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">.in Wholesale</span>
              </div>
            </Link>

            {/* Delivery Location Selector */}
            <div className="hidden lg:flex items-center gap-1.5 hover:outline hover:outline-1 hover:outline-white p-1.5 rounded cursor-pointer">
              <MapPin className="h-4 w-4 text-slate-300 shrink-0" />
              <div className="text-left leading-tight">
                <p className="text-[11px] text-slate-400">Delivering to Mumbai 400034</p>
                <p className="text-xs font-bold text-white">Update location</p>
              </div>
            </div>
          </div>

          {/* Central Search Bar */}
          <div className="flex-1 max-w-3xl flex items-center">
            <div className="flex w-full rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-orange-400 shadow-sm">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-[#E6E6E6] text-slate-800 text-xs font-semibold px-3 py-2.5 border-r border-slate-300 focus:outline-none cursor-pointer hidden sm:block"
              >
                <option>All Categories</option>
                <option>Electronics</option>
                <option>Industrial Parts</option>
                <option>Raw Materials</option>
              </select>
              <input
                type="text"
                placeholder="Search DOS-SHOP wholesale parts, electronics, SKUs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white text-slate-900 px-4 py-2 text-sm focus:outline-none placeholder:text-slate-400"
              />
              <button
                type="button"
                className="bg-[#FEBD69] hover:bg-[#F3A847] text-slate-900 px-5 flex items-center justify-center transition-colors cursor-pointer"
              >
                <Search className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Language */}
            <div className="hidden md:flex items-center gap-1 hover:outline hover:outline-1 hover:outline-white p-1.5 rounded cursor-pointer text-xs font-bold">
              <span>🇮🇳</span> EN <ChevronDown className="h-3 w-3 text-slate-400" />
            </div>

            {/* Account & Lists Hover Dropdown */}
            <div
              className="relative hover:outline hover:outline-1 hover:outline-white p-1.5 rounded cursor-pointer"
              onMouseEnter={() => setAccountMenuOpen(true)}
              onMouseLeave={() => setAccountMenuOpen(false)}
            >
              <div className="text-left leading-tight">
                <p className="text-[11px] text-slate-400">Hello, {profile?.full_name || 'Chris Evans'}</p>
                <p className="text-xs font-bold text-white flex items-center gap-0.5">
                  Account & Lists <ChevronDown className="h-3 w-3 text-slate-400" />
                </p>
              </div>

              {/* Amazon Style Account Dropdown Popover */}
              <AnimatePresence>
                {accountMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 top-full mt-1 w-80 bg-white text-slate-900 rounded-xl shadow-2xl border border-slate-200 p-5 z-50"
                  >
                    <div className="text-center pb-4 border-b border-slate-100">
                      <Button
                        onClick={() => setLoginModalOpen(true)}
                        className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-slate-900 font-bold text-xs py-2 rounded-lg shadow-sm"
                      >
                        Sign in to Wholesale Portal
                      </Button>
                      <p className="text-[11px] text-slate-500 mt-2">
                        New B2B Customer?{' '}
                        <button
                          onClick={() => setLoginModalOpen(true)}
                          className="text-purple-600 hover:underline font-bold"
                        >
                          Start here.
                        </button>
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pt-4 text-xs">
                      <div className="space-y-2 border-r border-slate-100 pr-2">
                        <p className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider">Your Lists</p>
                        <p className="text-slate-600 hover:text-orange-600 cursor-pointer">Saved Order Cart</p>
                        <p className="text-slate-600 hover:text-orange-600 cursor-pointer">Reorder Templates</p>
                        <p className="text-slate-600 hover:text-orange-600 cursor-pointer">Explore Wholesale</p>
                      </div>
                      <div className="space-y-2 pl-2">
                        <p className="font-extrabold text-slate-900 uppercase text-[10px] tracking-wider">Your Account</p>
                        <Link to="/portal/orders" className="block text-slate-600 hover:text-orange-600">Your Orders</Link>
                        <Link to="/portal/invoices" className="block text-slate-600 hover:text-orange-600">GST Invoices</Link>
                        <Link to="/portal/tracking" className="block text-slate-600 hover:text-orange-600">Track Shipment</Link>
                        <Link to="/" className="block text-purple-600 font-bold hover:underline">Switch to ERP Dashboard</Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Returns & Orders */}
            <Link
              to="/portal/orders"
              className="hidden sm:block hover:outline hover:outline-1 hover:outline-white p-1.5 rounded text-left leading-tight"
            >
              <p className="text-[11px] text-slate-400">Returns</p>
              <p className="text-xs font-bold text-white">&amp; Orders</p>
            </Link>

            {/* Cart Icon with real count badge */}
            <Link
              to="/portal/cart"
              className="flex items-center gap-1.5 hover:outline hover:outline-1 hover:outline-white p-1.5 rounded text-white"
            >
              <div className="relative">
                <ShoppingCart className="h-7 w-7 text-white" />
                <span className="absolute -top-1 right-1 bg-[#F08804] text-white text-[10px] font-black h-4 w-4 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              </div>
              <span className="font-black text-sm hidden sm:inline">Cart</span>
            </Link>
          </div>
        </div>

        {/* Sub-bar / Category Navigation */}
        <div className="bg-[#232F3E] text-white text-xs font-medium px-4 py-1.5">
          <div className="max-w-[1500px] mx-auto flex items-center gap-4 overflow-x-auto">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="flex items-center gap-1.5 font-bold hover:outline hover:outline-1 hover:outline-white px-2 py-1 rounded cursor-pointer whitespace-nowrap"
            >
              <Menu className="h-4 w-4" /> All
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('All Categories')}
              className="hover:outline hover:outline-1 hover:outline-white px-2 py-1 rounded whitespace-nowrap text-amber-300 font-bold"
            >
              ⚡ Today's Wholesale Deals
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('Electronics')}
              className="hover:outline hover:outline-1 hover:outline-white px-2 py-1 rounded whitespace-nowrap"
            >
              Electronics & Semiconductors
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('Industrial Parts')}
              className="hover:outline hover:outline-1 hover:outline-white px-2 py-1 rounded whitespace-nowrap"
            >
              Industrial Motors & Bearings
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory('Raw Materials')}
              className="hover:outline hover:outline-1 hover:outline-white px-2 py-1 rounded whitespace-nowrap"
            >
              Raw Materials & Copper
            </button>
            <Link
              to="/portal/invoices"
              className="hover:outline hover:outline-1 hover:outline-white px-2 py-1 rounded whitespace-nowrap text-emerald-400 font-bold"
            >
              GST ITC 100% Tax Invoices
            </Link>
            <Link
              to="/portal/tracking"
              className="hover:outline hover:outline-1 hover:outline-white px-2 py-1 rounded whitespace-nowrap"
            >
              Track Consignment
            </Link>
            <Link
              to="/"
              className="ml-auto bg-purple-600/80 hover:bg-purple-600 px-3 py-1 rounded-full text-white font-bold text-[11px] whitespace-nowrap"
            >
              Admin / Staff ERP Panel ↗
            </Link>
          </div>
        </div>
      </header>

      {/* 2. AMAZON-STYLE SLIDE-IN MEGA MENU DRAWER */}
      <AnimatePresence>
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 flex">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSidebarOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: -350 }}
              animate={{ x: 0 }}
              exit={{ x: -350 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-80 max-w-[85vw] h-full bg-white text-slate-900 shadow-2xl flex flex-col z-10 overflow-y-auto"
            >
              {/* Drawer User Banner */}
              <div className="bg-[#232F3E] text-white p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-white/20 flex items-center justify-center font-bold">
                    <User className="h-4 w-4" />
                  </div>
                  <p className="font-extrabold text-base">Hello, Chris Evans</p>
                </div>
                <button
                  type="button"
                  onClick={() => setSidebarOpen(false)}
                  className="text-white hover:text-slate-300"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Drawer Links */}
              <div className="p-4 space-y-6 text-sm">
                <div>
                  <h4 className="font-extrabold text-slate-900 uppercase text-xs tracking-wider mb-2">Trending</h4>
                  <div className="space-y-2 text-slate-700">
                    <p className="hover:text-purple-600 cursor-pointer">Bestsellers in Industrial Parts</p>
                    <p className="hover:text-purple-600 cursor-pointer">New Releases in Semiconductor PCBs</p>
                    <p className="hover:text-purple-600 cursor-pointer">Flash Deals under ₹999</p>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h4 className="font-extrabold text-slate-900 uppercase text-xs tracking-wider mb-2">Shop by Category</h4>
                  <div className="space-y-2 text-slate-700">
                    <div
                      onClick={() => {
                        setSelectedCategory('Electronics');
                        setSidebarOpen(false);
                      }}
                      className="flex items-center justify-between hover:text-purple-600 cursor-pointer py-1"
                    >
                      <span>Electronics & Microchips</span> <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                    <div
                      onClick={() => {
                        setSelectedCategory('Industrial Parts');
                        setSidebarOpen(false);
                      }}
                      className="flex items-center justify-between hover:text-purple-600 cursor-pointer py-1"
                    >
                      <span>Industrial Motors & Bearings</span> <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                    <div
                      onClick={() => {
                        setSelectedCategory('Raw Materials');
                        setSidebarOpen(false);
                      }}
                      className="flex items-center justify-between hover:text-purple-600 cursor-pointer py-1"
                    >
                      <span>Raw Materials & Copper Wire</span> <ChevronRight className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                </div>

                <div className="border-t border-slate-100 pt-4">
                  <h4 className="font-extrabold text-slate-900 uppercase text-xs tracking-wider mb-2">B2B Enterprise Portal</h4>
                  <div className="space-y-2 text-slate-700">
                    <Link to="/portal/orders" className="block hover:text-purple-600 py-1">Order History & POs</Link>
                    <Link to="/portal/invoices" className="block hover:text-purple-600 py-1">GST Tax Invoices</Link>
                    <Link to="/portal/tracking" className="block hover:text-purple-600 py-1">Live Courier GPS Tracking</Link>
                    <Link to="/crm/quotations" className="block hover:text-purple-600 py-1">Custom RFQ Proposals</Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. HERO PROMOTIONAL BANNER & 4-IN-1 DEALS GRID */}
      <main className="max-w-[1500px] mx-auto px-4 py-4 space-y-6">
        {/* Main Hero Banner */}
        <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200">
          <img
            src="/images/banners/ecommerce-hero.jpg"
            alt="Wholesale Deals Event"
            className="w-full h-auto max-h-[380px] object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6 sm:p-10 text-white">
            <span className="bg-orange-500 text-white text-xs font-black uppercase px-3 py-1 rounded-full w-max mb-2">
              MEGA B2B SALES EVENT • UP TO 70% OFF
            </span>
            <h1 className="text-2xl sm:text-4xl font-black">Industrial Components, PCBs & LED Hardware</h1>
            <p className="text-xs sm:text-sm text-slate-200 mt-1 max-w-xl">
              Direct factory fulfillment from Mumbai, Delhi, Bangalore & Kolkata hubs with 100% verified GST ITC offset.
            </p>
          </div>
        </div>

        {/* Flipkart-Style Flash Sale Strip */}
        <div className="relative rounded-2xl overflow-hidden shadow-md border border-cyan-300">
          <img
            src="/images/banners/flash-sale.jpg"
            alt="Flash Sale"
            className="w-full h-auto max-h-[140px] object-cover"
          />
        </div>

        {/* 4-in-1 Bento Deal Cards (Amazon / Flipkart Style) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Electronics */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between space-y-3">
            <h3 className="font-extrabold text-base text-slate-900 leading-tight">
              Up to 60% off | Bestselling Electronics
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1 text-center cursor-pointer group">
                <div className="bg-slate-100 rounded-xl overflow-hidden aspect-square flex items-center justify-center p-1">
                  <img src="/images/products/circuit-board-pro.jpg" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <p className="text-[11px] font-bold text-slate-700 truncate">Circuit Board Pro</p>
                <p className="text-[10px] text-emerald-600 font-bold">₹10,000</p>
              </div>
              <div className="space-y-1 text-center cursor-pointer group">
                <div className="bg-slate-100 rounded-xl overflow-hidden aspect-square flex items-center justify-center p-1">
                  <img src="/images/products/led-panel.jpg" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <p className="text-[11px] font-bold text-slate-700 truncate">LED Panel 60W</p>
                <p className="text-[10px] text-emerald-600 font-bold">₹5,200</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCategory('Electronics')}
              className="text-xs text-purple-700 hover:underline font-bold text-left pt-2 border-t border-slate-100"
            >
              Explore all Electronics &rarr;
            </button>
          </div>

          {/* Card 2: Motors & Bearings */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between space-y-3">
            <h3 className="font-extrabold text-base text-slate-900 leading-tight">
              Industrial Motors &amp; Bearings | Starting ₹3,600
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1 text-center cursor-pointer group">
                <div className="bg-slate-100 rounded-xl overflow-hidden aspect-square flex items-center justify-center p-1">
                  <img src="/images/products/servo-motor.jpg" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <p className="text-[11px] font-bold text-slate-700 truncate">Servo Motor 750W</p>
                <p className="text-[10px] text-emerald-600 font-bold">₹27,200</p>
              </div>
              <div className="space-y-1 text-center cursor-pointer group">
                <div className="bg-slate-100 rounded-xl overflow-hidden aspect-square flex items-center justify-center p-1">
                  <img src="/images/products/steel-bearings.jpg" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <p className="text-[11px] font-bold text-slate-700 truncate">Steel Bearings</p>
                <p className="text-[10px] text-emerald-600 font-bold">₹3,600</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCategory('Industrial Parts')}
              className="text-xs text-purple-700 hover:underline font-bold text-left pt-2 border-t border-slate-100"
            >
              See all Industrial Parts &rarr;
            </button>
          </div>

          {/* Card 3: Raw Materials */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between space-y-3">
            <h3 className="font-extrabold text-base text-slate-900 leading-tight">
              Raw Materials &amp; Thermal Compounds
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1 text-center cursor-pointer group">
                <div className="bg-slate-100 rounded-xl overflow-hidden aspect-square flex items-center justify-center p-1">
                  <img src="/images/products/copper-wire.jpg" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <p className="text-[11px] font-bold text-slate-700 truncate">Copper Wire 2.5mm</p>
                <p className="text-[10px] text-emerald-600 font-bold">₹7,040</p>
              </div>
              <div className="space-y-1 text-center cursor-pointer group">
                <div className="bg-slate-100 rounded-xl overflow-hidden aspect-square flex items-center justify-center p-1">
                  <img src="/images/products/thermal-paste.jpg" alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
                <p className="text-[11px] font-bold text-slate-700 truncate">Thermal Paste TG-7</p>
                <p className="text-[10px] text-emerald-600 font-bold">₹1,800</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setSelectedCategory('Raw Materials')}
              className="text-xs text-purple-700 hover:underline font-bold text-left pt-2 border-t border-slate-100"
            >
              View Raw Materials &rarr;
            </button>
          </div>

          {/* Card 4: Wholesale GST Benefit */}
          <div className="bg-gradient-to-br from-purple-700 to-indigo-900 text-white rounded-2xl p-5 shadow-md flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <span className="bg-white/20 text-white text-[10px] font-black uppercase px-2.5 py-1 rounded-full">
                GST INPUT CREDIT
              </span>
              <h3 className="font-extrabold text-lg leading-tight">
                Claim 18% Input Tax Credit on All Orders
              </h3>
              <p className="text-xs text-purple-200 leading-relaxed">
                Add your GSTIN at checkout to receive automated GSTR-1 compliant electronic tax invoices instantly.
              </p>
            </div>
            <Link
              to="/portal/invoices"
              className="w-full bg-yellow-400 hover:bg-yellow-500 text-slate-900 font-black text-xs py-2.5 rounded-xl text-center shadow-md transition-colors block"
            >
              Download GST Tax Invoices
            </Link>
          </div>
        </div>

        {/* 4. PRODUCT STREAM (AMAZON / FLIPKART STYLE PRODUCT LIST) */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200 pb-4 gap-2">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                {selectedCategory === 'All Categories' ? 'All Wholesale Products' : selectedCategory}
              </h2>
              <p className="text-xs text-slate-500">Showing {filteredProducts.length} verified industrial SKUs</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400">Sort by:</span>
              <select className="bg-slate-50 border border-slate-200 text-xs font-bold px-3 py-1.5 rounded-xl">
                <option>Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Customer Rating</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.map((p) => (
              <div
                key={p.id}
                className="rounded-2xl border border-slate-200 hover:border-orange-400 hover:shadow-lg transition-all p-5 flex flex-col justify-between bg-white group relative"
              >
                {p.is_bestseller && (
                  <div className="absolute top-4 left-4 z-10">
                    <span className="bg-[#E67A00] text-white text-[10px] font-black uppercase px-2.5 py-0.5 rounded shadow-sm">
                      #1 Best Seller
                    </span>
                  </div>
                )}

                <div>
                  {/* Product Image */}
                  <div className="relative rounded-xl overflow-hidden bg-slate-100 aspect-square flex items-center justify-center p-3 mb-4">
                    <img
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      type="button"
                      onClick={() => setQuickViewProduct(p)}
                      className="absolute bottom-2 right-2 bg-black/70 hover:bg-black text-white text-[10px] font-bold px-2 py-1 rounded-lg backdrop-blur-xs flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Eye className="h-3 w-3" /> Quick Specs
                    </button>
                  </div>

                  {/* Details */}
                  <div className="space-y-1.5">
                    {p.is_sponsored && (
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Sponsored
                      </span>
                    )}
                    <h3 className="font-bold text-sm text-slate-900 group-hover:text-purple-700 transition-colors line-clamp-2">
                      {p.name}
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">{p.brand}</p>

                    {/* Rating */}
                    <div className="flex items-center gap-1 text-xs">
                      <div className="flex items-center text-amber-500">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        <span className="font-bold text-slate-800 ml-1">{p.rating}</span>
                      </div>
                      <span className="text-slate-400 text-[11px]">({p.reviews_count})</span>
                    </div>

                    {/* Pricing */}
                    <div className="pt-2">
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs text-rose-600 font-bold">-{p.discount_pct}%</span>
                        <span className="text-2xl font-black text-slate-900">
                          ₹{p.price_inr.toLocaleString('en-IN')}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        M.R.P.: <span className="line-through">₹{p.mrp_inr.toLocaleString('en-IN')}</span> (Min order: {p.min_order_qty} units)
                      </p>
                    </div>

                    {/* Delivery */}
                    <p className="text-xs text-slate-700 font-medium pt-1">
                      {p.delivery_time}
                    </p>
                  </div>
                </div>

                {/* Add to cart button (Amazon yellow) */}
                <div className="pt-4 border-t border-slate-100 mt-4">
                  <Button
                    onClick={() => handleAddToCart(p)}
                    className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-slate-900 font-black text-xs py-2.5 rounded-full shadow-sm cursor-pointer transition-colors"
                  >
                    Add to Cart
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* 5. FLIPKART STYLE 2-COLUMN LOGIN MODAL */}
      <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-3xl bg-white border-0 shadow-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-5 min-h-[420px]">
            {/* Left Blue Column (Flipkart Style) */}
            <div className="sm:col-span-2 bg-[#2874F0] text-white p-8 flex flex-col justify-between">
              <div className="space-y-3">
                <h3 className="text-2xl font-black">Login</h3>
                <p className="text-xs text-blue-100 leading-relaxed">
                  Get access to your Wholesale Orders, Quotations, and GST Tax Invoices
                </p>
              </div>
              <div className="text-center pt-8">
                <div className="h-24 w-24 rounded-full bg-white/10 mx-auto flex items-center justify-center text-white">
                  <ShieldCheck className="h-14 w-14" />
                </div>
                <p className="text-[10px] text-blue-200 mt-3 font-semibold">100% Secure Enterprise Auth</p>
              </div>
            </div>

            {/* Right Form Column */}
            <div className="sm:col-span-3 p-8 flex flex-col justify-between">
              <form onSubmit={handleOtpLogin} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Enter Email / Mobile number *</label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. procurement@apexindustrial.in"
                    value={loginInput}
                    onChange={(e) => setLoginInput(e.target.value)}
                    className="border-b-2 border-slate-300 rounded-none border-x-0 border-t-0 px-0 focus:border-[#2874F0] focus:ring-0 text-sm"
                  />
                  <p className="text-[10px] text-slate-400">
                    By continuing, you agree to DOS-CRM-ERP's Terms of Use and Privacy Policy.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-[#FB641B] hover:bg-[#E8560F] text-white font-black text-sm py-3 rounded-md shadow-md cursor-pointer"
                >
                  Request OTP / Sign In
                </Button>
              </form>

              <div className="text-center pt-6 border-t border-slate-100">
                <p className="text-xs text-[#2874F0] font-bold hover:underline cursor-pointer">
                  New to DOS-SHOP? Create an account
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Quick Specs Modal */}
      {quickViewProduct && (
        <Dialog open={!!quickViewProduct} onOpenChange={() => setQuickViewProduct(null)}>
          <DialogContent className="max-w-2xl rounded-3xl p-6 sm:p-8 bg-white border border-slate-200">
            <DialogHeader>
              <div className="flex items-center gap-2 text-purple-600 mb-1">
                <ShieldCheck className="h-5 w-5" />
                <span className="text-xs font-bold uppercase">{quickViewProduct.sku}</span>
              </div>
              <DialogTitle className="text-xl font-extrabold text-slate-900">{quickViewProduct.name}</DialogTitle>
              <DialogDescription className="text-xs text-slate-500">
                Technical specifications and bulk wholesale availability.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
              <div className="rounded-2xl overflow-hidden bg-slate-900 aspect-square">
                <img src={quickViewProduct.image} alt={quickViewProduct.name} className="w-full h-full object-cover" />
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <h4 className="font-bold text-slate-900 uppercase text-[11px] mb-2">Technical Datasheet</h4>
                  <ul className="space-y-2 text-slate-700">
                    {quickViewProduct.specifications.map((s, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="h-3.5 w-3.5 text-purple-600 shrink-0" /> {s}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-2 border-t border-slate-100">
                  <p className="text-slate-400">Wholesale Price</p>
                  <p className="text-2xl font-black text-slate-900">₹{quickViewProduct.price_inr.toLocaleString('en-IN')}</p>
                  <p className="text-[11px] text-emerald-600 font-semibold">{quickViewProduct.delivery_time}</p>
                </div>

                <Button
                  onClick={() => {
                    handleAddToCart(quickViewProduct);
                    setQuickViewProduct(null);
                  }}
                  className="w-full bg-[#FFD814] hover:bg-[#F7CA00] text-slate-900 font-black text-xs py-2 rounded-lg"
                >
                  Add to Cart
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
