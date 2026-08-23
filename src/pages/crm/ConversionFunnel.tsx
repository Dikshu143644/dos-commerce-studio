import { motion } from 'motion/react';
import {
  TrendingUp,
  Users,
  Target,
  Award,
  Zap,
  ArrowRight,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { useLeadsByStage, useHotLeads, useConvertLead } from '@/hooks/useLeadPipeline';
import type { Lead } from '@/types/database';

const FUNNEL_COLORS = ['#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#6366f1'];

function ScoreBadge({ score }: { score: number | null }) {
  if (score === null || score === undefined) return null;
  const color =
    score > 70
      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
      : score > 40
        ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
        : 'bg-red-500/20 text-red-400 border-red-500/30';
  return (
    <div className={`flex h-7 w-7 items-center justify-center rounded-full border text-[10px] font-bold ${color}`}>
      {score}
    </div>
  );
}

export default function ConversionFunnelPage() {
  const { data: leadsByStage, isLoading: stagesLoading } = useLeadsByStage();
  const { data: hotLeads, isLoading: hotLeadsLoading } = useHotLeads();
  const convertLead = useConvertLead();

  const isLoading = stagesLoading;

  // Calculate funnel data from leadsByStage
  const allLeads = leadsByStage
    ? Object.values(leadsByStage).flat()
    : [];

  const totalLeads = allLeads.length;
  const qualifiedCount = leadsByStage?.qualified?.length ?? 0;
  const proposalCount = leadsByStage?.proposal?.length ?? 0;
  const negotiationCount = leadsByStage?.negotiation?.length ?? 0;
  const wonCount = leadsByStage?.won?.length ?? 0;
  const lostCount = leadsByStage?.lost?.length ?? 0;

  const funnelData = [
    { name: 'All Leads', value: totalLeads, fill: FUNNEL_COLORS[0] },
    { name: 'Qualified', value: qualifiedCount + proposalCount + negotiationCount + wonCount, fill: FUNNEL_COLORS[1] },
    { name: 'Proposal', value: proposalCount + negotiationCount + wonCount, fill: FUNNEL_COLORS[2] },
    { name: 'Won', value: wonCount, fill: FUNNEL_COLORS[3] },
  ];

  // Conversion rates
  const qualificationRate = totalLeads > 0 ? Math.round(((qualifiedCount + proposalCount + negotiationCount + wonCount) / totalLeads) * 100) : 0;
  const proposalRate = (qualifiedCount + proposalCount + negotiationCount + wonCount) > 0
    ? Math.round(((proposalCount + negotiationCount + wonCount) / (qualifiedCount + proposalCount + negotiationCount + wonCount)) * 100)
    : 0;
  const winRate = (wonCount + lostCount) > 0 ? Math.round((wonCount / (wonCount + lostCount)) * 100) : 0;

  // Source effectiveness - calculate conversion rate per source
  const sourceStats: Record<string, { total: number; converted: number }> = {};
  allLeads.forEach((lead) => {
    if (!sourceStats[lead.source]) {
      sourceStats[lead.source] = { total: 0, converted: 0 };
    }
    sourceStats[lead.source].total++;
    if (['qualified', 'proposal', 'negotiation', 'won'].includes(lead.status)) {
      sourceStats[lead.source].converted++;
    }
  });

  const sourceChartData = Object.entries(sourceStats).map(([source, stats]) => ({
    source: source.replace('_', ' '),
    conversion: stats.total > 0 ? Math.round((stats.converted / stats.total) * 100) : 0,
    total: stats.total,
  })).sort((a, b) => b.conversion - a.conversion);

  // Monthly trends - group by month
  const monthlyData: Record<string, { created: number; converted: number }> = {};
  allLeads.forEach((lead) => {
    const month = lead.created_at.substring(0, 7); // YYYY-MM
    if (!monthlyData[month]) {
      monthlyData[month] = { created: 0, converted: 0 };
    }
    monthlyData[month].created++;
    if (lead.status === 'won') {
      monthlyData[month].converted++;
    }
  });

  const trendData = Object.entries(monthlyData)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-6)
    .map(([month, data]) => ({
      month: new Date(month + '-01').toLocaleDateString('en', { month: 'short' }),
      created: data.created,
      converted: data.converted,
    }));

  const handleConvert = (lead: Lead) => {
    convertLead.mutate(
      { lead_id: lead.id, performed_by: 'current-user' },
      {
        onSuccess: () => toast.success(`${lead.name} converted to customer`),
        onError: (error) => toast.error(`Failed to convert: ${error.message}`),
      }
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Conversion Funnel"
        description="Analyze your lead conversion pipeline and performance metrics"
      />

      {isLoading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-[16px]" />
            ))}
          </div>
          <Skeleton className="h-64 rounded-[16px]" />
          <Skeleton className="h-48 rounded-[16px]" />
        </div>
      ) : totalLeads === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="No funnel data yet"
          description="Create leads to start seeing your conversion funnel metrics."
        />
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{totalLeads}</p>
                  <p className="text-xs text-muted-foreground">Total Leads</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500/20">
                  <Target className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{qualificationRate}%</p>
                  <p className="text-xs text-muted-foreground">Qualification Rate</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/20">
                  <TrendingUp className="h-5 w-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{proposalRate}%</p>
                  <p className="text-xs text-muted-foreground">Proposal Rate</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
                  <Award className="h-5 w-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xl font-bold text-foreground">{winRate}%</p>
                  <p className="text-xs text-muted-foreground">Win Rate</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Funnel Visualization */}
          <Card>
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-foreground mb-4">Conversion Funnel</h3>
              <div className="space-y-2">
                {funnelData.map((stage, idx) => {
                  const maxValue = funnelData[0].value || 1;
                  const widthPercent = Math.max((stage.value / maxValue) * 100, 10);
                  const nextStage = funnelData[idx + 1];
                  const convRate = nextStage && stage.value > 0
                    ? Math.round((nextStage.value / stage.value) * 100)
                    : null;

                  return (
                    <div key={stage.name} className="space-y-1">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 rounded-[8px] flex items-center px-4 transition-all"
                          style={{
                            width: `${widthPercent}%`,
                            background: `linear-gradient(135deg, ${stage.fill}, ${stage.fill}80)`,
                          }}
                        >
                          <span className="text-xs font-medium text-white whitespace-nowrap">
                            {stage.name}: {stage.value}
                          </span>
                        </div>
                        {convRate !== null && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <ArrowRight className="h-3 w-3" />
                            {convRate}%
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Source Effectiveness */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Lead Source Effectiveness</h3>
                {sourceChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={sourceChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis type="number" domain={[0, 100]} tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                      <YAxis dataKey="source" type="category" tick={{ fill: '#a1a1aa', fontSize: 11 }} width={80} />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(10,10,10,0.9)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: '#f4f4f4' }}
                      />
                      <Bar dataKey="conversion" fill="#10b981" radius={[0, 4, 4, 0]} name="Conversion %" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No source data</p>
                )}
              </CardContent>
            </Card>

            {/* Monthly Trends */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-foreground mb-4">Monthly Trends</h3>
                {trendData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={trendData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                      <XAxis dataKey="month" tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                      <YAxis tick={{ fill: '#a1a1aa', fontSize: 11 }} />
                      <Tooltip
                        contentStyle={{
                          background: 'rgba(10,10,10,0.9)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          borderRadius: '8px',
                        }}
                        labelStyle={{ color: '#f4f4f4' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="created"
                        stroke="#10b981"
                        fill="#10b981"
                        fillOpacity={0.2}
                        name="Created"
                      />
                      <Area
                        type="monotone"
                        dataKey="converted"
                        stroke="#14b8a6"
                        fill="#14b8a6"
                        fillOpacity={0.2}
                        name="Converted"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">No trend data</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Hot Leads Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-amber-400" />
                  <h3 className="text-sm font-semibold text-foreground">Hot Leads (Score &gt; 70)</h3>
                </div>
                <Badge variant="warning">{hotLeads?.length ?? 0} leads</Badge>
              </div>

              {hotLeadsLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full rounded-[12px]" />
                  ))}
                </div>
              ) : !hotLeads || hotLeads.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-6">
                  No hot leads at the moment
                </p>
              ) : (
                <div className="space-y-2">
                  {hotLeads.slice(0, 5).map((lead: Lead) => (
                    <motion.div
                      key={lead.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center justify-between p-3 rounded-[12px] bg-card border border-border hover:border-primary/20 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <ScoreBadge score={lead.score} />
                        <div>
                          <p className="text-sm font-medium text-foreground">{lead.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {lead.company || 'No company'} | {lead.source.replace('_', ' ')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {lead.estimated_value && (
                          <span className="text-xs text-primary font-medium">
                            ${lead.estimated_value.toLocaleString()}
                          </span>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleConvert(lead)}
                          disabled={convertLead.isPending}
                          className="text-xs"
                        >
                          Convert
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </motion.div>
  );
}
