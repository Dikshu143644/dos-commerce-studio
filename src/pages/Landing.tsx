import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Play,
  CheckCircle2,
  Package,
  TrendingUp,
  Sparkles,
  Building2,
  Truck,
  Boxes,
  ChevronDown,
  X,
  Maximize2,
  Volume2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function LandingPage() {
  useDocumentTitle('StockFlow - Manage Your Inventory. Close More Deals.');

  const [demoOpen, setDemoOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const demoChapters = [
    {
      title: '01. Multi-Warehouse Stock Tracking',
      desc: 'Real-time telemetry across Mumbai, Delhi, Bangalore, Kolkata, and Pune facilities.',
      img: '/images/backgrounds/warehouse-sunset-drone.jpg',
      badge: 'Live Telemetry',
    },
    {
      title: '02. CRM Pipeline & Deal Stages',
      desc: 'Visual Kanban pipeline with automated deal velocity and client LTV calculations.',
      img: '/images/cards/card-crm-bg.jpg',
      badge: 'CRM Automation',
    },
    {
      title: '03. Python ADK Predictive Agents',
      desc: 'Autonomous background reorder triggers and Excel export automations.',
      img: '/images/cards/card-revenue-bg.jpg',
      badge: 'AI Multi-Agent',
    },
    {
      title: '04. Opal SMS OTP Authentication',
      desc: 'Real-time cryptographic 6-digit SMS verification with SHA-256 validation.',
      img: '/images/cards/card-logistics-bg.jpg',
      badge: 'Opal Security',
    },
  ];

  const faqs = [
    {
      q: 'How does the Python ADK multi-agent engine automate inventory reordering?',
      a: 'The StockFlow Python ADK agents continuously monitor safety stock thresholds across your active warehouses. When inventory for any SKU dips below minimum levels, the agent autonomously generates purchase order drafts and notifies the operations team.',
    },
    {
      q: 'How does the Opal SMS / WhatsApp OTP authentication workflow function?',
      a: 'StockFlow integrates directly with the Opal automation pipeline. When an SMS login is initiated, our backend generates a cryptographically secure 6-digit OTP, stores a SHA-256 hash in Supabase with a 5-minute TTL, and dispatches the code to the user.',
    },
    {
      q: 'Can I connect our company’s Supabase PostgreSQL database?',
      a: 'Yes! StockFlow connects out-of-the-box to live Supabase database instances. Full schema migrations and RLS security policies are included in the repository.',
    },
    {
      q: 'Can I export financial reports and audit logs directly to Microsoft Excel?',
      a: 'StockFlow provides full XLSX/Excel export powered by our backend Excel agent and SheetJS, allowing instant one-click report downloads of orders, inventory valuation, and CRM metrics.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0F172A] font-sans selection:bg-amber-500 selection:text-white scroll-smooth">
      {/* Top Navigation Bar (Pixel Perfect to Image 1) */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#FDFBF7]/90 border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/landing" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-[12px] bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <span className="text-xl font-black text-white">S</span>
            </div>
            <span className="text-2xl font-black tracking-tight text-[#0F172A]">StockFlow</span>
          </Link>

          {/* Smooth Scroll Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-orange-600 transition-colors">Features</a>
            <a href="#solutions" className="hover:text-orange-600 transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-orange-600 transition-colors">Pricing</a>
            <a href="#resources" className="hover:text-orange-600 transition-colors">Resources</a>
            <a href="#about" className="hover:text-orange-600 transition-colors">About</a>
          </nav>

          {/* Auth Action Buttons */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="rounded-full px-5 h-10 border-slate-300 text-slate-800 font-bold hover:bg-slate-100 hover:text-black transition-all"
            >
              <Link to="/login">Log In</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="rounded-full px-6 h-10 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg shadow-amber-500/25 transition-all hover:scale-105"
            >
              <Link to="/login">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Hero Section (Pixel Perfect to Image 1) */}
      <section className="relative pt-12 pb-24 overflow-hidden">
        {/* Warm Ambient Warehouse Background Overlay */}
        <div className="absolute right-0 top-0 bottom-0 w-1/2 pointer-events-none opacity-20 hidden lg:block">
          <img
            src="/images/backgrounds/warehouse-shelves.jpg"
            alt=""
            className="w-full h-full object-cover filter saturate-150"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80';
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#FDFBF7] via-[#FDFBF7]/80 to-transparent" />
        </div>

        {/* Ambient Warm Sun Orb */}
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-amber-400/20 rounded-full blur-[120px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="lg:col-span-6 space-y-8"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-100/80 border border-orange-200 text-orange-800 text-xs font-bold shadow-xs">
                <Sparkles className="h-3.5 w-3.5 text-orange-600" /> Powered by Python ADK Multi-Agent & Opal Automation
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-[1.12]">
                Manage Your Inventory.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500">
                  Close More Deals.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                StockFlow integrates powerful multi-warehouse inventory management with intuitive CRM pipelines to help your enterprise track stock, nurture high-value leads, and accelerate deal revenue.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-wrap items-center gap-4 pt-2">
                <Button
                  size="lg"
                  asChild
                  className="rounded-full px-8 h-13 text-base font-bold bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-xl shadow-amber-500/30 gap-2 transition-all hover:scale-105"
                >
                  <Link to="/login">
                    Start Free Trial <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => setDemoOpen(true)}
                  className="rounded-full px-7 h-13 text-base font-bold border-2 border-[#0F172A] text-[#0F172A] hover:bg-[#0F172A] hover:text-white gap-2 transition-all cursor-pointer"
                >
                  <Play className="h-4 w-4 fill-current" /> Watch Demo Video
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> 14-day free trial
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Live Opal SMS OTP Ready
                </div>
              </div>
            </motion.div>

            {/* Right 3D Floating Dashboard Showcase (Pixel Perfect to Image 1) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="lg:col-span-6 relative perspective-1000"
            >
              {/* 3D Tilted Glass Dashboard Card */}
              <div className="relative rounded-[28px] bg-white p-6 shadow-[0_25px_70px_rgba(0,0,0,0.15)] border border-slate-200 transform rotate-1 hover:rotate-0 transition-transform duration-500 overflow-hidden group">
                {/* Internal App Frame Header */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-xs">
                      S
                    </div>
                    <span className="font-bold text-sm text-slate-800">StockFlow Enterprise</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-bold text-emerald-600">Live Telemetry</span>
                  </div>
                </div>

                {/* Dashboard Widgets Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-[16px] p-3.5 border border-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Inventory Valuation</p>
                    <p className="text-xl font-black text-slate-900 mt-0.5">₹12,45,680</p>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">↑ 12.4% this week</p>
                  </div>

                  <div className="bg-slate-50 rounded-[16px] p-3.5 border border-slate-100">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sales Pipeline</p>
                    <p className="text-xl font-black text-slate-900 mt-0.5">₹24,56,600</p>
                    <p className="text-[10px] text-orange-600 font-bold mt-1">18 active deals</p>
                  </div>
                </div>

                {/* Mini Stock Movement Flow */}
                <div className="space-y-2 bg-slate-50/80 rounded-[16px] p-3 border border-slate-100 text-xs">
                  <div className="flex justify-between font-bold text-slate-700 pb-1 border-b border-slate-200/60">
                    <span>Product Line</span>
                    <span>Stock Level</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>AC Servo Motors ISM-200</span>
                    <span className="font-mono font-bold text-emerald-600">2,150 pcs</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Hydraulic Power Units HP-200</span>
                    <span className="font-mono font-bold text-amber-600">340 pcs</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span>Circuit Boards Pro X1</span>
                    <span className="font-mono font-bold text-emerald-600">4,820 pcs</span>
                  </div>
                </div>

                {/* Direct Demo Login Strip */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">Ready to test drive?</span>
                  <Link
                    to="/login"
                    className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                  >
                    Open Live Platform <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Trusted By Brand Logos Strip (Pixel Perfect to Image 1) */}
      <section className="py-12 border-t border-b border-slate-200/80 bg-white/70">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-8">
            Trusted by operations and supply chain teams at
          </p>

          <div className="flex flex-wrap items-center justify-center gap-10 md:gap-16 text-slate-700">
            <div className="flex items-center gap-2 text-xl font-black tracking-tighter">
              <span className="text-2xl">▲</span> ACURA
            </div>
            <div className="flex items-center gap-2 text-xl font-bold tracking-tight">
              <span className="h-5 w-5 bg-slate-800 rounded-sm inline-block" /> Lumina
            </div>
            <div className="flex items-center gap-2 text-xl font-black">
              <span className="text-2xl">▲</span> Apex
            </div>
            <div className="flex items-center gap-2 text-xl font-bold">
              <span className="text-orange-500 text-2xl">⚡</span> Swift
            </div>
            <div className="flex items-center gap-2 text-xl font-black">
              <span className="h-5 w-5 border-2 border-slate-800 rounded-full inline-block" /> Innovate
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Section (#features) */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Built for Modern Enterprise Scale
          </h2>
          <p className="text-slate-600 text-base">
            Unified stock visibility, multi-warehouse automated routing, and CRM deal acceleration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[24px] p-8 border border-slate-200/90 shadow-xs space-y-4 hover:border-orange-300 hover:shadow-lg transition-all">
            <div className="h-12 w-12 rounded-[16px] bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <Package className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Multi-Warehouse Routing</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Track stock across Mumbai, Delhi, Bangalore, Kolkata, Ahmedabad, and Pune in real-time with automated low-stock reorder triggers.
            </p>
            <div className="pt-2">
              <Link to="/login" className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1">
                Explore Warehouse Telemetry <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-8 border border-slate-200/90 shadow-xs space-y-4 hover:border-orange-300 hover:shadow-lg transition-all">
            <div className="h-12 w-12 rounded-[16px] bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">CRM Deal Pipeline</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Kanban stage management, client lifetime value telemetry, communication logs, and instant sales invoice generation.
            </p>
            <div className="pt-2">
              <Link to="/login" className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1">
                View CRM Pipelines <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-8 border border-slate-200/90 shadow-xs space-y-4 hover:border-orange-300 hover:shadow-lg transition-all">
            <div className="h-12 w-12 rounded-[16px] bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Python ADK Multi-Agent</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Autonomous background agents for predictive stock reordering, purchase order drafting, and real-time Excel spreadsheet generation.
            </p>
            <div className="pt-2">
              <Link to="/login" className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1">
                Learn About ADK Agents <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Industry Solutions Section (#solutions) */}
      <section id="solutions" className="py-20 bg-white/70 border-t border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Tailored For Your Industry
            </h2>
            <p className="text-slate-600 text-base">
              Customized workflows engineered for manufacturing, 3PL logistics, and wholesale commerce.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#FDFBF7] p-6 rounded-[22px] border border-slate-200 space-y-3">
              <Building2 className="h-8 w-8 text-orange-500" />
              <h3 className="text-lg font-bold text-slate-900">Manufacturing & Parts</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bill of materials tracking, supplier reorder cycles, and multi-location hardware distribution.
              </p>
              <Link to="/login" className="inline-flex text-xs font-bold text-orange-600 pt-2">
                Manufacturing Workflows →
              </Link>
            </div>

            <div className="bg-[#FDFBF7] p-6 rounded-[22px] border border-slate-200 space-y-3">
              <Truck className="h-8 w-8 text-orange-500" />
              <h3 className="text-lg font-bold text-slate-900">3PL & Logistics Hubs</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Fast barcode scanning, stock intake verification, transfer routes, and real-time carrier tracking.
              </p>
              <Link to="/login" className="inline-flex text-xs font-bold text-orange-600 pt-2">
                Logistics Workflows →
              </Link>
            </div>

            <div className="bg-[#FDFBF7] p-6 rounded-[22px] border border-slate-200 space-y-3">
              <Boxes className="h-8 w-8 text-orange-500" />
              <h3 className="text-lg font-bold text-slate-900">B2B Wholesale & Retail</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Client credit terms, automated quote-to-invoice pipelines, and tiered volume discount pricing.
              </p>
              <Link to="/login" className="inline-flex text-xs font-bold text-orange-600 pt-2">
                Wholesale Workflows →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section (#pricing) */}
      <section id="pricing" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Transparent, Predictable Pricing
          </h2>
          <p className="text-slate-600 text-base">
            Start with our 14-day free trial. Scale seamlessly as your order volume grows.
          </p>

          <div className="inline-flex items-center p-1 rounded-full bg-slate-100 border border-slate-200">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('annual')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                billingCycle === 'annual' ? 'bg-white text-orange-600 shadow-xs' : 'text-slate-500'
              }`}
            >
              Annual (Save 20%)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {/* Starter Plan */}
          <div className="bg-white rounded-[28px] p-8 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900">Starter</h3>
              <p className="text-xs text-slate-500">Essential inventory for emerging suppliers.</p>
              <div className="pt-2">
                <span className="text-4xl font-black text-slate-900">
                  {billingCycle === 'annual' ? '$23' : '$29'}
                </span>
                <span className="text-xs text-slate-500 font-medium"> / month</span>
              </div>
              <ul className="space-y-2.5 pt-4 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Up to 1,000 Products
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> 1 Primary Warehouse
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Basic CRM Contact Directory
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Standard Excel Export
                </li>
              </ul>
            </div>
            <div className="pt-8">
              <Button asChild variant="outline" className="w-full h-11 rounded-xl font-bold border-slate-300 hover:bg-slate-50">
                <Link to="/login">Start Starter Trial</Link>
              </Button>
            </div>
          </div>

          {/* Professional Plan (Featured) */}
          <div className="bg-white rounded-[28px] p-8 border-2 border-orange-500 shadow-xl relative flex flex-col justify-between">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[11px] font-bold shadow-md">
              MOST POPULAR
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900">Professional</h3>
              <p className="text-xs text-slate-500">For high-growth multi-warehouse operations.</p>
              <div className="pt-2">
                <span className="text-4xl font-black text-orange-600">
                  {billingCycle === 'annual' ? '$79' : '$99'}
                </span>
                <span className="text-xs text-slate-500 font-medium"> / month</span>
              </div>
              <ul className="space-y-2.5 pt-4 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Up to 50,000 Products
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Unlimited Warehouses
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Full CRM Pipeline & Invoicing
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Python ADK Multi-Agent AI
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Opal SMS OTP Authentication
                </li>
              </ul>
            </div>
            <div className="pt-8">
              <Button asChild className="w-full h-11 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg shadow-orange-500/25">
                <Link to="/login">Start 14-Day Pro Trial</Link>
              </Button>
            </div>
          </div>

          {/* Enterprise Plan */}
          <div className="bg-white rounded-[28px] p-8 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-slate-900">Enterprise</h3>
              <p className="text-xs text-slate-500">Dedicated cloud infrastructure & custom SLAs.</p>
              <div className="pt-2">
                <span className="text-4xl font-black text-slate-900">
                  {billingCycle === 'annual' ? '$239' : '$299'}
                </span>
                <span className="text-xs text-slate-500 font-medium"> / month</span>
              </div>
              <ul className="space-y-2.5 pt-4 text-xs text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Unlimited Everything
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Dedicated Supabase Cluster
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> 99.99% Uptime Guarantee
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> 24/7 Dedicated Account Manager
                </li>
              </ul>
            </div>
            <div className="pt-8">
              <Button asChild variant="outline" className="w-full h-11 rounded-xl font-bold border-slate-300 hover:bg-slate-50">
                <Link to="/login">Contact Enterprise Team</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ & Knowledge Base Section (#resources) */}
      <section id="resources" className="py-20 bg-white/70 border-t border-b border-slate-200/80">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              Frequently Asked Questions
            </h2>
            <p className="text-slate-600 text-sm">
              Everything you need to know about StockFlow, Python ADK agents, and setup.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-[18px] bg-[#FDFBF7] border border-slate-200/90 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 transition-transform shrink-0 ${
                      activeFaq === idx ? 'rotate-180 text-orange-600' : ''
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {activeFaq === idx && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3"
                    >
                      {faq.a}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer & Company Section (#about) */}
      <footer id="about" className="py-14 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-200">
            {/* Brand Col */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 font-black text-slate-900 text-lg">
                <div className="h-8 w-8 rounded-[10px] bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-sm shadow-xs">
                  S
                </div>
                StockFlow
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enterprise Inventory & CRM intelligence platform built with Python ADK and Opal automation.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 pt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                All Systems Operational
              </div>
            </div>

            {/* Product Links */}
            <div className="space-y-2.5 text-xs text-slate-600">
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Product</p>
              <p><a href="#features" className="hover:text-orange-600">Warehouse Routing</a></p>
              <p><a href="#features" className="hover:text-orange-600">CRM Deal Pipeline</a></p>
              <p><a href="#features" className="hover:text-orange-600">Python ADK Agents</a></p>
              <p><Link to="/login" className="hover:text-orange-600">Opal OTP Authentication</Link></p>
            </div>

            {/* Solutions Links */}
            <div className="space-y-2.5 text-xs text-slate-600">
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Solutions</p>
              <p><a href="#solutions" className="hover:text-orange-600">Manufacturing & Parts</a></p>
              <p><a href="#solutions" className="hover:text-orange-600">3PL Warehouses</a></p>
              <p><a href="#solutions" className="hover:text-orange-600">Wholesale Distribution</a></p>
              <p><a href="#pricing" className="hover:text-orange-600">Pricing & Plans</a></p>
            </div>

            {/* Direct Access */}
            <div className="space-y-2.5 text-xs text-slate-600">
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Direct Access</p>
              <p><Link to="/login" className="text-orange-600 font-bold hover:underline">Platform Sign In</Link></p>
              <p><Link to="/register" className="text-orange-600 font-bold hover:underline">Create Account</Link></p>
              <p><Link to="/staff-login" className="hover:text-orange-600">Staff Portal Login</Link></p>
              <p><Link to="/forgot-password" className="hover:text-orange-600">Password Recovery</Link></p>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 StockFlow Inc. All rights reserved.</p>
            <div className="flex items-center gap-6 font-medium">
              <Link to="/login" className="hover:text-orange-600">Privacy Policy</Link>
              <Link to="/login" className="hover:text-orange-600">Terms of Service</Link>
              <Link to="/login" className="hover:text-orange-600">Security Whitepaper</Link>
            </div>
          </div>
        </div>
      </footer>

      {/* Interactive Watch Demo Video Dialog Modal */}
      <Dialog open={demoOpen} onOpenChange={setDemoOpen}>
        <DialogContent className="sm:max-w-[780px] p-0 rounded-[28px] bg-[#0F172A] border border-slate-700 text-white overflow-hidden shadow-2xl">
          {/* Simulated Video Player Header */}
          <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
                ▶
              </div>
              <div>
                <p className="text-sm font-bold text-white">StockFlow Interactive Product Walkthrough</p>
                <p className="text-[11px] text-slate-400">Chapter: {demoChapters[activeChapter].title}</p>
              </div>
            </div>
            <button
              onClick={() => setDemoOpen(false)}
              className="h-8 w-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Video Preview Frame */}
          <div className="relative aspect-video bg-black overflow-hidden group">
            <img
              src={demoChapters[activeChapter].img}
              alt=""
              className="w-full h-full object-cover filter brightness-[0.85] contrast-110 group-hover:scale-105 transition-transform duration-700"
            />
            {/* Play Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-between p-6">
              <div className="flex justify-between items-start">
                <span className="px-3 py-1 rounded-full bg-orange-500/80 backdrop-blur-md text-white font-bold text-xs">
                  {demoChapters[activeChapter].badge}
                </span>
                <span className="text-xs font-mono font-bold text-white/80 bg-black/60 px-2.5 py-1 rounded-lg">
                  HD 1080p
                </span>
              </div>

              <div>
                <h3 className="text-xl font-extrabold text-white">{demoChapters[activeChapter].title}</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-lg">{demoChapters[activeChapter].desc}</p>
              </div>
            </div>

            {/* Playback Control Bar */}
            <div className="absolute bottom-0 inset-x-0 bg-black/70 backdrop-blur-md p-3 flex items-center gap-4 text-xs font-mono text-slate-300">
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="h-7 w-7 rounded-full bg-orange-500 hover:bg-orange-600 flex items-center justify-center text-white"
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer">
                <div className="h-full bg-orange-500 rounded-full w-2/3" />
              </div>
              <span>02:45 / 04:12</span>
              <Volume2 className="h-4 w-4 text-slate-400" />
              <Maximize2 className="h-4 w-4 text-slate-400" />
            </div>
          </div>

          {/* Chapter Selector Strip */}
          <div className="p-4 bg-slate-900 grid grid-cols-2 sm:grid-cols-4 gap-2">
            {demoChapters.map((chap, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveChapter(idx)}
                className={`p-2.5 rounded-xl text-left text-xs transition-all cursor-pointer ${
                  activeChapter === idx
                    ? 'bg-orange-500/20 border border-orange-500/50 text-orange-300 font-bold'
                    : 'bg-slate-800/60 border border-slate-700/60 text-slate-400 hover:text-white'
                }`}
              >
                <p className="truncate font-semibold">{chap.title}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{chap.badge}</p>
              </button>
            ))}
          </div>

          {/* Dialog Action Footer */}
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-400">Ready to experience full capabilities?</span>
            <Button
              asChild
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs"
            >
              <Link to="/login" onClick={() => setDemoOpen(false)}>
                Launch Interactive Live Demo <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
              </Link>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
