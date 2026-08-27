import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Package,
  TrendingUp,
  Sparkles,
  ChevronDown,
  Check,
  ShieldCheck,
  Zap,
  Clock,
  CheckCircle2,
  Bot,
  Warehouse,
  ShoppingCart,
  Layers,
  BrainCircuit,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function LandingPage() {
  useDocumentTitle('DOS-CRM-ERP — Unified B2B E-Commerce, Multi-Warehouse ERP & Intelligent CRM');

  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [heroView, setHeroView] = useState<'overview' | 'marketplace' | 'warehouses' | 'ai'>('overview');
  const [monthlyVolume, setMonthlyVolume] = useState<number>(2500000); // 25 Lakhs default
  const [thoughtExpanded, setThoughtExpanded] = useState<boolean>(true);

  const gstSavings = Math.round(monthlyVolume * 0.18);
  const stockoutSavings = Math.round(monthlyVolume * 0.082);
  const totalAnnualValue = Math.round((gstSavings + stockoutSavings) * 12);

  const faqs = [
    {
      q: 'How does DOS-CRM-ERP handle multi-warehouse inventory sync?',
      a: 'DOS-CRM-ERP maintains a centralized, low-latency stock ledger across 6 primary hubs (Mumbai WH-MUM, Delhi WH-DEL, Bangalore WH-BLR, Kolkata WH-KOL, Pune WH-PUN, Ahmedabad WH-AMD). When a sales order or transfer is confirmed, stock levels, valuations, and bin allocations update instantaneously with full tamper-proof audit logs in MongoDB Atlas.',
    },
    {
      q: 'Is GST, E-Way Bill and E-Invoicing built into the billing module?',
      a: 'Yes! DOS-CRM-ERP natively generates GST-compliant commercial invoices with automated CGST/SGST/IGST breakdown, HSN Table 12 classification, and GSTR-1 / GSTR-3B JSON export capabilities in Indian Rupees (₹).',
    },
    {
      q: 'How does the B2B Wholesale Storefront (/store) work for client buyers?',
      a: 'Wholesale buyers get an Amazon/Flipkart-grade shopping experience with live stock availability, tiered volume discounts, 2-column OTP buyer login, instant cart checkout, and live GPS courier tracking.',
    },
    {
      q: 'How does the Gemini M-Model AI Multi-Agent copilot assist our team?',
      a: 'Our AI Multi-Agent engine provides deep cognitive reasoning with expandable thought traces (<thinking>). It automates stock reorder drafts, analyzes lead win probabilities, calculates profit margins in Indian Rupees (₹), and answers complex supply chain inquiries.',
    },
    {
      q: 'Can our sales team integrate with MongoDB Atlas and Google Workspace?',
      a: 'Absolutely. DOS-CRM-ERP synchronizes with MongoDB Atlas cloud clusters in real time, generates one-click XLSX spreadsheets, and manages customer deal stages with 5-phase Kanban velocity.',
    },
  ];

  const brandLogos = [
    { name: 'ACURA FAB', symbol: '◆', color: 'text-sky-500' },
    { name: 'LUMINEX PRO', symbol: '⚡', color: 'text-amber-500' },
    { name: 'APEX AUTOMATION', symbol: '▲', color: 'text-rose-500' },
    { name: 'SWIFT LOGISTICS', symbol: '✦', color: 'text-emerald-500' },
    { name: 'INNOVATE ROBOTICS', symbol: '●', color: 'text-purple-500' },
    { name: 'BHARAT PRECISION', symbol: '❖', color: 'text-indigo-500' },
    { name: 'METRO COMMERCE', symbol: '■', color: 'text-blue-500' },
  ];

  const showcaseProducts = [
    {
      id: 'prod-1',
      name: 'Circuit Board Pro X1',
      subtitle: 'High-Freq Edge Computing PCB',
      price: 10000,
      mrp: 14999,
      discount: '33% OFF',
      stock: 142,
      category: 'Electronics',
      badge: 'Bestseller',
      img: '/images/products/circuit-board-pro.jpg',
      rating: 4.9,
    },
    {
      id: 'prod-2',
      name: 'AC Servo Motor 750W',
      subtitle: 'Brushless with 24-bit Encoder',
      price: 27200,
      mrp: 34000,
      discount: '20% OFF',
      stock: 38,
      category: 'Industrial',
      badge: 'Top Rated',
      img: '/images/products/servo-motor.jpg',
      rating: 4.8,
    },
    {
      id: 'prod-3',
      name: 'Copper Wire 2.5mm Reel',
      subtitle: '100m Continuous Electrolytic Spool',
      price: 7040,
      mrp: 9200,
      discount: '23% OFF',
      stock: 280,
      category: 'Raw Materials',
      badge: 'Bulk Favorite',
      img: '/images/products/copper-wire.jpg',
      rating: 4.9,
    },
    {
      id: 'prod-4',
      name: 'Cleanroom LED Panel 60W',
      subtitle: 'Industrial Factory Lighting PWM',
      price: 5200,
      mrp: 7500,
      discount: '31% OFF',
      stock: 95,
      category: 'Electronics',
      badge: 'Energy Star',
      img: '/images/products/led-panel.jpg',
      rating: 4.7,
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans selection:bg-purple-600 selection:text-white scroll-smooth overflow-x-hidden">
      {/* Top Banner with Pulse Indicator */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-indigo-950 text-white text-xs font-semibold py-2.5 px-4 text-center flex flex-wrap items-center justify-center gap-3 border-b border-purple-800/40">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="bg-purple-500/30 text-purple-200 uppercase text-[10px] font-bold px-2 py-0.5 rounded-full border border-purple-400/30">
            v4.5 LIVE
          </span>
        </div>
        <span>
          <strong>DOS-CRM-ERP</strong> Unified Platform: Amazon/Flipkart B2B Storefront + Multi-Warehouse Logistics + M-Model AI Copilot.
        </span>
        <Link
          to="/store"
          className="bg-purple-600 hover:bg-purple-500 text-white text-[11px] font-bold px-3 py-1 rounded-full transition-all inline-flex items-center gap-1 shadow-sm"
        >
          Explore Wholesale Store <ArrowRight className="h-3 w-3 inline" />
        </Link>
      </div>

      {/* Sticky Glassmorphism Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-white/90 border-b border-slate-200/80 shadow-xs transition-all">
        <div className="max-w-7xl mx-auto px-6 h-18 flex items-center justify-between">
          {/* Logo Branding */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-purple-700 via-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-600/25 group-hover:scale-105 transition-transform">
              <span className="text-xl font-black text-white">D</span>
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-slate-900 leading-none">
                  DOS<span className="text-purple-600">CRM</span>
                </span>
                <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-1.5 py-0.2 rounded border border-purple-200 uppercase">
                  ERP
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-400 leading-none mt-0.5">
                B2B E-Commerce & Logistics
              </span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-semibold text-slate-600">
            <a href="#product" className="hover:text-purple-600 transition-colors">Overview</a>
            <Link to="/store" className="hover:text-purple-600 transition-colors flex items-center gap-1 text-purple-600 font-bold">
              <ShoppingCart className="h-3.5 w-3.5" /> B2B Storefront
            </Link>
            <a href="#pipeline" className="hover:text-purple-600 transition-colors">Pipeline</a>
            <a href="#roi-calculator" className="hover:text-purple-600 transition-colors">ROI Calculator</a>
            <a href="#solutions" className="hover:text-purple-600 transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-purple-600 transition-colors">Pricing (₹)</a>
            <a href="#faq" className="hover:text-purple-600 transition-colors">FAQ</a>
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="hidden sm:inline-flex rounded-full text-xs font-bold border-purple-200 text-purple-700 bg-purple-50/60 hover:bg-purple-100/70"
            >
              <Link to="/ai">
                <BrainCircuit className="h-3.5 w-3.5 mr-1.5 text-purple-600 animate-pulse" /> AI Assistant
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="rounded-full px-4 text-slate-700 font-bold hover:bg-slate-100"
            >
              <Link to="/login">Sign In</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="rounded-full px-5 bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-md shadow-purple-600/25 transition-all hover:scale-105"
            >
              <Link to="/inventory/products">
                Launch App <ArrowRight className="h-3.5 w-3.5 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section with Spatial UI & Glassmorphism */}
      <section id="product" className="relative pt-12 pb-24 overflow-hidden bg-gradient-to-b from-purple-50/60 via-[#F8FAFC] to-[#F8FAFC]">
        {/* Background Ambient Glows */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-gradient-to-tr from-purple-400/20 via-indigo-400/15 to-pink-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Pill Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-purple-200 text-purple-800 text-xs font-extrabold shadow-xs">
              <span className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
              NO.1 UNIFIED B2B E-COMMERCE & MULTI-WAREHOUSE ERP PLATFORM
            </div>
          </div>

          {/* Headline */}
          <div className="text-center max-w-4xl mx-auto space-y-5">
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
              Empower Your Commerce With{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600">
                Unified ERP & Intelligent CRM
              </span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
              Unify Amazon & Flipkart-grade wholesale e-commerce with real-time stock routing across Mumbai, Delhi, Bangalore, Kolkata, Pune & Ahmedabad hubs. Powered by Gemini M-Model Cognitive AI in Indian Rupees (₹).
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-4 pt-3">
              <Button
                size="lg"
                asChild
                className="rounded-full px-8 h-12 text-sm sm:text-base font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xl shadow-purple-600/30 gap-2 transition-all hover:scale-105"
              >
                <Link to="/store">
                  <ShoppingCart className="h-4 w-4" /> B2B Marketplace Storefront
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                asChild
                className="rounded-full px-7 h-12 text-sm sm:text-base font-bold border-slate-300 bg-white text-slate-800 hover:bg-slate-50 gap-2 shadow-xs"
              >
                <Link to="/inventory/products">
                  <Package className="h-4 w-4 text-purple-600" /> Enter ERP Dashboard
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                asChild
                className="rounded-full px-6 h-12 text-sm sm:text-base font-bold border-purple-200 text-purple-700 bg-purple-50/50 hover:bg-purple-100/60 gap-2"
              >
                <Link to="/ai">
                  <Sparkles className="h-4 w-4 text-purple-600" /> M-Model AI Copilot
                </Link>
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="flex flex-wrap items-center justify-center gap-6 pt-4 text-xs font-semibold text-slate-500">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> Live MongoDB Atlas Sync
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 100% Indian Rupees (₹) & GST Ready
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" /> 6 Nationwide Logistics Hubs
              </span>
            </div>
          </div>

          {/* Interactive Multi-View Hero Simulator */}
          <div className="relative mt-14 max-w-5xl mx-auto">
            {/* View Selector Tabs */}
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="bg-slate-200/80 p-1 rounded-full flex flex-wrap items-center gap-1 shadow-inner">
                <button
                  type="button"
                  onClick={() => setHeroView('overview')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    heroView === 'overview'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" /> Executive KPI Overview
                </button>
                <button
                  type="button"
                  onClick={() => setHeroView('marketplace')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    heroView === 'marketplace'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShoppingCart className="h-3.5 w-3.5" /> B2B Marketplace (/store)
                </button>
                <button
                  type="button"
                  onClick={() => setHeroView('warehouses')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    heroView === 'warehouses'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Warehouse className="h-3.5 w-3.5" /> Multi-Hub Logistics
                </button>
                <button
                  type="button"
                  onClick={() => setHeroView('ai')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    heroView === 'ai'
                      ? 'bg-white text-purple-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <BrainCircuit className="h-3.5 w-3.5" /> AI M-Model Reasoning
                </button>
              </div>
            </div>

            {/* Hero Main Card Container */}
            <div className="rounded-3xl bg-white p-6 sm:p-8 shadow-[0_25px_60px_rgba(124,58,237,0.12)] border border-slate-200/90 relative overflow-hidden">
              {/* VIEW 1: EXECUTIVE KPI OVERVIEW */}
              {heroView === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* 1. Inventory Valuation */}
                    <div className="bg-slate-50/90 rounded-2xl p-5 border border-slate-200/70 relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Inventory Valuation</span>
                        <span className="bg-emerald-100 text-emerald-700 text-[10px] font-black px-2 py-0.5 rounded-full">+18.4%</span>
                      </div>
                      <h3 className="text-2xl sm:text-3xl font-black text-slate-900">₹1,42,00,000</h3>
                      <p className="text-xs text-slate-500 mt-1">Across 6 Mega Hubs (Mumbai, Delhi, BLR, KOL, PUN, AMD)</p>
                      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                        <span className="text-slate-500">Low Stock Alert:</span>
                        <span className="font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200/60">3 SKUs Flagged</span>
                      </div>
                    </div>

                    {/* 2. Active Pipeline */}
                    <div className="bg-purple-50/40 rounded-2xl p-5 border border-purple-200/60 relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-purple-700 uppercase tracking-wider">Active Deals Pipeline</span>
                        <span className="text-xs font-bold text-purple-600">12 Deals</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-full border-4 border-purple-600 border-t-purple-200 flex items-center justify-center font-black text-sm text-purple-700 shrink-0">
                          68%
                        </div>
                        <div>
                          <h3 className="text-2xl font-black text-slate-900">₹63,80,000</h3>
                          <p className="text-xs text-slate-500">Weighted Forecast Value</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center gap-3 text-[11px] text-slate-600">
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-purple-600" /> Apex Auto</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-orange-500" /> Lumina</span>
                        <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Acura</span>
                      </div>
                    </div>

                    {/* 3. Latest Deal Won */}
                    <div className="bg-slate-50/90 rounded-2xl p-5 border border-slate-200/70 relative">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Latest Deal Won</span>
                        <span className="bg-purple-100 text-purple-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">Closed Today</span>
                      </div>
                      <h3 className="text-xl font-black text-slate-900">Acura Fab Inc.</h3>
                      <p className="text-sm font-bold text-emerald-600 mt-1">₹78,12,000 CONTRACT VALUE</p>
                      <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
                        <span>Fulfillment Hub:</span>
                        <span className="font-semibold text-slate-700">Mumbai Central (WH-MUM)</span>
                      </div>
                    </div>
                  </div>

                  {/* Live Product Preview Strip */}
                  <div className="pt-4 border-t border-slate-200/80">
                    <div className="flex items-center justify-between mb-3 text-xs">
                      <span className="font-bold text-slate-700 flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        LIVE PRODUCT TELEMETRY
                      </span>
                      <Link to="/store" className="text-purple-600 font-bold hover:underline inline-flex items-center gap-1">
                        View B2B Storefront <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {showcaseProducts.slice(0, 3).map((prod) => (
                        <div key={prod.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center gap-3">
                          <img src={prod.img} alt={prod.name} className="h-10 w-10 rounded-lg object-cover bg-white border border-slate-200" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-800 truncate">{prod.name}</p>
                            <p className="text-[11px] text-slate-500">₹{prod.price.toLocaleString('en-IN')} • {prod.stock} in Stock</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* VIEW 2: B2B MARKETPLACE SHOWCASE */}
              {heroView === 'marketplace' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between bg-gradient-to-r from-purple-900 to-indigo-900 text-white p-4 rounded-2xl">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase tracking-widest bg-orange-500 text-white px-2 py-0.5 rounded-full">
                        FLASH WHOLESALE DEAL
                      </span>
                      <h4 className="text-lg font-black mt-1">Tier-1 Industrial Components • Save up to 35%</h4>
                    </div>
                    <Button asChild size="sm" className="bg-white text-purple-900 font-bold hover:bg-slate-100 rounded-full">
                      <Link to="/store">Open Full Marketplace</Link>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    {showcaseProducts.map((p) => (
                      <div key={p.id} className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-col justify-between group hover:shadow-md transition-all">
                        <div>
                          <div className="aspect-square bg-white rounded-xl overflow-hidden border border-slate-200 mb-3 relative">
                            <img src={p.img} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <span className="absolute top-2 left-2 text-[9px] font-extrabold bg-purple-600 text-white px-1.5 py-0.5 rounded">
                              {p.discount}
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-purple-700 uppercase">{p.category}</span>
                          <h5 className="text-xs font-bold text-slate-900 line-clamp-1 mt-0.5">{p.name}</h5>
                          <p className="text-[11px] text-slate-500 line-clamp-1">{p.subtitle}</p>
                        </div>
                        <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between">
                          <div>
                            <span className="text-xs font-black text-slate-900">₹{p.price.toLocaleString('en-IN')}</span>
                            <span className="text-[10px] text-slate-400 line-through ml-1">₹{p.mrp.toLocaleString('en-IN')}</span>
                          </div>
                          <Link to="/store" className="text-[11px] font-bold text-purple-600 hover:underline">
                            Add +
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VIEW 3: MULTI-WAREHOUSE LOGISTICS */}
              {heroView === 'warehouses' && (
                <div className="space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-base font-extrabold text-slate-900">6 Strategic Multi-Warehouse Network</h4>
                      <p className="text-xs text-slate-500">Live telemetry, square footage utilization & active SKU telemetry</p>
                    </div>
                    <Button asChild size="sm" variant="outline" className="rounded-full text-xs font-bold border-purple-200 text-purple-700">
                      <Link to="/inventory/warehouses">Manage Transfers</Link>
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                      { code: 'WH-MUM', name: 'Mumbai Central Hub', util: 84, skus: 480, area: '42,000 / 50,000 sq ft', status: 'Optimal' },
                      { code: 'WH-DEL', name: 'Delhi NCR Depot', util: 68, skus: 320, area: '27,200 / 40,000 sq ft', status: 'Optimal' },
                      { code: 'WH-BLR', name: 'Bangalore Electronics', util: 92, skus: 290, area: '32,200 / 35,000 sq ft', status: 'High Cap' },
                      { code: 'WH-KOL', name: 'Kolkata Port Depot', util: 45, skus: 160, area: '13,500 / 30,000 sq ft', status: 'Optimal' },
                      { code: 'WH-PUN', name: 'Pune Auto-Industrial', util: 76, skus: 210, area: '19,000 / 25,000 sq ft', status: 'Optimal' },
                      { code: 'WH-AMD', name: 'Ahmedabad Commerce', util: 58, skus: 145, area: '11,600 / 20,000 sq ft', status: 'Optimal' },
                    ].map((hub) => (
                      <div key={hub.code} className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] font-black text-purple-700 bg-purple-100 px-1.5 py-0.5 rounded font-mono">
                            {hub.code}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            hub.util > 85 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {hub.status}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-900">{hub.name}</h5>
                        <p className="text-[10px] text-slate-500 mb-2">{hub.skus} SKUs • {hub.area}</p>
                        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${hub.util > 85 ? 'bg-amber-500' : 'bg-purple-600'}`}
                            style={{ width: `${hub.util}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* VIEW 4: AI M-MODEL REASONING */}
              {heroView === 'ai' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-xl bg-purple-600 flex items-center justify-center text-white">
                        <BrainCircuit className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">M-Model Deep Cognitive Reasoning</h4>
                        <p className="text-[11px] text-slate-500">Live multi-step logic grounded in active MongoDB Atlas telemetry</p>
                      </div>
                    </div>
                    <Button asChild size="sm" className="rounded-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs">
                      <Link to="/ai">Open Chat Interface</Link>
                    </Button>
                  </div>

                  {/* Thinking Block Component Preview */}
                  <div className="rounded-2xl border border-purple-500/25 bg-gradient-to-r from-purple-950/30 via-indigo-950/20 to-purple-950/30 p-3.5 backdrop-blur-md">
                    <button
                      type="button"
                      onClick={() => setThoughtExpanded(!thoughtExpanded)}
                      className="w-full flex items-center justify-between text-xs font-bold text-purple-800 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        <BrainCircuit className="h-3.5 w-3.5 text-purple-600 animate-pulse" />
                        <span className="bg-gradient-to-r from-purple-700 via-indigo-700 to-pink-700 bg-clip-text text-transparent font-bold">
                          Thought Process (M-Model Deep Reasoning)
                        </span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 border border-purple-300">
                          Cognitive Trace
                        </span>
                      </div>
                      <span className="text-[11px] text-purple-600 font-semibold">
                        {thoughtExpanded ? 'Hide logic' : 'Show reasoning'}
                      </span>
                    </button>

                    {thoughtExpanded && (
                      <div className="mt-2.5 pt-2.5 border-t border-purple-200/60 text-[11px] text-slate-700 font-mono leading-relaxed bg-white/80 p-3 rounded-xl">
                        1. Intent: Analyze stock levels for 750W Servo Motors & trigger PO recommendation.<br />
                        2. DB Query: WH-MUM (14 units), WH-DEL (12 units), WH-BLR (12 units) $\rightarrow$ Total: 38 units.<br />
                        3. Logic: Reorder threshold is 40 units. Current deficit: 2 units below safety stock.<br />
                        4. Action: Synthesize supplier PO draft to Bharat Precision Motors for 50 units at ₹22,000/unit.
                      </div>
                    )}
                  </div>

                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs text-slate-800">
                    <p className="font-bold text-purple-900 mb-1">🤖 Assistant Response:</p>
                    <p className="leading-relaxed">
                      "AC Servo Motors (750W) currently stand at <strong>38 units</strong> across Mumbai, Delhi, and Bangalore hubs, which is 2 units below your safety threshold (40 units). I have drafted a Purchase Order for 50 units (₹11,00,000) for supplier <strong>Bharat Precision Motors</strong> ready for 1-click execution."
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Brands Strip */}
      <section className="py-10 border-y border-slate-200/80 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-6">
            TRUSTED BY FAST-GROWING LOGISTICS, ELECTRONICS & MANUFACTURING GIANTS
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
            {brandLogos.map((brand, i) => (
              <div key={i} className="flex items-center gap-2 text-slate-700 font-extrabold text-sm opacity-75 hover:opacity-100 transition-opacity">
                <span className={brand.color}>{brand.symbol}</span>
                <span>{brand.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive GST & ROI Savings Calculator Section */}
      <section id="roi-calculator" className="py-24 bg-white border-b border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              FINANCIAL ROI ENGINE
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Calculate Your Monthly Savings & GST Impact
            </h2>
            <p className="text-base text-slate-600">
              See how much your enterprise saves by automating 18% Input Tax Credit (ITC) reconciliation and preventing stockout revenue leakage.
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-900 via-[#1E1035] to-[#120726] rounded-3xl p-8 sm:p-12 text-white shadow-2xl border border-purple-500/20">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Left Slider Column */}
              <div className="lg:col-span-7 space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-purple-300 uppercase tracking-wider">
                      Monthly Procurement / Turnover Volume:
                    </label>
                    <span className="text-2xl font-black text-white">
                      ₹{(monthlyVolume / 100000).toFixed(1)} Lakhs
                    </span>
                  </div>
                  <input
                    type="range"
                    min="500000"
                    max="50000000"
                    step="500000"
                    value={monthlyVolume}
                    onChange={(e) => setMonthlyVolume(Number(e.target.value))}
                    className="w-full h-2 bg-purple-950 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-[10px] text-purple-300 font-semibold">
                    <span>₹5 Lakhs</span>
                    <span>₹2.5 Crores</span>
                    <span>₹5.0 Crores</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="bg-white/5 border border-purple-500/20 rounded-2xl p-4">
                    <p className="text-xs text-purple-200/70">18% GST Input Credit</p>
                    <p className="text-xl font-black text-emerald-400 mt-1">₹{gstSavings.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-purple-300/60 mt-0.5">Automated Monthly Credit</p>
                  </div>
                  <div className="bg-white/5 border border-purple-500/20 rounded-2xl p-4">
                    <p className="text-xs text-purple-200/70">Stockout Loss Prevention</p>
                    <p className="text-xl font-black text-purple-300 mt-1">₹{stockoutSavings.toLocaleString('en-IN')}</p>
                    <p className="text-[10px] text-purple-300/60 mt-0.5">Multi-Hub Safety Stock</p>
                  </div>
                </div>
              </div>

              {/* Right Output Card */}
              <div className="lg:col-span-5 bg-purple-600/20 border border-purple-400/30 rounded-2xl p-6 text-center space-y-4">
                <span className="text-[10px] font-extrabold uppercase tracking-widest bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-3 py-1 rounded-full">
                  ESTIMATED ANNUAL ROI
                </span>
                <div>
                  <h3 className="text-3xl sm:text-4xl font-black text-white">₹{totalAnnualValue.toLocaleString('en-IN')}</h3>
                  <p className="text-xs text-purple-200 mt-1">Annualized Profit & Tax Savings</p>
                </div>
                <Button asChild className="w-full rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600 text-white font-bold py-6">
                  <Link to="/inventory/products">Start Automating Today</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intelligent Pipeline Management Section */}
      <section id="pipeline" className="py-24 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              INTELLIGENT PIPELINE MANAGEMENT
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Organize Your Deals & Gain Clear Visibility Into Every Stage
            </h2>
            <p className="text-base text-slate-600">
              Never let a high-value lead slip through the cracks. Automate follow-ups, sync dispatch timelines, and predict revenue accurately in Indian Rupees (₹).
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-stretch">
            {/* Left Box: Deal Funnel + Widgets */}
            <div className="space-y-4">
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-700">Active Deals Funnel</span>
                  <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">5 Velocity Stages</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-center">
                    <p className="text-[10px] font-bold text-slate-500 uppercase">QUALIFY (20%)</p>
                    <p className="text-sm font-black text-slate-900">18 Deals</p>
                    <p className="text-[10px] text-slate-400">₹24L Value</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-center">
                    <p className="text-[10px] font-bold text-blue-600 uppercase">NEEDS (40%)</p>
                    <p className="text-sm font-black text-blue-900">12 Deals</p>
                    <p className="text-[10px] text-blue-500">₹45L Value</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-center">
                    <p className="text-[10px] font-bold text-purple-600 uppercase">PROPOSAL (70%)</p>
                    <p className="text-sm font-black text-purple-900">6 Deals</p>
                    <p className="text-[10px] text-purple-500">₹58L Value</p>
                  </div>
                  <div className="p-3 bg-orange-50 rounded-xl border border-orange-200 text-center">
                    <p className="text-[10px] font-bold text-orange-600 uppercase">NEGOTIATE (85%)</p>
                    <p className="text-sm font-black text-orange-900">4 Deals</p>
                    <p className="text-[10px] text-orange-500">₹72L Value</p>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-center col-span-2 sm:col-span-1">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase">WON (100%)</p>
                    <p className="text-sm font-black text-emerald-900">15 Deals</p>
                    <p className="text-[10px] text-emerald-500">₹1.4Cr Value</p>
                  </div>
                </div>
              </div>

              {/* Sub-cards: Smart Notifications & Est Dispatch */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-2 text-purple-600 mb-2">
                    <Zap className="h-4 w-4" />
                    <h4 className="text-xs font-bold text-slate-800">Smart Lead Alerts</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Automated client reminders for pending purchase orders, invoice payments, and dispatch tracking numbers.
                  </p>
                  <div className="mt-3 p-2 bg-purple-50 rounded-lg text-[11px] font-semibold text-purple-800 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-purple-600" />
                    Hot Lead: GlobalTech Systems (Score: 88)
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs">
                  <div className="flex items-center gap-2 text-orange-500 mb-2">
                    <Clock className="h-4 w-4" />
                    <h4 className="text-xs font-bold text-slate-800">Est Dispatch Routing</h4>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Real-time warehouse route estimator, weekend buffer locks, and automated courier pickups seamlessly.
                  </p>
                  <div className="mt-3 p-2 bg-emerald-50 rounded-lg text-[11px] font-bold text-emerald-800 flex items-center justify-between">
                    <span>WH-MUM // Mumbai Hub</span>
                    <span className="bg-emerald-200/80 px-1.5 py-0.5 rounded text-[10px]">DISPATCHED 04:30PM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Box: Dark Purple Scalability Banner */}
            <div className="rounded-3xl bg-gradient-to-br from-[#1E1035] via-[#2A174E] to-[#120726] p-8 sm:p-10 text-white flex flex-col justify-between shadow-2xl relative overflow-hidden group">
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <img
                  src="/images/enterprise-scale-bg.jpg"
                  alt="Enterprise Scalability"
                  className="w-full h-full object-cover opacity-25 filter saturate-150 group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-tr from-[#120726]/95 via-[#1E1035]/80 to-transparent" />
              </div>

              <div className="space-y-4 relative z-10">
                <span className="inline-flex items-center gap-2 text-xs font-bold tracking-wider text-purple-300 uppercase bg-purple-500/20 px-3 py-1 rounded-full border border-purple-400/30">
                  <Sparkles className="h-3.5 w-3.5 text-purple-300" /> HIGH-VOLUME COMMERCE
                </span>
                <h3 className="text-2xl sm:text-4xl font-extrabold text-white leading-tight">
                  Scalability Engineered for Modern Commerce
                </h3>
                <p className="text-sm text-purple-200/80 leading-relaxed">
                  Whether you fulfill 50 wholesale orders a day or manage 50,000 SKUs across nationwide hubs, DOS-CRM-ERP delivers 99.99% uptime and sub-second MongoDB sync.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6 pt-8 border-t border-purple-500/20 mt-8 relative z-10">
                <div>
                  <p className="text-3xl sm:text-4xl font-black text-white">+24%</p>
                  <p className="text-xs text-purple-200/70 mt-1">Deal Conversion Rate</p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-black text-emerald-400">99.2%</p>
                  <p className="text-xs text-purple-200/70 mt-1">On-Time Hub Dispatch</p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-black text-purple-300">1,266+</p>
                  <p className="text-xs text-purple-200/70 mt-1">Tracked SKUs in Catalog</p>
                </div>
                <div>
                  <p className="text-3xl sm:text-4xl font-black text-orange-400">₹1.42 Cr</p>
                  <p className="text-xs text-purple-200/70 mt-1">Live Stock Valuation</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Built for Modern Enterprise Scale */}
      <section id="solutions" className="py-24 bg-white border-t border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              COMPLETE WORKFLOW INTEGRATION
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Built for Modern Enterprise Scale
            </h2>
            <p className="text-base text-slate-600">
              Everything your revenue, procurement, and logistics teams need to operate in lockstep.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-slate-50/60 rounded-3xl p-8 border border-slate-200/80 hover:shadow-lg transition-all hover:bg-white flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
                  <Warehouse className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Multi-Warehouse Routing</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Connect Mumbai, Delhi, Bangalore, Kolkata, Pune, and Ahmedabad. Set automated stock transfer thresholds, barcode scanning, and safety stock limits.
                </p>
                <ul className="space-y-2 pt-2 text-xs font-medium text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" /> Live Hub Capacity Gauges
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" /> Automated Goods Receipt Notes (GRN)
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" /> Inter-Warehouse Transfer Approval Flow
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-slate-50/60 rounded-3xl p-8 border border-slate-200/80 hover:shadow-lg transition-all hover:bg-white flex flex-col justify-between relative">
              <div className="absolute top-6 right-6">
                <span className="bg-purple-100 text-purple-700 text-[10px] font-black uppercase px-2.5 py-1 rounded-full border border-purple-200">
                  CORE ENGINE
                </span>
              </div>
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shadow-xs">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">CRM Deal Pipeline</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Intuitive drag-and-drop Kanban pipeline with deal probabilities, expected close dates, custom quotation builders, and contact activity timelines.
                </p>
                <ul className="space-y-2 pt-2 text-xs font-medium text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" /> 5-Stage Visual Kanban Board
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" /> 1-Click Quotation & GST Invoice in ₹
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0" /> Unified Calls, Emails & Meetings Timeline
                  </li>
                </ul>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-slate-50/60 rounded-3xl p-8 border border-slate-200/80 hover:shadow-lg transition-all hover:bg-white flex flex-col justify-between">
              <div className="space-y-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
                  <Bot className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">AI M-Model Copilot</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Leverage Gemini M-Model cognitive intelligence with step-by-step thought traces to forecast demand, summarize customer notes, and draft purchase orders.
                </p>
                <ul className="space-y-2 pt-2 text-xs font-medium text-slate-600">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" /> Autonomous Lead Scoring & Win Probabilities
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" /> Predictive Reorder & Safety Stock Bounds
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-indigo-600 shrink-0" /> Cognitive Thought Trace Transparency
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section in Indian Rupees */}
      <section id="pricing" className="py-24 bg-[#F8FAFC] border-t border-slate-200/70">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              TRANSPARENT PRICING IN RUPEES (₹)
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Predictable, Transparent Pricing
            </h2>
            <p className="text-base text-slate-600">
              Every enterprise is unique — pick the ideal plan tailored for your warehouse hubs and sales velocity.
            </p>

            {/* Billing Toggle */}
            <div className="flex items-center justify-center gap-3 pt-4">
              <div className="bg-slate-200/80 p-1 rounded-full border border-slate-200 flex items-center">
                <button
                  type="button"
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                    billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Monthly Billing
                </button>
                <button
                  type="button"
                  onClick={() => setBillingCycle('annual')}
                  className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    billingCycle === 'annual' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Annual Billing
                  <span className="bg-orange-500 text-white text-[9px] font-extrabold px-1.5 py-0.2 rounded-full">
                    SAVE 20%
                  </span>
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
            {/* 1. Starter */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    PROFESSIONALS & SMALL TEAMS
                  </span>
                  <h3 className="text-2xl font-bold text-slate-900">Starter</h3>
                  <p className="text-xs text-slate-500 mt-1">Good for individuals or single-warehouse staffing units.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">{billingCycle === 'monthly' ? '₹2,499' : '₹1,999'}</span>
                  <span className="text-xs font-semibold text-slate-500">/ per user/month</span>
                </div>
                <ul className="space-y-3 text-xs font-medium text-slate-600 border-t border-slate-100 pt-6">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-purple-600 shrink-0" /> Single warehouse location (e.g., Mumbai)
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-purple-600 shrink-0" /> Up to 500 SKUs & barcode generator
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-purple-600 shrink-0" /> Standard CRM deal pipeline
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-purple-600 shrink-0" /> GST Tax Invoices & PDF export
                  </li>
                </ul>
              </div>
              <Button variant="outline" asChild className="rounded-full mt-8 w-full font-bold border-slate-300">
                <Link to="/login">Get Started Free</Link>
              </Button>
            </div>

            {/* 2. Professional (Highlighted Most Popular) */}
            <div className="bg-white rounded-3xl p-8 border-2 border-purple-600 shadow-2xl shadow-purple-600/10 flex flex-col justify-between relative scale-105 z-10">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-full shadow-md">
                  MOST POPULAR
                </span>
              </div>
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-600 block mb-1">
                    HIGH GROWTH TEAMS
                  </span>
                  <h3 className="text-2xl font-black text-slate-900">Professional</h3>
                  <p className="text-xs text-slate-500 mt-1">Perfect for multi-warehouse teams boosting deal velocity.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-black text-purple-600">{billingCycle === 'monthly' ? '₹7,999' : '₹6,499'}</span>
                  <span className="text-xs font-semibold text-slate-500">/ per team/month</span>
                </div>
                <ul className="space-y-3 text-xs font-medium text-slate-700 border-t border-purple-100 pt-6">
                  <li className="flex items-center gap-2.5 font-bold">
                    <Check className="h-4 w-4 text-purple-600 shrink-0" /> All 6 Nationwide Hubs (Mumbai, DEL, BLR, KOL, PUN, AMD)
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-purple-600 shrink-0" /> Unlimited Stock & Inter-Warehouse Transfers
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-purple-600 shrink-0" /> Gemini M-Model AI Multi-Agent Copilot
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-purple-600 shrink-0" /> B2B Wholesale Marketplace & Storefront
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-purple-600 shrink-0" /> MongoDB Atlas Cloud Sync
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-purple-600 shrink-0" /> Granular RBAC Permissions
                  </li>
                </ul>
              </div>
              <Button asChild className="rounded-full mt-8 w-full font-bold bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg shadow-purple-600/30">
                <Link to="/login">Start 14-Day Free Trial</Link>
              </Button>
            </div>

            {/* 3. Enterprise */}
            <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    LARGE CORPORATIONS
                  </span>
                  <h3 className="text-2xl font-bold text-slate-900">Enterprise</h3>
                  <p className="text-xs text-slate-500 mt-1">Custom ERP integration, dedicated SLA, & volume pricing.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-black text-slate-900">{billingCycle === 'monthly' ? '₹24,999' : '₹19,999'}</span>
                  <span className="text-xs font-semibold text-slate-500">/ billed annually</span>
                </div>
                <ul className="space-y-3 text-xs font-medium text-slate-600 border-t border-slate-100 pt-6">
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-purple-600 shrink-0" /> Unlimited Warehouses & Custom Hubs
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-purple-600 shrink-0" /> Dedicated SAP / Tally / Custom API Bridge
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-purple-600 shrink-0" /> Custom AI Knowledge Base RAG Model
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-purple-600 shrink-0" /> 24/7 Dedicated Account Manager & Phone SLA
                  </li>
                  <li className="flex items-center gap-2.5">
                    <Check className="h-4 w-4 text-purple-600 shrink-0" /> SOC-2, ISO 27001 & Custom Audit Trail
                  </li>
                </ul>
              </div>
              <Button asChild className="rounded-full mt-8 w-full font-bold bg-[#0F172A] hover:bg-slate-800 text-white">
                <Link to="/login">Contact Enterprise Sales</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faq" className="py-24 bg-white border-t border-slate-200/70">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-16 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              FAQS
            </span>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-base text-slate-600">
              Got questions about multi-warehouse sync, B2B wholesale orders, or GST compliance?
            </p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl border border-slate-200 bg-white transition-all overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === i ? null : i)}
                  className="w-full p-6 text-left flex items-center justify-between font-bold text-sm sm:text-base text-slate-900 hover:text-purple-600 transition-colors cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-5 w-5 text-slate-400 transition-transform duration-200 ${
                      activeFaq === i ? 'rotate-180 text-purple-600' : ''
                    }`}
                  />
                </button>
                {activeFaq === i && (
                  <div className="px-6 pb-6 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-4">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Card */}
      <section className="py-20 bg-gradient-to-b from-white via-purple-50/50 to-[#F8FAFC]">
        <div className="max-w-5xl mx-auto px-6">
          <div className="rounded-3xl bg-gradient-to-r from-purple-50 via-white to-indigo-50/60 p-10 sm:p-14 border border-purple-200/80 shadow-xl text-center space-y-6">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight max-w-2xl mx-auto">
              Ready to Transform Your Multi-Warehouse Commerce?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
              Empower your team with DOS-CRM-ERP today. Unify your B2B wholesale store, track inventory telemetry, and accelerate deals effortlessly.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
              <Button
                size="lg"
                asChild
                className="rounded-full px-8 h-12 text-sm font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xl shadow-purple-600/30"
              >
                <Link to="/store">Launch B2B Storefront</Link>
              </Button>
              <Button
                variant="outline"
                size="lg"
                asChild
                className="rounded-full px-8 h-12 text-sm font-bold border-slate-300 bg-white hover:bg-slate-50 text-slate-800"
              >
                <Link to="/inventory/products">Enter ERP Dashboard</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Luxury Dark Footer */}
      <footer className="bg-[#0F172A] text-white pt-16 pb-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
            {/* Col 1 */}
            <div className="space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-purple-600 flex items-center justify-center font-black text-white text-lg">
                  D
                </div>
                <span className="text-xl font-black tracking-tight text-white">
                  DOS<span className="text-purple-400">CRM</span>-ERP
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enterprise multi-warehouse ERP, wholesale e-commerce, and Deal Pipeline CRM designed to accelerate order velocity, eliminate stockouts, and grow revenue in Indian Rupees (₹).
              </p>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-3 py-1.5 rounded-lg w-fit">
                <ShieldCheck className="h-4 w-4" /> ISO 27001 & MongoDB Atlas Verified
              </div>
            </div>

            {/* Col 2 */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Core Modules</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/store" className="text-purple-400 font-bold hover:underline">B2B Wholesale Store</Link></li>
                <li><Link to="/inventory/products" className="hover:text-white transition-colors">Products & Catalog</Link></li>
                <li><Link to="/inventory/warehouses" className="hover:text-white transition-colors">Warehouse Hubs</Link></li>
                <li><Link to="/crm/deals" className="hover:text-white transition-colors">Deals Pipeline</Link></li>
                <li><Link to="/sales/orders" className="hover:text-white transition-colors">Sales Orders & GST</Link></li>
              </ul>
            </div>

            {/* Col 3 */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">Solutions & Reports</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/finance/gst-reports" className="hover:text-white transition-colors">GST Compliance (GSTR-1)</Link></li>
                <li><Link to="/finance/pnl" className="hover:text-white transition-colors">P&L & Cash Flow</Link></li>
                <li><Link to="/reports/analytics" className="hover:text-white transition-colors">Executive Analytics</Link></li>
                <li><Link to="/settings/roles" className="hover:text-white transition-colors">Enterprise RBAC</Link></li>
                <li><Link to="/portal/tracking" className="hover:text-white transition-colors">Live Shipment Tracker</Link></li>
              </ul>
            </div>

            {/* Col 4 */}
            <div className="space-y-3 text-xs">
              <h4 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">AI & Automation</h4>
              <ul className="space-y-2 text-slate-400">
                <li><Link to="/ai" className="hover:text-white transition-colors">M-Model AI Copilot</Link></li>
                <li><Link to="/ai/knowledge-base" className="hover:text-white transition-colors">Enterprise RAG Docs</Link></li>
                <li><Link to="/settings" className="hover:text-white transition-colors">MongoDB Atlas Config</Link></li>
                <li><a href="mailto:support@doscrm.com" className="hover:text-white transition-colors">24/7 Technical Support</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 DOS-CRM-ERP Systems. All rights reserved. Powered by Google Gemini AI & MongoDB Atlas.</p>
            <div className="flex items-center gap-6">
              <Link to="/store" className="hover:text-slate-300 transition-colors">Storefront</Link>
              <Link to="/login" className="hover:text-slate-300 transition-colors">Portal Login</Link>
              <a href="#" className="hover:text-slate-300 transition-colors">Security Whitepaper</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
