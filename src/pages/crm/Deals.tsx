import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, DollarSign, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';

interface Deal {
  id: string;
  title: string;
  company: string;
  value: number;
  probability: number;
  stage: string;
  expectedClose: string;
  assignedTo: string;
}

const mockDeals: Deal[] = [
  { id: '1', title: 'Enterprise License Agreement', company: 'TechVentures Inc.', value: 245000, probability: 75, stage: 'negotiation', expectedClose: '2024-12-28', assignedTo: 'Priya Singh' },
  { id: '2', title: 'Bulk Hardware Procurement', company: 'GlobalTech Solutions', value: 182000, probability: 60, stage: 'proposal', expectedClose: '2025-01-15', assignedTo: 'Amit Patel' },
  { id: '3', title: 'Annual Maintenance Contract', company: 'Pinnacle Manufacturing', value: 96000, probability: 90, stage: 'negotiation', expectedClose: '2024-12-22', assignedTo: 'Vikram Singh' },
  { id: '4', title: 'Office Equipment Supply', company: 'SmartBuild Contractors', value: 54000, probability: 40, stage: 'needs_analysis', expectedClose: '2025-01-30', assignedTo: 'Priya Singh' },
  { id: '5', title: 'IoT Sensor Package', company: 'CoreBuild Systems', value: 320000, probability: 30, stage: 'qualification', expectedClose: '2025-02-15', assignedTo: 'Amit Patel' },
  { id: '6', title: 'Warehouse Automation Kit', company: 'MetroWorks Industrial', value: 178000, probability: 55, stage: 'proposal', expectedClose: '2025-01-08', assignedTo: 'Vikram Singh' },
  { id: '7', title: 'Safety Equipment Bundle', company: 'AutoParts Direct', value: 42000, probability: 85, stage: 'closed_won', expectedClose: '2024-12-10', assignedTo: 'Priya Singh' },
  { id: '8', title: 'Retail Display Systems', company: 'QuickServe Retail', value: 28000, probability: 20, stage: 'qualification', expectedClose: '2025-03-01', assignedTo: 'Amit Patel' },
  { id: '9', title: 'Industrial Motor Supply', company: 'Horizon Dynamics', value: 156000, probability: 45, stage: 'needs_analysis', expectedClose: '2025-01-20', assignedTo: 'Vikram Singh' },
  { id: '10', title: 'Copper Wiring Project', company: 'UrbanFlow Industries', value: 88000, probability: 0, stage: 'closed_lost', expectedClose: '2024-12-05', assignedTo: 'Priya Singh' },
];

const stageOrder = ['qualification', 'needs_analysis', 'proposal', 'negotiation', 'closed_won', 'closed_lost'];

const stageLabels: Record<string, string> = {
  qualification: 'Qualification',
  needs_analysis: 'Needs Analysis',
  proposal: 'Proposal',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
};

const stageColors: Record<string, string> = {
  qualification: 'border-l-slate-400',
  needs_analysis: 'border-l-blue-400',
  proposal: 'border-l-amber-400',
  negotiation: 'border-l-orange-400',
  closed_won: 'border-l-emerald-400',
  closed_lost: 'border-l-red-400',
};

export default function DealsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const stageValues = stageOrder.map((stage) => {
    const deals = mockDeals.filter((d) => d.stage === stage);
    return {
      stage,
      label: stageLabels[stage],
      deals,
      totalValue: deals.reduce((sum, d) => sum + d.value, 0),
    };
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Deals Pipeline"
        description="Track opportunities through your sales process"
        actions={
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Deal
          </Button>
        }
      />

      {/* Stage Summary */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {stageValues.map((sv) => (
          <Card key={sv.stage} className="text-center">
            <CardContent className="p-3">
              <p className="text-lg font-bold text-foreground">{sv.deals.length}</p>
              <p className="text-xs text-muted-foreground">{sv.label}</p>
              <p className="text-xs text-primary font-medium">${(sv.totalValue / 1000).toFixed(0)}K</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Kanban */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {stageValues.map(({ stage, label, deals }) => (
          <div key={stage} className="flex-shrink-0 w-[300px]">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">{label}</h3>
              <Badge variant="secondary" className="text-xs">{deals.length}</Badge>
            </div>
            <div className="space-y-3">
              {deals.map((deal) => (
                <Card key={deal.id} className={`border-l-4 ${stageColors[stage]} hover:border-primary/30 transition-colors cursor-pointer`}>
                  <CardContent className="p-4 space-y-3">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">{deal.title}</h4>
                      <p className="text-xs text-muted-foreground">{deal.company}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <DollarSign className="h-3.5 w-3.5 text-primary" />
                        <span className="text-sm font-semibold text-foreground">${deal.value.toLocaleString()}</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">{deal.probability}%</Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {format(new Date(deal.expectedClose), 'MMM d, yyyy')}
                      </div>
                      <div className="flex items-center gap-1">
                        <User className="h-3 w-3" />
                        {deal.assignedTo.split(' ')[0]}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Add Deal Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Deal</DialogTitle>
            <DialogDescription>Create a new deal opportunity in your pipeline.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Deal Title</Label>
              <Input placeholder="e.g., Enterprise License Agreement" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company</Label>
                <Input placeholder="Company name" />
              </div>
              <div className="space-y-2">
                <Label>Value ($)</Label>
                <Input type="number" placeholder="100000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Stage</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger>
                  <SelectContent>
                    {stageOrder.map((s) => (
                      <SelectItem key={s} value={s}>{stageLabels[s]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Probability (%)</Label>
                <Input type="number" placeholder="50" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Expected Close Date</Label>
              <Input type="date" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setDialogOpen(false)}>Create Deal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
