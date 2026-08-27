import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  LayoutGrid,
  List,
  DollarSign,
  Calendar,
  User,
  TrendingUp,
  CheckCircle2,
  XCircle,
  ShoppingCart,
  Filter,
} from 'lucide-react';
import { format } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
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
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { useDeals, useCreateDeal, useUpdateDealStage } from '@/hooks/useDeals';
import { useDealsByStage, usePipelineValue, useCloseDeal, useConvertDealToOrder } from '@/hooks/useDealPipeline';
import { useAuth } from '@/hooks/useAuth';
import type { Deal, DealStage } from '@/types/database';

const stageOrder: DealStage[] = ['qualification', 'needs_analysis', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

const stageLabels: Record<DealStage, string> = {
  qualification: 'Qualification',
  needs_analysis: 'Needs Analysis',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

const stageColors: Record<DealStage, string> = {
  qualification: 'border-l-slate-400',
  needs_analysis: 'border-l-blue-400',
  proposal: 'border-l-amber-400',
  negotiation: 'border-l-orange-400',
  closed_won: 'border-l-emerald-400',
  closed_lost: 'border-l-red-400',
};

const dealSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  customer_id: z.string().optional(),
  value: z.coerce.number().min(1, 'Value must be greater than 0'),
  probability: z.coerce.number().min(0).max(100).optional(),
  stage: z.enum(['qualification', 'needs_analysis', 'proposal', 'negotiation', 'closed_won', 'closed_lost'] as const),
  expected_close_date: z.string().optional(),
  assigned_to: z.string().optional(),
  notes: z.string().optional(),
});

type DealFormData = z.infer<typeof dealSchema>;

function DealDetailPanel({ deal, onClose }: { deal: Deal; onClose: () => void }) {
  const { user } = useAuth();
  const closeDeal = useCloseDeal();
  const convertToOrder = useConvertDealToOrder();

  const weightedValue = deal.value * (deal.probability / 100);
  const isWon = deal.stage === 'closed_won';
  const isLost = deal.stage === 'closed_lost';
  const isOpen = !isWon && !isLost;

  const handleCloseWon = () => {
    closeDeal.mutate(
      { deal_id: deal.id, outcome: 'won', performed_by: user?.id ?? 'unknown' },
      {
        onSuccess: () => {
          toast.success('Deal closed as Won!');
          onClose();
        },
        onError: (error) => toast.error(`Failed to close deal: ${error.message}`),
      }
    );
  };

  const handleCloseLost = () => {
    closeDeal.mutate(
      { deal_id: deal.id, outcome: 'lost', performed_by: user?.id ?? 'unknown' },
      {
        onSuccess: () => {
          toast.info('Deal marked as Lost');
          onClose();
        },
        onError: (error) => toast.error(`Failed to close deal: ${error.message}`),
      }
    );
  };

  const handleCreateOrder = () => {
    convertToOrder.mutate(
      { dealId: deal.id, performedBy: user?.id ?? 'unknown' },
      {
        onSuccess: () => {
          toast.success('Sales order created from deal');
          onClose();
        },
        onError: (error) => toast.error(`Failed to create order: ${error.message}`),
      }
    );
  };

  const stageIndex = stageOrder.indexOf(deal.stage);

  return (
    <div className="space-y-6 p-6 overflow-y-auto h-full">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{deal.title}</h3>
        <Badge variant="secondary">{stageLabels[deal.stage]}</Badge>
      </div>

      {/* Stage Progression */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Stage Progression</h4>
        <div className="flex items-center gap-1">
          {stageOrder.slice(0, 4).map((stage, idx) => (
            <div key={stage} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`h-2 w-full rounded-full ${
                  idx <= stageIndex && stageIndex < 4
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                    : 'bg-secondary'
                }`}
              />
              <span className="text-[10px] text-muted-foreground">{stageLabels[stage].split(' ')[0]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Value Details */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Value</h4>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-[12px] bg-card border border-border p-3 text-center">
            <p className="text-lg font-bold text-foreground">${deal.value.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Total Value</p>
          </div>
          <div className="rounded-[12px] bg-card border border-border p-3 text-center">
            <p className="text-lg font-bold text-foreground">{deal.probability}%</p>
            <p className="text-[10px] text-muted-foreground">Probability</p>
          </div>
          <div className="rounded-[12px] bg-card border border-border p-3 text-center">
            <p className="text-lg font-bold text-primary">${weightedValue.toLocaleString()}</p>
            <p className="text-[10px] text-muted-foreground">Weighted</p>
          </div>
        </div>
      </div>

      {/* Deal Info */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Details</h4>
        <div className="space-y-1 text-sm text-muted-foreground">
          {deal.expected_close_date && (
            <p>Expected Close: {format(new Date(deal.expected_close_date), 'MMM d, yyyy')}</p>
          )}
          {deal.assigned_to && <p>Assigned to: {deal.assigned_to}</p>}
          {deal.converted_from_lead_id && <p>Converted from Lead: {deal.converted_from_lead_id}</p>}
          {deal.customer_id && <p>Customer: {deal.customer_id}</p>}
        </div>
      </div>

      {deal.notes && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Notes</h4>
          <p className="text-sm text-muted-foreground">{deal.notes}</p>
        </div>
      )}

      {/* Actions */}
      {isOpen && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Actions</h4>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleCloseWon} disabled={closeDeal.isPending}>
              <CheckCircle2 className="mr-2 h-3 w-3" /> Close Won
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleCloseLost}
              disabled={closeDeal.isPending}
              className="text-red-400 hover:text-red-300"
            >
              <XCircle className="mr-2 h-3 w-3" /> Close Lost
            </Button>
          </div>
        </div>
      )}

      {isWon && !deal.sales_order_id && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Create Order</h4>
          <Button size="sm" onClick={handleCreateOrder} disabled={convertToOrder.isPending}>
            <ShoppingCart className="mr-2 h-3 w-3" />
            {convertToOrder.isPending ? 'Creating...' : 'Create Sales Order'}
          </Button>
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>Created: {format(new Date(deal.created_at), 'MMM d, yyyy HH:mm')}</p>
        <p>Updated: {format(new Date(deal.updated_at), 'MMM d, yyyy HH:mm')}</p>
        {deal.won_at && <p>Won: {format(new Date(deal.won_at), 'MMM d, yyyy')}</p>}
        {deal.lost_at && <p>Lost: {format(new Date(deal.lost_at), 'MMM d, yyyy')}</p>}
      </div>
    </div>
  );
}

export default function DealsPage() {
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [draggedDealId, setDraggedDealId] = useState<string | null>(null);

  const { data: dealsData, isLoading: dealsLoading } = useDeals({ pageSize: 100 });
  const { data: dealsByStage, isLoading: stagesLoading } = useDealsByStage();
  const { data: pipelineValue } = usePipelineValue();
  const createDeal = useCreateDeal();
  const updateStage = useUpdateDealStage();

  const isLoading = dealsLoading || stagesLoading;

  const form = useForm<DealFormData>({
    resolver: zodResolver(dealSchema),
    defaultValues: { title: '', value: 0, probability: 50, stage: 'qualification', notes: '' },
  });

  const handleCreateDeal = (data: DealFormData) => {
    createDeal.mutate(
      {
        title: data.title,
        customer_id: data.customer_id || null,
        lead_id: null,
        stage: data.stage,
        value: data.value,
        probability: data.probability ?? 50,
        expected_close_date: data.expected_close_date || null,
        assigned_to: data.assigned_to || null,
        notes: data.notes || null,
        converted_from_lead_id: null,
        sales_order_id: null,
      },
      {
        onSuccess: () => {
          toast.success('Deal created successfully');
          setDialogOpen(false);
          form.reset();
        },
        onError: (error) => toast.error(`Failed to create deal: ${error.message}`),
      }
    );
  };

  const handleDragStart = (dealId: string) => {
    setDraggedDealId(dealId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetStage: DealStage) => {
    if (!draggedDealId) return;
    updateStage.mutate(
      { id: draggedDealId, stage: targetStage },
      {
        onSuccess: () => toast.success(`Deal moved to ${stageLabels[targetStage]}`),
        onError: (error) => toast.error(`Failed to move deal: ${error.message}`),
      }
    );
    setDraggedDealId(null);
  };

  const filteredDeals = dealsData?.data?.filter((deal) => {
    if (stageFilter !== 'all' && deal.stage !== stageFilter) return false;
    return true;
  }) ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="CRM Deals Pipeline"
        description="Track enterprise revenue opportunities, stage probabilities, and active contract negotiations"
        bannerImage="/images/backgrounds/ocean-sunset.jpg"
        actions={
          <div className="flex items-center gap-2">
            <div className="flex rounded-[12px] border border-border overflow-hidden">
              <button
                onClick={() => setView('kanban')}
                className={`px-3 py-1.5 text-sm ${view === 'kanban' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setView('table')}
                className={`px-3 py-1.5 text-sm ${view === 'table' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:bg-secondary'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
            <Button onClick={() => setDialogOpen(true)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium">
              <Plus className="mr-2 h-4 w-4" /> Add Deal
            </Button>
          </div>
        }
      />

      {/* Pipeline Value Summary */}
      {pipelineValue && (
        <div className="rounded-[16px] border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Pipeline Summary</span>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-foreground">
                ₹{pipelineValue.total_value.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-muted-foreground">
                Weighted: ₹{pipelineValue.weighted_value.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
          <div className="flex gap-1 h-3 rounded-full overflow-hidden">
            {pipelineValue.by_stage
              .filter((s) => s.total_value > 0 && s.stage !== 'closed_lost')
              .map((stage) => (
                <div
                  key={stage.stage}
                  className="bg-gradient-to-r from-purple-500 to-indigo-500 opacity-80 hover:opacity-100 transition-opacity relative group"
                  style={{
                    width: `${(stage.total_value / pipelineValue.total_value) * 100}%`,
                  }}
                  title={`${stageLabels[stage.stage]}: ₹${stage.total_value.toLocaleString('en-IN')}`}
                />
              ))}
          </div>
          <div className="flex flex-wrap gap-3 mt-2">
            {pipelineValue.by_stage
              .filter((s) => s.count > 0)
              .map((stage) => (
                <span key={stage.stage} className="text-[10px] text-muted-foreground">
                  {stageLabels[stage.stage]}: {stage.count} (₹{(stage.total_value / 100000).toFixed(1)}L)
                </span>
              ))}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
        </div>
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Stage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {stageOrder.map((s) => (
              <SelectItem key={s} value={s}>{stageLabels[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[300px] space-y-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-36 w-full rounded-[16px]" />
              <Skeleton className="h-36 w-full rounded-[16px]" />
            </div>
          ))}
        </div>
      ) : view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stageOrder.map((stage) => {
            const deals = dealsByStage?.[stage] ?? [];
            return (
              <div
                key={stage}
                className="flex-shrink-0 w-[300px]"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(stage)}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground">
                    {stageLabels[stage]}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {deals.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {deals.length === 0 ? (
                    <div className="rounded-[16px] border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      No deals
                    </div>
                  ) : (
                    deals.map((deal) => (
                      <motion.div
                        key={deal.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        draggable
                        onDragStart={() => handleDragStart(deal.id)}
                      >
                        <Card
                          className={`border-l-4 ${stageColors[stage]} hover:border-primary/30 transition-colors cursor-pointer`}
                          onClick={() => setSelectedDeal(deal)}
                        >
                          <CardContent className="p-4 space-y-3">
                            <div>
                              <h4 className="text-sm font-medium text-foreground">{deal.title}</h4>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-semibold text-purple-700">
                                  ₹{deal.value.toLocaleString('en-IN')}
                                </span>
                              </div>
                              <Badge variant="secondary" className="text-xs">
                                {deal.probability}%
                              </Badge>
                            </div>
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                              {deal.expected_close_date && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {format(new Date(deal.expected_close_date), 'MMM d')}
                                </div>
                              )}
                              {deal.assigned_to && (
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3" />
                                  {deal.assigned_to.split(' ')[0]}
                                </div>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[16px] border border-border overflow-hidden">
          {filteredDeals.length === 0 ? (
            <EmptyState
              icon={DollarSign}
              title="No deals found"
              description="Create your first deal or adjust your filters."
              actionLabel="Add Deal"
              onAction={() => setDialogOpen(true)}
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Title</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Value (INR)</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Probability</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Stage</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Close Date</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Assigned</th>
                </tr>
              </thead>
              <tbody>
                {filteredDeals.map((deal) => (
                  <tr
                    key={deal.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 cursor-pointer"
                    onClick={() => setSelectedDeal(deal)}
                  >
                    <td className="px-4 py-3 text-foreground font-medium">{deal.title}</td>
                    <td className="px-4 py-3 text-purple-700 font-bold">₹{deal.value.toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-foreground">{deal.probability}%</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="capitalize">
                        {stageLabels[deal.stage]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {deal.expected_close_date
                        ? format(new Date(deal.expected_close_date), 'MMM d, yyyy')
                        : '-'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{deal.assigned_to || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Deal Detail Sheet */}
      <Sheet open={!!selectedDeal} onOpenChange={() => setSelectedDeal(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Deal Details</SheetTitle>
            <SheetDescription>View and manage deal information</SheetDescription>
          </SheetHeader>
          {selectedDeal && (
            <DealDetailPanel deal={selectedDeal} onClose={() => setSelectedDeal(null)} />
          )}
        </SheetContent>
      </Sheet>

      {/* Add Deal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Deal</DialogTitle>
            <DialogDescription>Create a new deal opportunity in your pipeline.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreateDeal)} className="space-y-4">
            <div className="space-y-2">
              <Label>Deal Title *</Label>
              <Input placeholder="e.g., Enterprise License Agreement" {...form.register('title')} />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Value ($) *</Label>
                <Input type="number" placeholder="100000" {...form.register('value')} />
                {form.formState.errors.value && (
                  <p className="text-xs text-destructive">{form.formState.errors.value.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Probability (%)</Label>
                <Input type="number" placeholder="50" {...form.register('probability')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stage</Label>
                <Select
                  defaultValue="qualification"
                  onValueChange={(v) => form.setValue('stage', v as DealStage)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select stage" />
                  </SelectTrigger>
                  <SelectContent>
                    {stageOrder.map((s) => (
                      <SelectItem key={s} value={s}>{stageLabels[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expected Close</Label>
                <Input type="date" {...form.register('expected_close_date')} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input placeholder="Additional notes..." {...form.register('notes')} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={createDeal.isPending}>
                {createDeal.isPending ? 'Creating...' : 'Create Deal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
