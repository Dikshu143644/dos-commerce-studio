import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Bell,
  Zap,
  BarChart3,
} from 'lucide-react';
import { format, addDays, isBefore, isAfter, endOfDay, addWeeks } from 'date-fns';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  useUpcomingFollowUps,
  useOverdueFollowUps,
  useSnoozeFollowUp,
  useFollowUpRules,
  useToggleRule,
} from '@/hooks/useFollowUps';
import { useCompleteActivity } from '@/hooks/useActivities';
import type { CrmActivity, FollowUpRule } from '@/types/database';

function FollowUpCard({
  activity,
  variant = 'default',
}: {
  activity: CrmActivity;
  variant?: 'overdue' | 'today' | 'default';
}) {
  const snoozeFollowUp = useSnoozeFollowUp();
  const completeActivity = useCompleteActivity();

  const borderColor =
    variant === 'overdue'
      ? 'border-l-red-500'
      : variant === 'today'
        ? 'border-l-amber-500'
        : 'border-l-border';

  const handleSnooze = (days: number) => {
    const newDate = addDays(new Date(), days).toISOString();
    snoozeFollowUp.mutate(
      { activity_id: activity.id, new_scheduled_at: newDate },
      {
        onSuccess: () => toast.info(`Follow-up snoozed for ${days} day${days > 1 ? 's' : ''}`),
        onError: (error) => toast.error(`Failed to snooze: ${error.message}`),
      }
    );
  };

  const handleComplete = () => {
    completeActivity.mutate(activity.id, {
      onSuccess: () => toast.success('Follow-up completed'),
      onError: (error) => toast.error(`Failed to complete: ${error.message}`),
    });
  };

  return (
    <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`border-l-4 ${borderColor}`}>
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-foreground truncate">{activity.title}</h4>
              {activity.description && (
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{activity.description}</p>
              )}
              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                {activity.scheduled_at && (
                  <span className={variant === 'overdue' ? 'text-red-400' : ''}>
                    <Clock className="inline h-3 w-3 mr-1" />
                    {format(new Date(activity.scheduled_at), 'MMM d, HH:mm')}
                  </span>
                )}
                <span>{activity.performed_by}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="text-xs">
                    Snooze
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => handleSnooze(1)}>+1 Day</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSnooze(3)}>+3 Days</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSnooze(7)}>+7 Days</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                size="sm"
                variant="outline"
                onClick={handleComplete}
                disabled={completeActivity.isPending}
                className="text-xs"
              >
                <CheckCircle2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function RuleCard({ rule }: { rule: FollowUpRule }) {
  const toggleRule = useToggleRule();

  const handleToggle = (checked: boolean) => {
    toggleRule.mutate(
      { ruleId: rule.id, isActive: checked },
      {
        onSuccess: () =>
          toast.success(`Rule "${rule.name}" ${checked ? 'enabled' : 'disabled'}`),
        onError: (error) => toast.error(`Failed to toggle rule: ${error.message}`),
      }
    );
  };

  return (
    <div className="flex items-center justify-between p-3 rounded-[12px] bg-card border border-border">
      <div className="flex-1 min-w-0 mr-3">
        <p className="text-sm font-medium text-foreground">{rule.name}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Trigger: {rule.trigger_event.replace(/_/g, ' ')} |
          Action: {rule.action_type} in {rule.action_config.delay_days} days
        </p>
      </div>
      <Switch
        checked={rule.is_active}
        onCheckedChange={handleToggle}
        disabled={toggleRule.isPending}
      />
    </div>
  );
}

export default function FollowUpsPage() {
  const [rulesExpanded, setRulesExpanded] = useState(false);

  const { data: upcoming, isLoading: upcomingLoading } = useUpcomingFollowUps();
  const { data: overdue, isLoading: overdueLoading } = useOverdueFollowUps();
  const { data: rules, isLoading: rulesLoading } = useFollowUpRules();

  const isLoading = upcomingLoading || overdueLoading;

  // Split upcoming into today and this week
  const now = new Date();
  const todayEnd = endOfDay(now);
  const weekEnd = endOfDay(addWeeks(now, 1));

  const dueToday = (upcoming ?? []).filter(
    (a) => a.scheduled_at && isBefore(new Date(a.scheduled_at), todayEnd)
  );
  const upcomingThisWeek = (upcoming ?? []).filter(
    (a) =>
      a.scheduled_at &&
      isAfter(new Date(a.scheduled_at), todayEnd) &&
      isBefore(new Date(a.scheduled_at), weekEnd)
  );
  const later = (upcoming ?? []).filter(
    (a) => a.scheduled_at && isAfter(new Date(a.scheduled_at), weekEnd)
  );

  const overdueItems = overdue ?? [];
  const totalCount = overdueItems.length + dueToday.length + upcomingThisWeek.length + later.length;
  const completionRate = totalCount > 0 ? Math.round(((totalCount - overdueItems.length) / totalCount) * 100) : 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Follow-ups"
        description="Manage your follow-up schedule and automation rules"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/20">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{totalCount}</p>
              <p className="text-xs text-muted-foreground">Total Follow-ups</p>
            </div>
          </CardContent>
        </Card>
        <Card className={overdueItems.length > 5 ? 'border-red-500/30' : ''}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
              <AlertTriangle className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <p className={`text-xl font-bold ${overdueItems.length > 5 ? 'text-red-400' : 'text-foreground'}`}>
                {overdueItems.length}
              </p>
              <p className="text-xs text-muted-foreground">Overdue</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/20">
              <BarChart3 className="h-5 w-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-xl font-bold text-foreground">{completionRate}%</p>
              <p className="text-xs text-muted-foreground">On Track</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-[16px]" />
          ))}
        </div>
      ) : totalCount === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No follow-ups scheduled"
          description="Follow-ups will appear here when scheduled for leads, deals, or customers."
        />
      ) : (
        <div className="space-y-6">
          {/* Overdue Section */}
          {overdueItems.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <h3 className="text-sm font-semibold text-red-400">
                  Overdue ({overdueItems.length})
                </h3>
              </div>
              <div className="space-y-2">
                {overdueItems.map((item) => (
                  <FollowUpCard key={item.id} activity={item} variant="overdue" />
                ))}
              </div>
            </div>
          )}

          {/* Due Today */}
          {dueToday.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                <h3 className="text-sm font-semibold text-amber-400">
                  Due Today ({dueToday.length})
                </h3>
              </div>
              <div className="space-y-2">
                {dueToday.map((item) => (
                  <FollowUpCard key={item.id} activity={item} variant="today" />
                ))}
              </div>
            </div>
          )}

          {/* Upcoming This Week */}
          {upcomingThisWeek.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-foreground" />
                <h3 className="text-sm font-semibold text-foreground">
                  This Week ({upcomingThisWeek.length})
                </h3>
              </div>
              <div className="space-y-2">
                {upcomingThisWeek.map((item) => (
                  <FollowUpCard key={item.id} activity={item} />
                ))}
              </div>
            </div>
          )}

          {/* Later */}
          {later.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Later ({later.length})
                </h3>
              </div>
              <div className="space-y-2">
                {later.map((item) => (
                  <FollowUpCard key={item.id} activity={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Automation Rules Section */}
      <div className="rounded-[16px] border border-border bg-card overflow-hidden">
        <button
          className="w-full flex items-center justify-between p-4 hover:bg-secondary/30 transition-colors"
          onClick={() => setRulesExpanded(!rulesExpanded)}
        >
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">Automation Rules</span>
            {rules && <Badge variant="secondary" className="text-xs">{rules.length}</Badge>}
          </div>
          {rulesExpanded ? (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          )}
        </button>

        {rulesExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ duration: 0.2 }}
            className="border-t border-border p-4 space-y-3"
          >
            {rulesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-[12px]" />
                ))}
              </div>
            ) : !rules || rules.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No automation rules configured
              </p>
            ) : (
              rules.map((rule) => <RuleCard key={rule.id} rule={rule} />)
            )}
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
