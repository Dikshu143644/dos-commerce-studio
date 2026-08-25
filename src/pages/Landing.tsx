import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Play,
  CheckCircle2,
  Package,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

export default function LandingPage() {
  useDocumentTitle('StockFlow - Manage Your Inventory. Close More Deals.');

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#0F172A] font-sans selection:bg-amber-500 selection:text-white">
      {/* Top Navigation Bar (Pixel Perfect to Image 1) */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-[#FDFBF7]/85 border-b border-amber-900/10 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-[12px] bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <span className="text-xl font-black text-white">S</span>
            </div>
            <span className="text-2xl font-extrabold tracking-tight text-[#0F172A]">StockFlow</span>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-amber-600 transition-colors">Features</a>
            <a href="#solutions" className="hover:text-amber-600 transition-colors">Solutions</a>
            <a href="#pricing" className="hover:text-amber-600 transition-colors">Pricing</a>
            <a href="#resources" className="hover:text-amber-600 transition-colors">Resources</a>
            <a href="#about" className="hover:text-amber-600 transition-colors">About</a>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="rounded-full px-5 h-10 border-slate-300 text-slate-800 font-semibold hover:bg-slate-100 hover:text-black"
            >
              <Link to="/login">Log In</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="rounded-full px-6 h-10 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold shadow-lg shadow-amber-500/25 transition-all"
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
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[#0F172A] leading-[1.12]">
                Manage Your Inventory.{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-orange-500">
                  Close More Deals.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                StockFlow integrates powerful inventory management with intuitive CRM tools to help your team track stock, nurture leads, and accelerate sales pipeline—all in one seamless, inviting platform.
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
                  asChild
                  className="rounded-full px-7 h-13 text-base font-bold border-2 border-[#0F172A] text-[#0F172A] hover:bg-[#0F172A] hover:text-white gap-2 transition-all"
                >
                  <Link to="/login">
                    Watch Demo <Play className="h-4 w-4 fill-current" />
                  </Link>
                </Button>
              </div>

              {/* Trust Badges */}
              <div className="pt-4 flex items-center gap-6 text-xs font-semibold text-slate-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> No credit card required
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> 14-day free trial
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Live AI agent ready
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
              <div className="relative rounded-[28px] bg-white p-6 shadow-[0_25px_70px_rgba(0,0,0,0.15)] border border-amber-900/10 transform rotate-1 hover:rotate-0 transition-transform duration-500 overflow-hidden">
                {/* Internal App Frame */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="h-7 w-7 rounded-lg bg-amber-500 flex items-center justify-center text-white font-bold text-xs">
                      S
                    </div>
                    <span className="font-bold text-sm text-slate-800">StockFlow Enterprise</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[11px] font-semibold text-emerald-600">Live Telemetry</span>
                  </div>
                </div>

                {/* Dashboard Widgets Grid */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-slate-50 rounded-[16px] p-3.5 border border-slate-100">
                    <p className="text-[11px] font-medium text-slate-500">Inventory Snapshot</p>
                    <p className="text-xl font-black text-slate-900 mt-0.5">$79,969</p>
                    <p className="text-[10px] text-emerald-600 font-semibold mt-1">↑ 12.4% this week</p>
                  </div>

                  <div className="bg-slate-50 rounded-[16px] p-3.5 border border-slate-100">
                    <p className="text-[11px] font-medium text-slate-500">Sales Pipeline</p>
                    <p className="text-xl font-black text-slate-900 mt-0.5">$302,500</p>
                    <p className="text-[10px] text-amber-600 font-semibold mt-1">18 active deals</p>
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
                    className="text-xs font-bold text-amber-600 hover:text-amber-700 flex items-center gap-1"
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
      <section className="py-12 border-t border-b border-amber-900/10 bg-white/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-8">
            Trusted by operations teams at
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
              <span className="text-amber-500 text-2xl">⚡</span> Swift
            </div>
            <div className="flex items-center gap-2 text-xl font-black">
              <span className="h-5 w-5 border-2 border-slate-800 rounded-full inline-block" /> Innovate
            </div>
          </div>
        </div>
      </section>

      {/* Feature Bento Section */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Built for Modern Enterprise Scale
          </h2>
          <p className="text-slate-600 text-base">
            Unified stock visibility, multi-warehouse automated routing, and deal acceleration.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-[24px] p-7 border border-slate-200/80 shadow-sm space-y-4 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-[16px] bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Package className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Multi-Warehouse Routing</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Track stock across Mumbai, Delhi, Bangalore, Kolkata, Ahmedabad, and Pune in real-time with automated low stock reorders.
            </p>
          </div>

          <div className="bg-white rounded-[24px] p-7 border border-slate-200/80 shadow-sm space-y-4 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-[16px] bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <TrendingUp className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">CRM Deal Pipeline</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Kanban stage management, client lifetime value tracking, contact history, and automated invoice conversion.
            </p>
          </div>

          <div className="bg-white rounded-[24px] p-7 border border-slate-200/80 shadow-sm space-y-4 hover:shadow-lg transition-shadow">
            <div className="h-12 w-12 rounded-[16px] bg-purple-500/10 flex items-center justify-center text-purple-600">
              <Sparkles className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Python ADK Multi-Agent</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Background autonomous agents for predictive stock reordering, purchase order drafting, and Excel automation.
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-amber-900/10 py-12 bg-white text-center text-sm text-slate-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <span className="h-6 w-6 rounded bg-amber-500 flex items-center justify-center text-white text-xs">S</span>
            StockFlow Enterprise
          </div>
          <p>© 2026 StockFlow Inc. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs font-medium">
            <Link to="/login" className="hover:text-amber-600">Platform Login</Link>
            <Link to="/register" className="hover:text-amber-600">Sign Up</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
