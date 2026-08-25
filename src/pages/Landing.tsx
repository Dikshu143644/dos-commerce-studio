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
  Globe,
  ArrowDownRight,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useI18n, type Language } from '@/contexts/i18nContext';

export default function LandingPage() {
  useDocumentTitle('DOS-CRM-ERP — Empower Your Team With Smart CRM & ERP');

  const { t, language, setLanguage } = useI18n();
  const [demoOpen, setDemoOpen] = useState(false);
  const [activeChapter, setActiveChapter] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const demoChapters = [
    {
      title: '01. Multi-Warehouse Stock Telemetry',
      desc: 'Real-time telemetry across Mumbai, Delhi, Bangalore, Kolkata, and Pune facilities with automated threshold monitoring.',
      img: '/images/backgrounds/warehouse-sunset-drone.jpg',
      badge: 'Live Stock Engine',
    },
    {
      title: '02. Visual CRM Deal Pipelines',
      desc: 'Interactive deal stages, conversion probability velocity, and real-time revenue forecast calculations.',
      img: '/images/cards/card-crm-bg.jpg',
      badge: 'CRM Automation',
    },
    {
      title: '03. Python ADK Autonomous Multi-Agent',
      desc: 'Predictive stock reorder triggers, purchase order drafting, and real-time Excel spreadsheet generation.',
      img: '/images/cards/card-revenue-bg.jpg',
      badge: 'Active AI Multi-Agent',
    },
    {
      title: '04. Cryptographic Opal OTP Authentication',
      desc: '6-digit SMS / WhatsApp verification with SHA-256 validation and 5-minute TTL security.',
      img: '/images/cards/card-logistics-bg.jpg',
      badge: 'Enterprise Security',
    },
  ];

  const faqs = [
    {
      q: 'How does the Python ADK multi-agent engine automate inventory reordering?',
      a: 'The DOS-CRM-ERP Python ADK agents continuously monitor safety stock thresholds across your active warehouses. When inventory for any SKU dips below minimum levels, the agent autonomously generates purchase order drafts and notifies the operations team.',
    },
    {
      q: 'How does the Opal SMS / WhatsApp OTP authentication workflow function?',
      a: 'DOS-CRM-ERP integrates directly with the Opal automation pipeline. When an SMS login is initiated, our backend generates a cryptographically secure 6-digit OTP, stores a SHA-256 hash with a 5-minute TTL, and dispatches the code to the user for instant passwordless verification.',
    },
    {
      q: 'Can I connect our company’s Supabase PostgreSQL or MongoDB database?',
      a: 'Yes! DOS-CRM-ERP connects out-of-the-box to live Supabase PostgreSQL and MongoDB database instances. Full schema migrations, Mongoose schemas, and RLS security policies are built into the architecture.',
    },
    {
      q: 'Can I export financial reports and audit logs directly to Microsoft Excel?',
      a: 'DOS-CRM-ERP provides full XLSX/Excel export powered by our backend Excel agent and SheetJS, allowing instant one-click report downloads of orders, inventory valuation, and CRM metrics.',
    },
    {
      q: 'How does the Granular Role-Based Access Control (RBAC) work?',
      a: 'System Administrators can configure default roles (Administrator, Sales Manager, Inventory Clerk, Finance Officer, Staff, Auditor) or create custom roles with explicit Create, Read, Update, and Delete permissions across CRM, Inventory, Sales, Finance, and AI modules.',
    },
  ];

  const brandLogos = [
    { name: 'Acura', label: 'ACURA', symbol: '▲' },
    { name: 'Lumina', label: 'Lumina', symbol: '◆' },
    { name: 'Apex', label: 'Apex', symbol: '▲' },
    { name: 'Swift', label: 'Swift', symbol: '⚡' },
    { name: 'Innovate', label: 'Innovate', symbol: '●' },
    { name: 'Meta', label: 'Meta', symbol: '∞' },
    { name: 'Figma', label: 'Figma', symbol: '❖' },
    { name: 'Discord', label: 'Discord', symbol: '👾' },
    { name: 'Slack', label: 'Slack', symbol: '✦' },
  ];

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-[#0F172A] font-sans selection:bg-purple-600 selection:text-white scroll-smooth overflow-x-hidden">
      {/* Top Navigation Bar (NITUX + SaaS Aesthetic) */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/90 border-b border-slate-200/80 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <Link to="/landing" className="flex items-center gap-3 group">
            <div className="h-10 w-10 rounded-[12px] bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center shadow-md shadow-purple-600/20 group-hover:scale-105 transition-transform">
              <span className="text-xl font-black text-white">D</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-black tracking-tight text-[#0F172A] leading-none">
                DOS<span className="text-purple-600">CRM</span>
              </span>
              <span className="text-[10px] font-bold tracking-widest text-slate-400 uppercase mt-0.5">ERP Suite</span>
            </div>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#product" className="hover:text-purple-600 transition-colors">{t('nav.product', 'Product')}</a>
            <a href="#solutions" className="hover:text-purple-600 transition-colors">{t('nav.solutions', 'Solutions')}</a>
            <a href="#features" className="hover:text-purple-600 transition-colors">{t('nav.features', 'Features')}</a>
            <a href="#pricing" className="hover:text-purple-600 transition-colors">{t('nav.pricing', 'Pricing')}</a>
            <a href="#resources" className="hover:text-purple-600 transition-colors">{t('nav.resources', 'Resources')}</a>
          </nav>

          {/* Right Action Buttons & Language Switcher */}
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <div className="hidden sm:flex items-center gap-1 bg-slate-100/90 rounded-full px-2 py-1 text-xs font-bold text-slate-700 border border-slate-200">
              <Globe className="h-3.5 w-3.5 text-slate-500 ml-1" />
              {(['en', 'es', 'fr'] as Language[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => setLanguage(lang)}
                  className={`px-2 py-0.5 rounded-full uppercase transition-all cursor-pointer ${
                    language === lang ? 'bg-purple-600 text-white shadow-xs' : 'hover:text-purple-600'
                  }`}
                >
                  {lang}
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="sm"
              asChild
              className="rounded-full px-4 h-10 text-slate-700 font-bold hover:bg-slate-100 transition-all"
            >
              <Link to="/login">{t('nav.signIn', 'Sign In')}</Link>
            </Button>
            <Button
              size="sm"
              asChild
              className="rounded-full px-6 h-10 bg-purple-600 hover:bg-purple-700 text-white font-bold shadow-lg shadow-purple-600/25 transition-all hover:scale-105"
            >
              <Link to="/login">{t('nav.startTrial', 'Start Free Trial')}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section (NITUX Light SaaS + Floating Widgets) */}
      <section id="product" className="relative pt-12 pb-24 overflow-hidden bg-gradient-to-b from-purple-50/50 via-[#FAFAFA] to-[#FAFAFA]">
        {/* Soft Ambient Violet Orbs */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-purple-200/30 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-40 right-10 w-[300px] h-[300px] bg-orange-200/20 rounded-full blur-[100px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* Top Pill Badge */}
          <div className="flex justify-center mb-6">
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-purple-200 text-purple-700 text-xs font-extrabold shadow-sm"
            >
              <span className="h-2 w-2 rounded-full bg-purple-600 animate-pulse" />
              {t('hero.badge', 'NO.1 CRM FOR YOUR BUSINESS')}
            </motion.div>
          </div>

          {/* Hero Headline & Subtext */}
          <div className="text-center max-w-4xl mx-auto space-y-6">
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-[#0F172A] leading-[1.1]"
            >
              Empower Your Team With{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-indigo-600">
                Smart CRM & ERP
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed"
            >
              {t('hero.subtitle', 'Easily Manage Customer Relationships, Simplify Processes, Enhance Efficiency, And Accelerate Growth With Smart CRM & ERP Solutions.')}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex flex-wrap items-center justify-center gap-4 pt-2"
            >
              <Button
                size="lg"
                asChild
                className="rounded-full px-8 h-12 text-sm sm:text-base font-bold bg-purple-600 hover:bg-purple-700 text-white shadow-xl shadow-purple-600/30 gap-2 transition-all hover:scale-105"
              >
                <Link to="/login">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => setDemoOpen(true)}
                className="rounded-full px-7 h-12 text-sm sm:text-base font-bold border border-slate-300 bg-white text-slate-800 hover:bg-slate-50 gap-2 transition-all cursor-pointer shadow-xs"
              >
                <Play className="h-4 w-4 fill-current text-purple-600" /> View Demo
              </Button>
            </motion.div>
          </div>

          {/* Floating UI Showcase Grid (Matching NITUX Image 1) */}
          <div className="relative mt-16 max-w-5xl mx-auto">
            {/* Top Left Floating Widget: $770.0 deal for Acme Inc. */}
            <motion.div
              initial={{ opacity: 0, x: -40, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:flex absolute -left-6 top-6 bg-white/95 backdrop-blur-md rounded-[20px] p-4 shadow-xl border border-slate-100 flex-col z-20 hover:scale-105 transition-transform"
            >
              <span className="text-2xl font-black text-slate-900">$770.0</span>
              <span className="text-xs font-semibold text-slate-500">deal for Acme Inc.</span>
            </motion.div>

            {/* Top Right Floating Widget: 85% of customers recommend */}
            <motion.div
              initial={{ opacity: 0, x: 40, y: 20 }}
              animate={{ opacity: 1, x: 0, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3 }}
              className="hidden lg:flex absolute -right-6 top-8 bg-white/95 backdrop-blur-md rounded-[20px] p-4 shadow-xl border border-slate-100 flex-col text-right z-20 hover:scale-105 transition-transform"
            >
              <span className="text-2xl font-black text-purple-600">85%</span>
              <span className="text-xs font-semibold text-slate-500">Of customers recommend DOS</span>
            </motion.div>

            {/* Main Center Showcase Card */}
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="rounded-[32px] bg-white p-6 sm:p-8 shadow-[0_20px_60px_rgba(124,58,237,0.08)] border border-slate-200/90 relative overflow-hidden"
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Average Sales Metric Card */}
                <div className="bg-slate-50/80 rounded-[20px] p-4 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Average Sales</span>
                    <span className="text-[11px] text-slate-400">Last Month</span>
                    <p className="text-xl font-black text-slate-900 mt-1">$20,560 <span className="text-xs text-emerald-600 font-bold">↑</span></p>
                  </div>
                  <div className="h-9 w-18 bg-emerald-50 border border-emerald-200/60 rounded-lg flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                </div>

                {/* Center Donut/Market Widget */}
                <div className="bg-purple-50/60 rounded-[20px] p-4 border border-purple-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-purple-700 uppercase tracking-wider block">Market Dominance</span>
                    <span className="text-[11px] text-slate-500">USA Distribution</span>
                    <p className="text-xl font-black text-purple-900 mt-1">62.02%</p>
                  </div>
                  <div className="h-12 w-12 rounded-full border-4 border-purple-600 border-t-purple-200 flex items-center justify-center font-bold text-[11px] text-purple-700">
                    USA
                  </div>
                </div>

                {/* Netflix Enterprise Metric Card */}
                <div className="bg-slate-50/80 rounded-[20px] p-4 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Netflix Inc.</span>
                    <span className="text-[11px] text-slate-400">Tier 1 Client</span>
                    <p className="text-xl font-black text-slate-900 mt-1">$10,260 <span className="text-xs text-rose-500 font-bold">↓</span></p>
                  </div>
                  <div className="h-9 w-18 bg-rose-50 border border-rose-200/60 rounded-lg flex items-center justify-center">
                    <ArrowDownRight className="h-5 w-5 text-rose-500" />
                  </div>
                </div>
              </div>

              {/* Integrated Live Telemetry & Stock Overview Table */}
              <div className="bg-slate-50/60 rounded-[22px] p-5 border border-slate-200/70">
                <div className="flex items-center justify-between pb-3 border-b border-slate-200/70">
                  <div className="flex items-center gap-2.5">
                    <div className="h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                    <span className="text-xs font-bold text-slate-800">Live Multi-Warehouse & Deals Telemetry</span>
                  </div>
                  <span className="text-xs font-mono font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                    ADK Multi-Agent Connected
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-500 font-medium">Inventory Valuation</span>
                    <p className="text-lg font-black text-slate-900">₹12,45,680</p>
                    <span className="text-[11px] text-emerald-600 font-bold">↑ 14.8% vs last week</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-medium">Sales Pipeline Active</span>
                    <p className="text-lg font-black text-purple-700">₹24,56,600</p>
                    <span className="text-[11px] text-purple-600 font-bold">18 Deals in Negotiation</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-slate-500 font-medium">Auto-Reorder Triggers</span>
                    <p className="text-lg font-black text-slate-900">99.8% Healthy</p>
                    <span className="text-[11px] text-slate-500">Opal OTP & Supabase Synced</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Brand Logos Bar (Trusted by section) */}
      <section className="py-12 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-xs uppercase font-bold tracking-widest text-slate-400 mb-8">
            Trusted by modern enterprise operations and high-growth revenue teams
          </p>

          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-4 items-center justify-center">
            {brandLogos.map((brand, i) => (
              <div
                key={i}
                className="h-16 bg-slate-50/80 hover:bg-purple-50/50 rounded-2xl border border-slate-200/80 flex flex-col items-center justify-center p-2 transition-all hover:scale-105 group"
              >
                <span className="text-lg text-slate-700 group-hover:text-purple-600 transition-colors font-bold">
                  {brand.symbol}
                </span>
                <span className="text-[11px] font-bold text-slate-600 group-hover:text-purple-700 tracking-tight">
                  {brand.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pipeline Management Feature Section (NITUX Image Reference) */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Pipeline Management
          </span>
          <h2 className="text-3xl sm:text-5xl font-extrabold text-[#0F172A] tracking-tight">
            Organize Deals. Gain Unmatched Visibility.
          </h2>
          <p className="text-slate-600 text-base sm:text-lg">
            {t('section.pipeline_subtitle', 'Organize Your Deals And Gain Clear Visibility Into Every Stage Of Your Sales Pipeline Effortlessly.')}
          </p>
        </div>

        {/* Pipeline Stage Visualizer Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12">
          {[
            { stage: '1. Lead In', count: '48 Leads', value: '$124,000', color: 'border-l-purple-500' },
            { stage: '2. Contacted', count: '32 Deals', value: '$290,000', color: 'border-l-blue-500' },
            { stage: '3. Proposal', count: '18 Deals', value: '$540,000', color: 'border-l-amber-500' },
            { stage: '4. Negotiation', count: '12 Deals', value: '$810,000', color: 'border-l-orange-500' },
            { stage: '5. Closed Won', count: '24 Deals', value: '$1,420,000', color: 'border-l-emerald-500' },
          ].map((col, idx) => (
            <div
              key={idx}
              className={`bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm border-l-4 ${col.color} hover:shadow-md transition-all`}
            >
              <p className="text-xs font-extrabold text-slate-500 uppercase tracking-wider">{col.stage}</p>
              <p className="text-xl font-black text-slate-900 mt-2">{col.value}</p>
              <p className="text-xs font-semibold text-slate-400 mt-1">{col.count}</p>
            </div>
          ))}
        </div>

        {/* Scalability Stats Banner */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 bg-white rounded-[28px] p-8 border border-slate-200 shadow-sm text-center">
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-purple-600">+20%</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Higher Leads Generated</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-slate-900">98%</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Client Outreach Speed</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-orange-600">4B+</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Annual Deal Volume</p>
          </div>
          <div className="space-y-1">
            <p className="text-3xl sm:text-4xl font-black text-emerald-600">46B</p>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scalable Database Records</p>
          </div>
        </div>
      </section>

      {/* Feature Bento Section (#features) */}
      <section id="features" className="py-20 bg-slate-50/70 border-t border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              {t('section.scale_title', 'Built for Modern Enterprise Scale')}
            </h2>
            <p className="text-slate-600 text-base">
              {t('section.scale_subtitle', 'Unified stock visibility, multi-warehouse automated routing, and CRM deal acceleration.')}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1: Multi-Warehouse */}
            <div className="bg-white rounded-[24px] p-8 border border-slate-200/90 shadow-xs space-y-4 hover:border-purple-300 hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-[16px] bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
                <Package className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Multi-Warehouse Routing</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Track stock across Mumbai, Delhi, Bangalore, Kolkata, and Pune facilities in real-time with automated low-stock reorder triggers.
              </p>
              <div className="pt-2">
                <Link to="/login" className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1">
                  Explore Warehouse Telemetry <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 2: CRM Pipeline */}
            <div className="bg-white rounded-[24px] p-8 border border-slate-200/90 shadow-xs space-y-4 hover:border-purple-300 hover:shadow-lg transition-all">
              <div className="h-12 w-12 rounded-[16px] bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">CRM Deal Pipeline</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Kanban stage management, client lifetime value telemetry, communication logs, and instant quote-to-invoice conversions.
              </p>
              <div className="pt-2">
                <Link to="/login" className="text-xs font-bold text-purple-600 hover:text-purple-700 flex items-center gap-1">
                  View CRM Pipelines <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 3: AI ADK Multi-Agent */}
            <div className="bg-white rounded-[24px] p-8 border border-slate-200/90 shadow-xs space-y-4 hover:border-purple-300 hover:shadow-lg transition-all">
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
        </div>
      </section>

      {/* Industry Solutions Section (#solutions) */}
      <section id="solutions" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            {t('section.industry_title', 'Tailored For Your Industry')}
          </h2>
          <p className="text-slate-600 text-base">
            {t('section.industry_subtitle', 'Customized workflows engineered for manufacturing, 3PL logistics, and wholesale commerce.')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-7 rounded-[24px] border border-slate-200/90 shadow-sm space-y-3 hover:shadow-md transition-all">
            <Building2 className="h-8 w-8 text-purple-600" />
            <h3 className="text-lg font-bold text-slate-900">Manufacturing & Parts</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Bill of materials tracking, supplier reorder cycles, batch numbers, and multi-location hardware distribution.
            </p>
            <Link to="/login" className="inline-flex text-xs font-bold text-purple-600 pt-2 hover:underline">
              Manufacturing Workflow →
            </Link>
          </div>

          <div className="bg-white p-7 rounded-[24px] border border-slate-200/90 shadow-sm space-y-3 hover:shadow-md transition-all">
            <Truck className="h-8 w-8 text-purple-600" />
            <h3 className="text-lg font-bold text-slate-900">3PL & Logistics Hubs</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Fast barcode scanning, stock intake verification, transfer routes, carrier telemetry, and GRN receipts.
            </p>
            <Link to="/login" className="inline-flex text-xs font-bold text-purple-600 pt-2 hover:underline">
              Logistics Workflow →
            </Link>
          </div>

          <div className="bg-white p-7 rounded-[24px] border border-slate-200/90 shadow-sm space-y-3 hover:shadow-md transition-all">
            <Boxes className="h-8 w-8 text-purple-600" />
            <h3 className="text-lg font-bold text-slate-900">B2B Wholesale & Retail</h3>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
              Client credit terms, automated quote-to-invoice pipelines, and tiered volume discount pricing.
            </p>
            <Link to="/login" className="inline-flex text-xs font-bold text-purple-600 pt-2 hover:underline">
              Wholesale Workflow →
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section (#pricing) */}
      <section id="pricing" className="py-20 bg-slate-50/70 border-t border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              {t('section.pricing_title', 'Transparent, Predictable Pricing')}
            </h2>
            <p className="text-slate-600 text-base">
              {t('section.pricing_subtitle', 'Start with our 14-day free trial. Scale seamlessly as your order volume grows.')}
            </p>

            <div className="inline-flex items-center p-1 rounded-full bg-slate-200/80 border border-slate-300">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600'
                }`}
              >
                Monthly Billing
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('annual')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  billingCycle === 'annual' ? 'bg-purple-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                Annual (Save 20%)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {/* Starter Plan */}
            <div className="bg-white rounded-[28px] p-8 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Starter</h3>
                <p className="text-xs text-slate-500">Essential inventory & CRM for emerging suppliers.</p>
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

            {/* Professional Plan (Featured with Orange Button) */}
            <div className="bg-white rounded-[28px] p-8 border-2 border-purple-600 shadow-xl relative flex flex-col justify-between transform md:-translate-y-2">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3.5 py-1 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-[11px] font-extrabold shadow-md">
                MOST POPULAR
              </div>
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Professional</h3>
                <p className="text-xs text-slate-500">For high-growth multi-warehouse operations.</p>
                <div className="pt-2">
                  <span className="text-4xl font-black text-purple-600">
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
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Opal SMS / WhatsApp OTP
                  </li>
                </ul>
              </div>
              <div className="pt-8">
                <Button asChild className="w-full h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/25">
                  <Link to="/login">Start 14-Day Pro Trial</Link>
                </Button>
              </div>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-white rounded-[28px] p-8 border border-slate-200 shadow-xs flex flex-col justify-between hover:border-slate-300 transition-all">
              <div className="space-y-4">
                <h3 className="text-xl font-bold text-slate-900">Enterprise</h3>
                <p className="text-xs text-slate-500">Dedicated infrastructure, custom SLAs & RBAC.</p>
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
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Dedicated Supabase / Mongo Cluster
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Granular RBAC Permissions
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
        </div>
      </section>

      {/* Testimonials Section (NITUX Image Reference) */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-2xl mx-auto mb-16 space-y-3">
          <span className="text-xs font-extrabold uppercase tracking-widest text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
            Client Success
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            {t('section.testimonials_title', 'Join over 10K+ happy customers today')}
          </h2>
          <p className="text-slate-600 text-sm">
            Discover why global supply chain leaders and CRM directors trust DOS-CRM-ERP.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              name: 'Deanna Torff',
              role: 'Supply Chain VP, Acme Corp',
              quote: 'We love DOS because their multi-agent telemetry enables us to automate purchase orders and predict warehouse stock outs in real-time.',
              avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
            },
            {
              name: 'Skylar Torff',
              role: 'Director of Sales, Luminex',
              quote: 'The deal pipeline stages and integrated invoice generation cut our sales cycle in half. Our reps close 30% more high-value contracts.',
              avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
            },
            {
              name: 'Anika Hanter',
              role: 'Operations Head, Swift Logistics',
              quote: 'Fast barcode scanning and cryptographic Opal SMS OTP authentication make staff onboarding seamless across all 5 of our distribution hubs.',
              avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=200&q=80',
            },
          ].map((t, idx) => (
            <div key={idx} className="bg-white rounded-[24px] p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                "{t.quote}"
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-slate-100">
                <img src={t.avatar} alt={t.name} className="h-10 w-10 rounded-full object-cover border border-purple-200" />
                <div>
                  <p className="text-sm font-bold text-slate-900">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Banner: The Best CRM Solution For Your Business */}
      <section className="py-12 max-w-7xl mx-auto px-6">
        <div className="bg-gradient-to-r from-purple-700 via-purple-600 to-indigo-700 rounded-[32px] p-10 sm:p-14 text-white text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mb-4">
            The Best CRM & ERP Solution For Your Business
          </h2>
          <p className="text-purple-100 max-w-2xl mx-auto text-sm sm:text-base mb-8">
            Streamline your business with our AI-driven platform. Sign up now to manage contacts, track inventory, and accelerate customer relationships effortlessly.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              asChild
              className="rounded-full px-8 h-12 bg-white text-purple-700 font-bold hover:bg-slate-100 shadow-lg"
            >
              <Link to="/login">Get Started Now</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => setDemoOpen(true)}
              className="rounded-full px-7 h-12 border-2 border-white/80 text-white hover:bg-white/10 font-bold"
            >
              <Play className="h-4 w-4 fill-current mr-2" /> View Interactive Demo
            </Button>
          </div>
        </div>
      </section>

      {/* FAQ & Knowledge Base Section (#resources) */}
      <section id="resources" className="py-20 bg-white border-t border-slate-200/80">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12 space-y-3">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
              {t('section.faq_title', 'Frequently Asked Questions')}
            </h2>
            <p className="text-slate-600 text-sm">
              Everything you need to know about DOS-CRM-ERP, Python ADK agents, and multi-warehouse setup.
            </p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="rounded-[18px] bg-slate-50 border border-slate-200/90 overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setActiveFaq(activeFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 text-sm sm:text-base cursor-pointer"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-500 transition-transform shrink-0 ${
                      activeFaq === idx ? 'rotate-180 text-purple-600' : ''
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
                      className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-relaxed border-t border-slate-200/60 pt-3"
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

      {/* Footer & Company Section */}
      <footer className="py-14 bg-white border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-200">
            {/* Brand Column */}
            <div className="space-y-3">
              <div className="flex items-center gap-2.5 font-black text-slate-900 text-lg">
                <div className="h-8 w-8 rounded-[10px] bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white font-black text-sm shadow-xs">
                  D
                </div>
                DOS-CRM-ERP
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enterprise Inventory & CRM intelligence platform built with Python ADK agents, Opal OTP, and granular RBAC.
              </p>
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 pt-1">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                All Systems Operational
              </div>
            </div>

            {/* Product Links */}
            <div className="space-y-2.5 text-xs text-slate-600">
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Product</p>
              <p><a href="#features" className="hover:text-purple-600">Multi-Warehouse Telemetry</a></p>
              <p><a href="#features" className="hover:text-purple-600">CRM Deal Pipeline</a></p>
              <p><a href="#features" className="hover:text-purple-600">Python ADK Multi-Agents</a></p>
              <p><Link to="/login" className="hover:text-purple-600">Opal OTP Authentication</Link></p>
            </div>

            {/* Solutions Links */}
            <div className="space-y-2.5 text-xs text-slate-600">
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Solutions</p>
              <p><a href="#solutions" className="hover:text-purple-600">Manufacturing & Parts</a></p>
              <p><a href="#solutions" className="hover:text-purple-600">3PL Warehouses</a></p>
              <p><a href="#solutions" className="hover:text-purple-600">Wholesale Distribution</a></p>
              <p><a href="#pricing" className="hover:text-purple-600">Pricing & Plans</a></p>
            </div>

            {/* Direct Access */}
            <div className="space-y-2.5 text-xs text-slate-600">
              <p className="font-bold text-slate-900 uppercase tracking-wider text-[11px]">Direct Access</p>
              <p><Link to="/login" className="text-purple-600 font-bold hover:underline">Platform Sign In</Link></p>
              <p><Link to="/register" className="text-purple-600 font-bold hover:underline">Create Account</Link></p>
              <p><Link to="/staff-login" className="hover:text-purple-600">Staff Portal Login</Link></p>
              <p><Link to="/forgot-password" className="hover:text-purple-600">Password Recovery</Link></p>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
            <p>© 2026 DOS-CRM-ERP Inc. All rights reserved.</p>
            <div className="flex items-center gap-6 font-medium">
              <Link to="/login" className="hover:text-purple-600">Privacy Policy</Link>
              <Link to="/login" className="hover:text-purple-600">Terms of Service</Link>
              <Link to="/login" className="hover:text-purple-600">Security Whitepaper</Link>
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
              <div className="h-7 w-7 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold text-xs">
                ▶
              </div>
              <div>
                <p className="text-sm font-bold text-white">DOS-CRM-ERP Interactive Product Walkthrough</p>
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
                <span className="px-3 py-1 rounded-full bg-purple-600/90 backdrop-blur-md text-white font-bold text-xs">
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
                className="h-7 w-7 rounded-full bg-purple-600 hover:bg-purple-700 flex items-center justify-center text-white"
              >
                {isPlaying ? '⏸' : '▶'}
              </button>
              <div className="flex-1 h-1.5 bg-white/20 rounded-full overflow-hidden cursor-pointer">
                <div className="h-full bg-purple-600 rounded-full w-2/3" />
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
                    ? 'bg-purple-600/30 border border-purple-500 text-purple-300 font-bold'
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
              className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs"
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
