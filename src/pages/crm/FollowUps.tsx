import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Clock,
  CheckCircle2,
  Zap,
  Sparkles,
  MessageSquare,
  Send,
  ShoppingCart,
  TrendingUp,
  CheckCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { PageHeader } from '@/components/shared/PageHeader';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';

interface WhatsAppEngagementLog {
  id: string;
  client_name: string;
  company_name: string;
  phone: string;
  trigger_type: 'abandoned_cart' | 'quote_followup' | 'post_delivery' | 'reorder_alert';
  trigger_interval: string;
  cart_value_inr?: number;
  items_summary: string;
  ai_message: string;
  coupon_code?: string;
  status: 'converted' | 'delivered' | 'read' | 'queued';
  sent_at: string;
  converted_amount?: number;
}

const initialLogs: WhatsAppEngagementLog[] = [
  {
    id: 'wa-1',
    client_name: 'Rajesh Sharma',
    company_name: 'Apex Industrial Solutions',
    phone: '+91 98201 44892',
    trigger_type: 'abandoned_cart',
    trigger_interval: '1 Hour 15 Mins after Cart Addition',
    cart_value_inr: 50000,
    items_summary: '5x Circuit Board Pro X1',
    ai_message: 'Hi Rajesh! We noticed you left 5x Circuit Board Pro X1 in your DOS-CRM-ERP order cart. Use code RECOVER10 for an instant 10% off at checkout. Stock reserved for 2 hours: dos-crm.in/c/8921',
    coupon_code: 'RECOVER10',
    status: 'converted',
    sent_at: 'Today at 10:45 AM',
    converted_amount: 45000,
  },
  {
    id: 'wa-2',
    client_name: 'Sneha Patel',
    company_name: 'MicroTech Automation Ltd',
    phone: '+91 98450 11928',
    trigger_type: 'abandoned_cart',
    trigger_interval: '2 Hours after Cart Addition',
    cart_value_inr: 81600,
    items_summary: '3x Industrial Servo Motor 750W',
    ai_message: 'Hello Sneha, your wholesale cart for 3x Servo Motors 750W has priority dispatch routing available from Mumbai Hub today. Need any custom technical specs or GST assistance?',
    coupon_code: 'FASTFREIGHT',
    status: 'read',
    sent_at: 'Today at 11:30 AM',
  },
  {
    id: 'wa-3',
    client_name: 'Harish Mehta',
    company_name: 'Acura Fabricators Pvt Ltd',
    phone: '+91 97110 33491',
    trigger_type: 'quote_followup',
    trigger_interval: '24 Hours Post Price Quotation',
    cart_value_inr: 511450,
    items_summary: 'Quotation QT-2026-003 (Heavy Duty Stepper Drivers)',
    ai_message: 'Greetings Harish, following up on your formal proposal QT-2026-003. We can allocate delivery to Pune depot within 24 hours upon order confirmation.',
    status: 'delivered',
    sent_at: 'Yesterday at 04:15 PM',
  },
  {
    id: 'wa-4',
    client_name: 'Vikram Sethi',
    company_name: 'Apex Robotics Labs',
    phone: '+91 99302 88471',
    trigger_type: 'reorder_alert',
    trigger_interval: '30-Day Predictive Consumption AI Trigger',
    items_summary: '10x Thermal Paste TG-7 Extreme',
    ai_message: 'Hi Vikram! Based on your regular manufacturing cycles, your thermal compound reserves might be running low. 1-click reorder is ready for instant dispatch: dos-crm.in/reorder/920',
    status: 'queued',
    sent_at: 'Queued for 02:00 PM',
  },
];

export default function FollowUps() {
  useDocumentTitle('Automated Follow-Ups & WhatsApp AI Agents | DOS-CRM-ERP');

  const [logs, setLogs] = useState<WhatsAppEngagementLog[]>(initialLogs);
  const [filter, setFilter] = useState<'all' | 'abandoned_cart' | 'quote_followup' | 'reorder_alert'>('all');
  const [cartAutomationActive, setCartAutomationActive] = useState(true);
  const [quoteAutomationActive, setQuoteAutomationActive] = useState(true);
  const [reorderAutomationActive, setReorderAutomationActive] = useState(true);

  const handleSimulateTrigger = () => {
    const newLog: WhatsAppEngagementLog = {
      id: `wa-${Date.now()}`,
      client_name: 'Chris Evans',
      company_name: 'Evans Electronics Hub',
      phone: '+91 98190 22345',
      trigger_type: 'abandoned_cart',
      trigger_interval: '1 Hour 30 Mins after Cart Addition',
      cart_value_inr: 28160,
      items_summary: '4x Ultra-Bright LED Panel 60W',
      ai_message: 'Hi Chris! We saved your wholesale order for 4x LED Panels 60W. Complete checkout with code FLASH10 for 10% instant discount + Free Express Transit!',
      coupon_code: 'FLASH10',
      status: 'delivered',
      sent_at: 'Just now (AI Trigger)',
    };

    setLogs([newLog, ...logs]);
    toast.success('Autonomous WhatsApp Cart Recovery Agent dispatched message!', {
      description: `Sent to Chris Evans (+91 98190 22345) • Value: ₹28,160`,
    });
  };

  const filteredLogs = logs.filter((log) => (filter === 'all' ? true : log.trigger_type === filter));

  const metrics = {
    totalSent: logs.length,
    convertedCount: logs.filter((l) => l.status === 'converted').length,
    convertedRevenue: logs.reduce((acc, l) => acc + (l.converted_amount || 0), 0) + 1480000,
    recoveryRate: 42.8,
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <PageHeader
        badge="Autonomous Multi-Agent AI Engine"
        title="Automated Follow-Ups & WhatsApp CRM Agent"
        description="Autonomous 1-2 hour abandoned cart WhatsApp notifications, quotation nudges, and predictive client re-engagement."
        actions={
          <Button
            onClick={handleSimulateTrigger}
            className="rounded-2xl h-11 px-5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition-all hover:scale-105"
          >
            <Send className="h-4 w-4" /> Trigger WhatsApp AI Follow-up
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">AI WhatsApp Messages</p>
              <h3 className="text-3xl font-black text-slate-900">{metrics.totalSent + 42}</h3>
              <p className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Autonomous triggers
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
              <MessageSquare className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cart Recovery Rate</p>
              <h3 className="text-3xl font-black text-purple-700">{metrics.recoveryRate}%</h3>
              <p className="text-xs text-purple-600 font-semibold flex items-center gap-1">
                <TrendingUp className="h-3 w-3" /> 1-2 Hour Trigger Window
              </p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
              <ShoppingCart className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border-2 border-emerald-500/80 bg-white shadow-lg shadow-emerald-500/5 hover:shadow-2xl transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Revenue Recovered</p>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-600">₹{(metrics.convertedRevenue / 100000).toFixed(2)}L</h3>
              <p className="text-xs text-emerald-700 font-semibold">Direct AI Attribution</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-emerald-100 border border-emerald-300 text-emerald-800 flex items-center justify-center">
              <Zap className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-3xl border border-slate-200/90 bg-white shadow-sm hover:shadow-xl transition-all duration-300">
          <CardContent className="p-6 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Avg Response Time</p>
              <h3 className="text-3xl font-black text-slate-900">&lt; 12 mins</h3>
              <p className="text-xs text-slate-500 font-medium">Instant client WhatsApp replies</p>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center">
              <Clock className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Autonomous Rules Config Row */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
          <Zap className="h-4 w-4 text-purple-600" /> Autonomous Trigger Rules (ADK Agent Rules)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900">Abandoned Cart AI (1-2 Hours)</p>
              <p className="text-[11px] text-slate-500">Auto-sends personalized WhatsApp discount</p>
            </div>
            <Switch
              checked={cartAutomationActive}
              onCheckedChange={(val) => {
                setCartAutomationActive(val);
                toast.success(`Cart recovery trigger ${val ? 'Activated' : 'Deactivated'}`);
              }}
            />
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900">Quotation Expiry Nudge (24h)</p>
              <p className="text-[11px] text-slate-500">Reminds client before proposal expires</p>
            </div>
            <Switch
              checked={quoteAutomationActive}
              onCheckedChange={(val) => {
                setQuoteAutomationActive(val);
                toast.success(`Quotation nudge trigger ${val ? 'Activated' : 'Deactivated'}`);
              }}
            />
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-slate-900">Predictive Reorder Alert (30d)</p>
              <p className="text-[11px] text-slate-500">AI predicts factory restocking cycle</p>
            </div>
            <Switch
              checked={reorderAutomationActive}
              onCheckedChange={(val) => {
                setReorderAutomationActive(val);
                toast.success(`Predictive reorder trigger ${val ? 'Activated' : 'Deactivated'}`);
              }}
            />
          </div>
        </div>
      </div>

      {/* Engagement Logs Filter & Timeline */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">Live Client WhatsApp Engagement Logs</h3>
            <p className="text-xs text-slate-400">Timestamps, personalized payloads, discount codes, and conversion telemetry</p>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl">
            {[
              { id: 'all', label: 'All Triggers' },
              { id: 'abandoned_cart', label: 'Abandoned Cart' },
              { id: 'quote_followup', label: 'Quote Nudges' },
              { id: 'reorder_alert', label: 'Reorders' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id as any)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  filter === f.id ? 'bg-white text-purple-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredLogs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-3xl border border-slate-200/90 p-6 shadow-sm hover:shadow-md transition-all space-y-4"
            >
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base text-slate-900">{log.client_name}</span>
                      <span className="text-xs text-slate-400 font-medium">({log.company_name})</span>
                      <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 text-[10px] font-bold">
                        WhatsApp {log.phone}
                      </Badge>
                    </div>
                    <p className="text-xs text-purple-700 font-semibold flex items-center gap-1.5 mt-0.5">
                      <Clock className="h-3 w-3" /> Trigger Timing: <strong>{log.trigger_interval}</strong>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {log.status === 'converted' && (
                    <span className="inline-flex items-center gap-1 text-xs font-black text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Converted (₹{log.converted_amount?.toLocaleString('en-IN')})
                    </span>
                  )}
                  {log.status === 'read' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
                      <CheckCheck className="h-3.5 w-3.5 text-blue-600" /> Read by Client
                    </span>
                  )}
                  {log.status === 'delivered' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                      <CheckCheck className="h-3.5 w-3.5 text-slate-400" /> Delivered
                    </span>
                  )}
                  {log.status === 'queued' && (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                      <Clock className="h-3.5 w-3.5" /> Next Schedule Window
                    </span>
                  )}
                </div>
              </div>

              {/* Items & AI Message Bubble */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-1 space-y-1 bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Target Items</span>
                  <p className="text-xs font-extrabold text-slate-800">{log.items_summary}</p>
                  {log.cart_value_inr && (
                    <p className="text-xs text-purple-700 font-bold mt-1">
                      Cart Total: ₹{log.cart_value_inr.toLocaleString('en-IN')}
                    </p>
                  )}
                  {log.coupon_code && (
                    <div className="inline-block bg-orange-100 text-orange-800 text-[10px] font-black px-2 py-0.5 rounded border border-orange-200 mt-1">
                      Promo: {log.coupon_code}
                    </div>
                  )}
                </div>

                <div className="md:col-span-2 bg-emerald-50/40 p-4 rounded-2xl border border-emerald-200/80 space-y-2">
                  <div className="flex items-center justify-between text-[11px] text-emerald-800 font-bold">
                    <span className="flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5" /> AI Generated WhatsApp Copy
                    </span>
                    <span className="text-slate-400 font-normal">{log.sent_at}</span>
                  </div>
                  <p className="text-xs text-slate-700 italic leading-relaxed bg-white p-3 rounded-xl border border-emerald-100 shadow-xs">
                    "{log.ai_message}"
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
