import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  Phone,
  Mail,
  Video,
  Pencil,
  Clock,
  Calendar,
  CheckCircle2,
  Filter,
  AlertCircle,
} from 'lucide-react';
import { format, isPast } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import {
  useActivityFeed,
  useCreateActivity as useCreateActivityFeed,
  useCompleteActivity as useCompleteActivityFeed,
  useTodayActivities,
} from '@/hooks/useActivityFeed';
import { useAuth } from '@/hooks/useAuth';
import type { ActivityType } from '@/types/database';

const activityIcons: Record<string, typeof Phone> = {
  call: Phone,
  email: Mail,
  meeting: Video,
  note: Pencil,
  task: Clock,
  follow_up: Calendar,
};

const activityColors: Record<string, string> = {
  call: 'bg-blue-500/20 text-blue-400',
  email: 'bg-purple-500/20 text-purple-400',
  meeting: 'bg-emerald-500/20 text-emerald-400',
  note: 'bg-amber-500/20 text-amber-400',
  task: 'bg-cyan-500/20 text-cyan-400',
  follow_up: 'bg-orange-500/20 text-orange-400',
};

const activitySchema = z.object({
  activity_type: z.enum(['call', 'email', 'meeting', 'note', 'task', 'follow_up'] as const),
  title: z.string().min(2, 'Title is required'),
  description: z.string().optional(),
  scheduled_at: z.string().optional(),
  performed_by: z.string().optional(),
});

type ActivityFormData = z.infer<typeof activitySchema>;

export default function ActivitiesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);

  const { user } = useAuth();
  const { data: todayTasks, isLoading: todayLoading } = useTodayActivities();
  const { data: feedData, isLoading: feedLoading } = useActivityFeed(undefined, undefined, page, 20);
  const createActivity = useCreateActivityFeed();
  const completeActivity = useCompleteActivityFeed();

  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: { activity_type: 'call', title: '', description: '' },
  });

  const isLoading = todayLoading || feedLoading;

  const handleCreateActivity = (data: ActivityFormData) => {
    createActivity.mutate(
      {
        activity_type: data.activity_type,
        title: data.title,
        description: data.description || undefined,
        scheduled_at: data.scheduled_at || undefined,
        performed_by: data.performed_by || user?.id || 'unknown',
      },
      {
        onSuccess: () => {
          toast.success('Activity created successfully');
          setDialogOpen(false);
          form.reset();
        },
        onError: (error) => toast.error(`Failed to create activity: ${error.message}`),
      }
    );
  };

  const handleCompleteActivity = (activityId: string) => {
    completeActivity.mutate(
      { activity_id: activityId, performed_by: user?.id || 'unknown' },
      {
        onSuccess: () => {
          toast.success('Activity completed', {
            action: {
              label: 'Schedule follow-up?',
              onClick: () => {
                form.setValue('activity_type', 'follow_up');
                form.setValue('title', 'Follow-up');
                setDialogOpen(true);
              },
            },
          });
        },
        onError: (error) => toast.error(`Failed to complete activity: ${error.message}`),
      }
    );
  };

  const feedActivities = feedData?.data ?? [];
  const filteredFeed = typeFilter === 'all'
    ? feedActivities
    : feedActivities.filter((a) => a.activity_type === typeFilter);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Activities"
        description="Track all interactions and tasks related to customers and leads"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Log Activity
          </Button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="call">Calls</SelectItem>
            <SelectItem value="email">Emails</SelectItem>
            <SelectItem value="meeting">Meetings</SelectItem>
            <SelectItem value="note">Notes</SelectItem>
            <SelectItem value="task">Tasks</SelectItem>
            <SelectItem value="follow_up">Follow-ups</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-[16px]" />
            ))}
          </div>
          <div className="lg:col-span-2 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-[16px]" />
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Tasks - Left Panel */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Today&apos;s Tasks</h3>
              <Badge variant="secondary">{todayTasks?.length ?? 0}</Badge>
            </div>
            {!todayTasks || todayTasks.length === 0 ? (
              <div className="rounded-[16px] border border-dashed border-border p-6 text-center">
                <CheckCircle2 className="h-8 w-8 text-primary/50 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No tasks for today</p>
              </div>
            ) : (
              <div className="space-y-2">
                {todayTasks.map((task) => {
                  const Icon = activityIcons[task.activity_type] || Clock;
                  const isOverdue = task.scheduled_at && isPast(new Date(task.scheduled_at)) && !task.completed_at;
                  return (
                    <motion.div
                      key={task.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <Card className={`${isOverdue ? 'border-red-500/30' : ''}`}>
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={!!task.completed_at}
                              onCheckedChange={() => handleCompleteActivity(task.id)}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className={`flex h-5 w-5 items-center justify-center rounded-full ${activityColors[task.activity_type]}`}>
                                  <Icon className="h-3 w-3" />
                                </div>
                                <p className={`text-xs font-medium truncate ${isOverdue ? 'text-red-400' : 'text-foreground'}`}>
                                  {task.title}
                                </p>
                              </div>
                              {task.scheduled_at && (
                                <p className={`text-[10px] mt-1 ${isOverdue ? 'text-red-400' : 'text-muted-foreground'}`}>
                                  {isOverdue && <AlertCircle className="inline h-3 w-3 mr-1" />}
                                  {format(new Date(task.scheduled_at), 'HH:mm')}
                                </p>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Activity Feed - Right Panel */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">Activity Feed</h3>
              <span className="text-xs text-muted-foreground">{feedData?.count ?? 0} total</span>
            </div>

            {filteredFeed.length === 0 ? (
              <EmptyState
                icon={Clock}
                title="No activities yet"
                description="Create your first activity to start tracking interactions."
                actionLabel="Log Activity"
                onAction={() => setDialogOpen(true)}
              />
            ) : (
              <div className="space-y-3 relative">
                {/* Timeline line */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

                {filteredFeed.map((activity) => {
                  const Icon = activityIcons[activity.activity_type] || Clock;
                  return (
                    <motion.div
                      key={activity.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="relative pl-12"
                    >
                      {/* Timeline dot */}
                      <div className={`absolute left-3 top-3 flex h-5 w-5 items-center justify-center rounded-full ${activityColors[activity.activity_type]} ring-2 ring-background`}>
                        <Icon className="h-3 w-3" />
                      </div>

                      <Card className="hover:border-primary/20 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm font-medium text-foreground">{activity.title}</h4>
                              {activity.description && (
                                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                                  {activity.description}
                                </p>
                              )}
                              <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
                                <span>{format(new Date(activity.created_at), 'MMM d, HH:mm')}</span>
                                <span>{activity.performed_by}</span>
                              </div>
                            </div>
                            <Badge
                              variant={activity.completed_at ? 'default' : 'warning'}
                              className="text-xs flex-shrink-0 ml-2"
                            >
                              {activity.completed_at ? 'Done' : 'Pending'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}

                {/* Load More */}
                {feedData && feedData.page < feedData.totalPages && (
                  <div className="pl-12 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      className="w-full"
                    >
                      Load More
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <motion.div
        className="fixed bottom-6 right-6 z-50 lg:hidden"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        <Button
          size="lg"
          className="h-14 w-14 rounded-full shadow-lg"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="h-6 w-6" />
        </Button>
      </motion.div>

      {/* Log Activity Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Activity</DialogTitle>
            <DialogDescription>Record an interaction or task.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreateActivity)} className="space-y-4">
            <div className="space-y-2">
              <Label>Activity Type *</Label>
              <Select
                defaultValue="call"
                onValueChange={(v) => form.setValue('activity_type', v as ActivityType)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="call">Call</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="meeting">Meeting</SelectItem>
                  <SelectItem value="note">Note</SelectItem>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Title *</Label>
              <Input placeholder="Activity subject" {...form.register('title')} />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="Activity details" {...form.register('description')} />
            </div>
            <div className="space-y-2">
              <Label>Scheduled At</Label>
              <Input type="datetime-local" {...form.register('scheduled_at')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createActivity.isPending}>
                {createActivity.isPending ? 'Creating...' : 'Log Activity'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
