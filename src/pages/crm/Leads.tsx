import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Plus,
  LayoutGrid,
  List,
  UserPlus,
  Filter,
  Users,
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
import { useLeads, useCreateLead, useUpdateLeadStatus } from '@/hooks/useLeads';
import { useLeadsByStage, useConvertLead, useLeadScore } from '@/hooks/useLeadPipeline';
import { useAuth } from '@/hooks/useAuth';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { Lead, LeadStatus, LeadSource } from '@/types/database';

const statusColumns: LeadStatus[] = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

const statusColors: Record<LeadStatus, string> = {
  new: 'border-l-blue-400',
  contacted: 'border-l-cyan-400',
  qualified: 'border-l-emerald-400',
  proposal: 'border-l-amber-400',
  negotiation: 'border-l-orange-400',
  won: 'border-l-green-400',
  lost: 'border-l-red-400',
};

const statusLabels: Record<LeadStatus, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  won: 'Won',
  lost: 'Lost',
};

const sourceColors: Record<string, string> = {
  website: 'bg-blue-500/20 text-blue-400',
  referral: 'bg-emerald-500/20 text-emerald-400',
  cold_call: 'bg-amber-500/20 text-amber-400',
  trade_show: 'bg-purple-500/20 text-purple-400',
  social_media: 'bg-pink-500/20 text-pink-400',
  advertisement: 'bg-cyan-500/20 text-cyan-400',
  other: 'bg-gray-500/20 text-gray-400',
};

const leadSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required').or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  source: z.enum(['website', 'referral', 'cold_call', 'trade_show', 'social_media', 'advertisement', 'other'] as const),
  estimated_value: z.coerce.number().min(0).optional(),
  assigned_to: z.string().optional(),
  notes: z.string().optional(),
});

type LeadFormData = z.infer<typeof leadSchema>;

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

function LeadDetailPanel({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const { data: scoreData } = useLeadScore(lead.id);
  const convertLead = useConvertLead();
  const updateStatus = useUpdateLeadStatus();
  const { user } = useAuth();

  const canConvert = ['qualified', 'proposal', 'negotiation', 'won'].includes(lead.status);

  const handleConvertToCustomer = () => {
    convertLead.mutate(
      { lead_id: lead.id, performed_by: user?.id ?? 'unknown' },
      {
        onSuccess: () => {
          toast.success('Lead converted to customer successfully');
          onClose();
        },
        onError: (error) => toast.error(`Failed to convert lead: ${error.message}`),
      }
    );
  };

  const handleStatusChange = (newStatus: LeadStatus) => {
    updateStatus.mutate(
      { id: lead.id, status: newStatus },
      {
        onSuccess: () => toast.success(`Lead status updated to ${statusLabels[newStatus]}`),
        onError: (error) => toast.error(`Failed to update status: ${error.message}`),
      }
    );
  };

  const breakdown = scoreData?.breakdown;

  return (
    <div className="space-y-6 p-6 overflow-y-auto h-full">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-foreground">{lead.name}</h3>
          <ScoreBadge score={lead.score} />
        </div>
        {lead.company && <p className="text-sm text-muted-foreground">{lead.company}</p>}
        <div className="flex gap-2 flex-wrap">
          <Badge className={sourceColors[lead.source] || ''}>{lead.source.replace('_', ' ')}</Badge>
          <Badge variant="secondary">{statusLabels[lead.status]}</Badge>
        </div>
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Contact Info</h4>
        <div className="space-y-1 text-sm text-muted-foreground">
          {lead.email && <p>Email: {lead.email}</p>}
          {lead.phone && <p>Phone: {lead.phone}</p>}
          {lead.estimated_value && (
            <p>Estimated Value: <span className="text-purple-700 font-bold">₹{lead.estimated_value.toLocaleString('en-IN')}</span></p>
          )}
          {lead.assigned_to && <p>Assigned to: {lead.assigned_to}</p>}
        </div>
      </div>

      {breakdown && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Score Breakdown</h4>
          <div className="space-y-2">
            {Object.entries(breakdown).map(([key, value]) => (
              <div key={key} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground capitalize">{key}</span>
                  <span className="text-foreground">{value}</span>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-500"
                    style={{ width: `${Math.min(value * 5, 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <h4 className="text-sm font-medium text-foreground">Change Status</h4>
        <div className="flex flex-wrap gap-2">
          {statusColumns.filter((s) => s !== lead.status).map((status) => (
            <Button
              key={status}
              variant="outline"
              size="sm"
              className="text-xs capitalize"
              onClick={() => handleStatusChange(status)}
            >
              {statusLabels[status]}
            </Button>
          ))}
        </div>
      </div>

      {canConvert && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Conversion</h4>
          <div className="flex gap-2">
            <Button
              size="sm"
              onClick={handleConvertToCustomer}
              disabled={convertLead.isPending}
            >
              <UserPlus className="mr-2 h-3 w-3" />
              Convert to Customer
            </Button>
          </div>
        </div>
      )}

      {lead.notes && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-foreground">Notes</h4>
          <p className="text-sm text-muted-foreground">{lead.notes}</p>
        </div>
      )}

      <div className="text-xs text-muted-foreground space-y-1">
        <p>Created: {format(new Date(lead.created_at), 'MMM d, yyyy HH:mm')}</p>
        <p>Updated: {format(new Date(lead.updated_at), 'MMM d, yyyy HH:mm')}</p>
      </div>
    </div>
  );
}

export default function LeadsPage() {
  useDocumentTitle('Leads');
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);

  const { data: leadsData, isLoading: leadsLoading } = useLeads({ pageSize: 100 });
  const { data: leadsByStage, isLoading: stagesLoading } = useLeadsByStage();
  const createLead = useCreateLead();
  const updateStatus = useUpdateLeadStatus();

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadSchema),
    defaultValues: { name: '', email: '', phone: '', company: '', source: 'website', notes: '' },
  });

  const isLoading = leadsLoading || stagesLoading;

  const handleCreateLead = (data: LeadFormData) => {
    createLead.mutate(
      {
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        company: data.company || null,
        source: data.source,
        estimated_value: data.estimated_value || null,
        assigned_to: data.assigned_to || null,
        notes: data.notes || null,
        status: 'new' as LeadStatus,
        score: null,
        last_scored_at: null,
      },
      {
        onSuccess: () => {
          toast.success('Lead created successfully');
          setDialogOpen(false);
          form.reset();
        },
        onError: (error) => toast.error(`Failed to create lead: ${error.message}`),
      }
    );
  };

  const handleDragStart = (leadId: string) => {
    setDraggedLeadId(leadId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetStatus: LeadStatus) => {
    if (!draggedLeadId) return;
    updateStatus.mutate(
      { id: draggedLeadId, status: targetStatus },
      {
        onSuccess: () => toast.success(`Lead moved to ${statusLabels[targetStatus]}`),
        onError: (error) => toast.error(`Failed to move lead: ${error.message}`),
      }
    );
    setDraggedLeadId(null);
  };

  const filteredLeads = leadsData?.data?.filter((lead) => {
    if (statusFilter !== 'all' && lead.status !== statusFilter) return false;
    if (sourceFilter !== 'all' && lead.source !== sourceFilter) return false;
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
        title="Leads Pipeline"
        description="Track and manage your leads through the sales pipeline"
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
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Lead
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Filter className="h-4 w-4" />
          <span>Filters:</span>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            {statusColumns.map((s) => (
              <SelectItem key={s} value={s}>{statusLabels[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sourceFilter} onValueChange={setSourceFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="website">Website</SelectItem>
            <SelectItem value="referral">Referral</SelectItem>
            <SelectItem value="cold_call">Cold Call</SelectItem>
            <SelectItem value="trade_show">Trade Show</SelectItem>
            <SelectItem value="social_media">Social Media</SelectItem>
            <SelectItem value="advertisement">Advertisement</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex-shrink-0 w-[280px] space-y-3">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-32 w-full rounded-[16px]" />
              <Skeleton className="h-32 w-full rounded-[16px]" />
            </div>
          ))}
        </div>
      ) : view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusColumns.map((status) => {
            const leads = leadsByStage?.[status] ?? [];
            return (
              <div
                key={status}
                className="flex-shrink-0 w-[280px]"
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(status)}
              >
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground capitalize">
                    {statusLabels[status]}
                  </h3>
                  <Badge variant="secondary" className="text-xs">
                    {leads.length}
                  </Badge>
                </div>
                <div className="space-y-3">
                  {leads.length === 0 ? (
                    <div className="rounded-[16px] border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      No leads
                    </div>
                  ) : (
                    leads.map((lead) => (
                      <motion.div
                        key={lead.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        draggable
                        onDragStart={() => handleDragStart(lead.id)}
                      >
                        <Card
                          className={`border-l-4 ${statusColors[status]} hover:border-primary/30 transition-colors cursor-pointer`}
                          onClick={() => setSelectedLead(lead)}
                        >
                          <CardContent className="p-4 space-y-2">
                            <div className="flex items-start justify-between">
                              <h4 className="text-sm font-medium text-foreground">
                                {lead.company || lead.name}
                              </h4>
                              <ScoreBadge score={lead.score} />
                            </div>
                            <p className="text-xs text-muted-foreground">{lead.name}</p>
                            {lead.estimated_value && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <span className="text-purple-700 font-bold">
                                  ₹{lead.estimated_value.toLocaleString('en-IN')}
                                </span>
                              </div>
                            )}
                            <div className="flex items-center justify-between text-xs">
                              <Badge className={`text-[10px] border-0 ${sourceColors[lead.source] || ''}`}>
                                {lead.source.replace('_', ' ')}
                              </Badge>
                              {lead.assigned_to && (
                                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary font-medium">
                                  {lead.assigned_to
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')
                                    .slice(0, 2)}
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
          {filteredLeads.length === 0 ? (
            <EmptyState
              icon={Users}
              title="No leads found"
              description="Create your first lead or adjust your filters."
              actionLabel="Add Lead"
              onAction={() => setDialogOpen(true)}
            />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/50">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Company</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Estimated Value</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Source</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Score</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">Created</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    className="border-b border-border last:border-0 hover:bg-secondary/30 cursor-pointer"
                    onClick={() => setSelectedLead(lead)}
                  >
                    <td className="px-4 py-3 text-foreground font-medium">{lead.name}</td>
                    <td className="px-4 py-3 text-foreground">{lead.company || '-'}</td>
                    <td className="px-4 py-3 text-purple-700 font-bold">
                      {lead.estimated_value ? `₹${lead.estimated_value.toLocaleString('en-IN')}` : '-'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={`text-xs border-0 ${sourceColors[lead.source]}`}>
                        {lead.source.replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <ScoreBadge score={lead.score} />
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary" className="capitalize">
                        {statusLabels[lead.status]}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {format(new Date(lead.created_at), 'MMM d, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Lead Detail Sheet */}
      <Sheet open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <SheetContent className="w-full sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Lead Details</SheetTitle>
            <SheetDescription>View and manage lead information</SheetDescription>
          </SheetHeader>
          {selectedLead && (
            <LeadDetailPanel lead={selectedLead} onClose={() => setSelectedLead(null)} />
          )}
        </SheetContent>
      </Sheet>

      {/* Add Lead Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>Enter lead details to add to your pipeline.</DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(handleCreateLead)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Name *</Label>
                <Input placeholder="Contact name" {...form.register('name')} />
                {form.formState.errors.name && (
                  <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label>Company</Label>
                <Input placeholder="Company name" {...form.register('company')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="email@company.com" {...form.register('email')} />
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input placeholder="+1 (555) 000-0000" {...form.register('phone')} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source *</Label>
                <Select
                  defaultValue="website"
                  onValueChange={(v) => form.setValue('source', v as LeadSource)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="cold_call">Cold Call</SelectItem>
                    <SelectItem value="trade_show">Trade Show</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                    <SelectItem value="advertisement">Advertisement</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Expected Value ($)</Label>
                <Input type="number" placeholder="50000" {...form.register('estimated_value')} />
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
              <Button type="submit" disabled={createLead.isPending}>
                {createLead.isPending ? 'Creating...' : 'Add Lead'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
