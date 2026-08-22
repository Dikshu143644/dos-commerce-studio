import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, LayoutGrid, List, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';

interface Lead {
  id: string;
  company: string;
  contact: string;
  email: string;
  expectedValue: number;
  source: string;
  status: string;
  assignedTo: string;
  nextFollowUp: string;
  priority: number;
}

const mockLeads: Lead[] = [
  { id: '1', company: 'Nexus Technologies', contact: 'Arjun Reddy', email: 'arjun@nexustech.io', expectedValue: 85000, source: 'website', status: 'new', assignedTo: 'Priya Singh', nextFollowUp: '2024-12-20', priority: 1 },
  { id: '2', company: 'Horizon Dynamics', contact: 'Lisa Park', email: 'lisa@horizondyn.com', expectedValue: 42000, source: 'referral', status: 'contacted', assignedTo: 'Amit Patel', nextFollowUp: '2024-12-19', priority: 2 },
  { id: '3', company: 'CoreBuild Systems', contact: 'Manoj Tiwari', email: 'manoj@corebuild.in', expectedValue: 120000, source: 'trade_show', status: 'qualified', assignedTo: 'Priya Singh', nextFollowUp: '2024-12-22', priority: 1 },
  { id: '4', company: 'BrightEdge Corp', contact: 'Kavita Sharma', email: 'kavita@brightedge.co', expectedValue: 68000, source: 'cold_call', status: 'proposal', assignedTo: 'Vikram Singh', nextFollowUp: '2024-12-18', priority: 2 },
  { id: '5', company: 'UrbanFlow Industries', contact: 'Raj Malhotra', email: 'raj@urbanflow.in', expectedValue: 195000, source: 'referral', status: 'negotiation', assignedTo: 'Amit Patel', nextFollowUp: '2024-12-21', priority: 1 },
  { id: '6', company: 'SilverLine Exports', contact: 'Deepa Iyer', email: 'deepa@silverline.co', expectedValue: 55000, source: 'social_media', status: 'new', assignedTo: 'Priya Singh', nextFollowUp: '2024-12-23', priority: 3 },
  { id: '7', company: 'AquaPure Systems', contact: 'Nilesh Jain', email: 'nilesh@aquapure.in', expectedValue: 78000, source: 'website', status: 'contacted', assignedTo: 'Vikram Singh', nextFollowUp: '2024-12-24', priority: 2 },
  { id: '8', company: 'GreenTech Solutions', contact: 'Pooja Bansal', email: 'pooja@greentech.io', expectedValue: 34000, source: 'advertisement', status: 'won', assignedTo: 'Amit Patel', nextFollowUp: '2024-12-15', priority: 3 },
  { id: '9', company: 'MaxDrive Auto', contact: 'Karan Rao', email: 'karan@maxdrive.in', expectedValue: 92000, source: 'cold_call', status: 'lost', assignedTo: 'Priya Singh', nextFollowUp: '2024-12-10', priority: 2 },
  { id: '10', company: 'Velocity Logistics', contact: 'Sneha Kulkarni', email: 'sneha@velocity.co', expectedValue: 145000, source: 'referral', status: 'qualified', assignedTo: 'Vikram Singh', nextFollowUp: '2024-12-25', priority: 1 },
];

const statusColumns = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

const statusColors: Record<string, string> = {
  new: 'border-l-blue-400',
  contacted: 'border-l-cyan-400',
  qualified: 'border-l-emerald-400',
  proposal: 'border-l-amber-400',
  negotiation: 'border-l-orange-400',
  won: 'border-l-green-400',
  lost: 'border-l-red-400',
};

const sourceColors: Record<string, string> = {
  website: 'bg-blue-500/20 text-blue-400',
  referral: 'bg-emerald-500/20 text-emerald-400',
  cold_call: 'bg-amber-500/20 text-amber-400',
  trade_show: 'bg-purple-500/20 text-purple-400',
  social_media: 'bg-pink-500/20 text-pink-400',
  advertisement: 'bg-cyan-500/20 text-cyan-400',
};

export default function LeadsPage() {
  const [view, setView] = useState<'kanban' | 'table'>('kanban');
  const [dialogOpen, setDialogOpen] = useState(false);

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

      {view === 'kanban' ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {statusColumns.map((status) => {
            const leads = mockLeads.filter((l) => l.status === status);
            return (
              <div key={status} className="flex-shrink-0 w-[280px]">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-foreground capitalize">{status.replace('_', ' ')}</h3>
                  <Badge variant="secondary" className="text-xs">{leads.length}</Badge>
                </div>
                <div className="space-y-3">
                  {leads.map((lead) => (
                    <Card key={lead.id} className={`border-l-4 ${statusColors[status]} hover:border-primary/30 transition-colors cursor-pointer`}>
                      <CardContent className="p-4 space-y-2">
                        <div className="flex items-start justify-between">
                          <h4 className="text-sm font-medium text-foreground">{lead.company}</h4>
                          <Badge className={`text-[10px] border-0 ${sourceColors[lead.source] || ''}`}>
                            {lead.source.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{lead.contact}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <DollarSign className="h-3 w-3" />
                          <span className="text-foreground font-medium">${lead.expectedValue.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(lead.nextFollowUp), 'MMM d')}
                          </div>
                          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] text-primary font-medium">
                            {lead.assignedTo.split(' ').map(n => n[0]).join('')}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[16px] border border-border overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Company</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Contact</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Value</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Source</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Follow-up</th>
              </tr>
            </thead>
            <tbody>
              {mockLeads.map((lead) => (
                <tr key={lead.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3 text-foreground font-medium">{lead.company}</td>
                  <td className="px-4 py-3 text-foreground">{lead.contact}</td>
                  <td className="px-4 py-3 text-foreground">${lead.expectedValue.toLocaleString()}</td>
                  <td className="px-4 py-3"><Badge className={`text-xs border-0 ${sourceColors[lead.source]}`}>{lead.source.replace('_', ' ')}</Badge></td>
                  <td className="px-4 py-3"><Badge variant="secondary" className="capitalize">{lead.status}</Badge></td>
                  <td className="px-4 py-3 text-muted-foreground">{format(new Date(lead.nextFollowUp), 'MMM d, yyyy')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Lead Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Lead</DialogTitle>
            <DialogDescription>Enter lead details to add to your pipeline.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Company Name</Label>
                <Input placeholder="Company name" />
              </div>
              <div className="space-y-2">
                <Label>Contact Person</Label>
                <Input placeholder="Full name" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" placeholder="email@company.com" />
              </div>
              <div className="space-y-2">
                <Label>Expected Value ($)</Label>
                <Input type="number" placeholder="50000" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Source</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="website">Website</SelectItem>
                    <SelectItem value="referral">Referral</SelectItem>
                    <SelectItem value="cold_call">Cold Call</SelectItem>
                    <SelectItem value="trade_show">Trade Show</SelectItem>
                    <SelectItem value="social_media">Social Media</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select>
                  <SelectTrigger><SelectValue placeholder="Priority" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">High</SelectItem>
                    <SelectItem value="2">Medium</SelectItem>
                    <SelectItem value="3">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setDialogOpen(false)}>Add Lead</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
