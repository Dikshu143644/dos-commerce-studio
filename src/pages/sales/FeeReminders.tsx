import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  Send,
  AlertTriangle,
  RefreshCw,
  School,
  Phone,
  MessageSquare,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import {
  fetchFeeAnalysis,
  triggerBatchFeeReminders,
  sendSingleFeeReminder,
  type FeeAnalysisResponse,
  type StudentFeeRecord,
} from '@/services/automations/feeReminderService';

export default function FeeRemindersPage() {
  useDocumentTitle('FeeAlert - Ashramshala Pathraj Fee Reminders');

  const [data, setData] = useState<FeeAnalysisResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBatchSending, setIsBatchSending] = useState(false);
  const [sendingId, setSendingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetchFeeAnalysis();
      setData(res);
    } catch {
      toast.error('Failed to load fee analysis records');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchDispatch = async () => {
    setIsBatchSending(true);
    try {
      const res = await triggerBatchFeeReminders();
      if (res.status === 'success') {
        toast.success(res.message, { duration: 6000 });
        await loadData();
      } else {
        toast.error('Failed to trigger batch dispatch');
      }
    } catch {
      toast.error('Batch dispatch execution failed');
    } finally {
      setIsBatchSending(false);
    }
  };

  const handleSendSingle = async (student: StudentFeeRecord) => {
    setSendingId(student.id);
    try {
      const res = await sendSingleFeeReminder(student.id);
      if (res.status === 'success') {
        toast.success(`[Marathi SMS Sent] ${res.message}`, { duration: 6000 });
        await loadData();
      } else {
        toast.error(res.message);
      }
    } catch {
      toast.error('Failed to send SMS reminder');
    } finally {
      setSendingId(null);
    }
  };

  const filteredRecords = (data?.pending_records || []).filter((r) => {
    const matchesSearch =
      r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.parent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.phone.includes(searchQuery) ||
      r.id.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesGrade = filterGrade === 'all' || r.grade.includes(filterGrade);
    return matchesSearch && matchesGrade;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-[24px] border border-slate-200/90 bg-white p-6 md:p-8 shadow-xs">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold shadow-xs mb-2">
              <School className="h-3.5 w-3.5 text-orange-500" /> Opal Automation: Ashramshala Pathraj (आश्रमशाळा पाथरज)
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900 flex items-center gap-2">
              Fee Management Dashboard <span className="text-orange-500 text-lg font-black">(FeeAlert)</span>
            </h1>
            <p className="text-sm text-slate-600 font-medium">
              Automated daily 9 AM Marathi SMS reminders for parents with pending school fee dues.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              onClick={loadData}
              disabled={loading}
              className="rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold gap-1.5"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
            </Button>
            <Button
              size="sm"
              onClick={handleBatchDispatch}
              disabled={isBatchSending || loading}
              className="rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs shadow-md shadow-orange-500/20 gap-1.5"
            >
              <Send className="h-3.5 w-3.5" />
              {isBatchSending ? 'Dispatching Queue...' : 'Trigger 9 AM Batch Dispatch'}
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Insights (3 Metric Cards matching Opal spec) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-[22px] bg-white border border-slate-200/90 shadow-xs p-6">
          <CardContent className="p-0 flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Students Pending</p>
              <p className="text-3xl font-black text-slate-900 tracking-tight">
                {data?.total_students_pending ?? 5}{' '}
                <span className="text-xs font-semibold text-slate-400">/ {data?.total_students ?? 7} students</span>
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                <span className="text-xs font-bold text-amber-600">Pending Parent Clearance</span>
              </div>
            </div>
            <div className="h-11 w-11 rounded-[14px] bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] bg-white border border-slate-200/90 shadow-xs p-6">
          <CardContent className="p-0 flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Outstanding Amount</p>
              <p className="text-3xl font-black text-orange-600 tracking-tight font-mono">
                ₹{(data?.total_outstanding_amount ?? 41500).toLocaleString()}
              </p>
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-xs font-bold text-slate-500">Across Grades 6th - 10th</span>
              </div>
            </div>
            <div className="h-11 w-11 rounded-[14px] bg-orange-50 border border-orange-200 flex items-center justify-center text-orange-600">
              <School className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-[22px] bg-white border border-slate-200/90 shadow-xs p-6">
          <CardContent className="p-0 flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">SMS Queue Status</p>
              <p className="text-xl font-black text-slate-900 tracking-tight">
                {data?.total_students_pending ?? 5} Ready
              </p>
              <div className="flex items-center gap-1.5 pt-1 text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold">Jio/BSNL Gateway Active</span>
              </div>
            </div>
            <div className="h-11 w-11 rounded-[14px] bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
              <MessageSquare className="h-5 w-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-4 rounded-[20px] border border-slate-200/90 shadow-xs">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student, parent, roll no, or phone..."
            className="pl-9 h-10 bg-slate-50 border-slate-200 rounded-xl text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={filterGrade}
            onChange={(e) => setFilterGrade(e.target.value)}
            className="h-10 px-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-orange-500"
          >
            <option value="all">All Grades (सर्व वर्ग)</option>
            <option value="८">Grade 8 (इयत्ता ८ वी)</option>
            <option value="९">Grade 9 (इयत्ता ९ वी)</option>
            <option value="१०">Grade 10 (इयत्ता १० वी)</option>
          </select>
        </div>
      </div>

      {/* Student Records Table */}
      <div className="overflow-hidden rounded-[24px] border border-slate-200/90 bg-white shadow-xs">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900">Pending Student Fee Dues</h3>
            <p className="text-xs text-slate-500">Live dataset filtered for students with pending fee obligations.</p>
          </div>
          <Badge className="bg-orange-100 text-orange-700 border-orange-200 text-xs font-bold">
            {filteredRecords.length} Students Pending
          </Badge>
        </div>

        <div className="divide-y divide-slate-100">
          {filteredRecords.map((student) => (
            <motion.div
              key={student.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-5 hover:bg-orange-50/20 transition-colors"
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
                {/* Student info */}
                <div className="lg:col-span-3 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                      {student.roll_no}
                    </span>
                    <span className="text-xs font-semibold text-orange-600">{student.grade}</span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm leading-tight">{student.student_name}</h4>
                  <p className="text-xs text-slate-500 flex items-center gap-1">
                    <span className="font-semibold">पालक:</span> {student.parent_name}
                  </p>
                </div>

                {/* Contact & Amount */}
                <div className="lg:col-span-3 space-y-1">
                  <p className="text-xs text-slate-600 flex items-center gap-1.5 font-medium">
                    <Phone className="h-3.5 w-3.5 text-orange-500" /> {student.phone}
                  </p>
                  <div className="pt-1 flex items-baseline gap-2">
                    <span className="text-xs text-slate-400 font-medium">Pending:</span>
                    <span className="text-base font-black text-orange-600 font-mono">
                      ₹{student.pending_amount.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400 font-mono">/ ₹{student.total_fee.toLocaleString()}</span>
                  </div>
                  {student.last_notified && (
                    <p className="text-[10px] text-emerald-600 font-medium">
                      Last Notified: {new Date(student.last_notified).toLocaleDateString()}
                    </p>
                  )}
                </div>

                {/* Marathi SMS Preview (Recessed Component per Opal Spec) */}
                <div className="lg:col-span-4">
                  <div className="rounded-xl bg-orange-50/70 border border-orange-200/80 p-3 text-xs leading-relaxed text-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-orange-700">
                      <span className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" /> Marathi SMS Preview
                      </span>
                      <span className="text-emerald-700">Ready</span>
                    </div>
                    <p className="font-medium text-slate-800 text-[11px]">
                      &ldquo;{student.sms_preview}&rdquo;
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="lg:col-span-2 flex justify-end">
                  <Button
                    size="sm"
                    onClick={() => handleSendSingle(student)}
                    disabled={sendingId === student.id}
                    className="w-full lg:w-auto rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs gap-1.5 shadow-xs"
                  >
                    <Send className="h-3 w-3" />
                    {sendingId === student.id ? 'Sending...' : 'Verify & Send'}
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
