import { useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Phone, Mail, Video, Pencil, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';

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

const mockActivities = [
  { id: '1', type: 'call', subject: 'Discovery call with Nexus Technologies', description: 'Discussed their inventory management needs. They are looking for a solution to manage 3 warehouses.', relatedType: 'Lead', relatedName: 'Nexus Technologies', date: '2024-12-18T14:00:00Z', assignedTo: 'Priya Singh', completed: false },
  { id: '2', type: 'email', subject: 'Proposal sent to GlobalTech Solutions', description: 'Sent the revised proposal with updated pricing for the hardware procurement deal.', relatedType: 'Deal', relatedName: 'Bulk Hardware Procurement', date: '2024-12-18T11:30:00Z', assignedTo: 'Amit Patel', completed: true },
  { id: '3', type: 'meeting', subject: 'Quarterly review with Pinnacle Manufacturing', description: 'Annual maintenance contract renewal discussion. They want to expand coverage to 2 more locations.', relatedType: 'Customer', relatedName: 'Pinnacle Manufacturing', date: '2024-12-17T15:00:00Z', assignedTo: 'Vikram Singh', completed: true },
  { id: '4', type: 'note', subject: 'Pricing update for industrial motors', description: 'Updated pricing from supplier. New bulk rates available for orders above 50 units.', relatedType: 'Customer', relatedName: 'MetroWorks Industrial', date: '2024-12-17T10:00:00Z', assignedTo: 'Priya Singh', completed: true },
  { id: '5', type: 'follow_up', subject: 'Follow up with BrightEdge on proposal', description: 'Need to check if they reviewed the proposal and address any concerns.', relatedType: 'Lead', relatedName: 'BrightEdge Corp', date: '2024-12-19T09:00:00Z', assignedTo: 'Vikram Singh', completed: false },
  { id: '6', type: 'task', subject: 'Prepare demo environment for CoreBuild', description: 'Set up the demo account with sample data for their use case.', relatedType: 'Lead', relatedName: 'CoreBuild Systems', date: '2024-12-19T16:00:00Z', assignedTo: 'Amit Patel', completed: false },
  { id: '7', type: 'call', subject: 'Support call with AutoParts Direct', description: 'Resolved their order tracking issue. They need to update their integration settings.', relatedType: 'Customer', relatedName: 'AutoParts Direct', date: '2024-12-16T13:00:00Z', assignedTo: 'Priya Singh', completed: true },
  { id: '8', type: 'email', subject: 'Invoice reminder to SmartBuild Contractors', description: 'Sent payment reminder for INV-000234 due in 5 days.', relatedType: 'Customer', relatedName: 'SmartBuild Contractors', date: '2024-12-16T09:00:00Z', assignedTo: 'Amit Patel', completed: true },
];

export default function ActivitiesPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = mockActivities.filter((a) => {
    if (typeFilter === 'all') return true;
    return a.type === typeFilter;
  });

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

      {/* Activity Timeline */}
      <div className="space-y-4">
        {filtered.map((activity) => {
          const Icon = activityIcons[activity.type] || Clock;
          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card className="hover:border-primary/20 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full ${activityColors[activity.type]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="text-sm font-medium text-foreground">{activity.subject}</h4>
                          <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{activity.description}</p>
                        </div>
                        <Badge variant={activity.completed ? 'default' : 'warning'} className="text-xs flex-shrink-0 ml-2">
                          {activity.completed ? 'Done' : 'Pending'}
                        </Badge>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                        <span>{activity.relatedType}: <span className="text-foreground">{activity.relatedName}</span></span>
                        <span>{format(new Date(activity.date), 'MMM d, yyyy HH:mm')}</span>
                        <span>{activity.assignedTo}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Log Activity Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Activity</DialogTitle>
            <DialogDescription>Record an interaction or task.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Activity Type</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
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
              <Label>Subject</Label>
              <Input placeholder="Activity subject" />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Input placeholder="Activity details" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Related To</Label>
                <Input placeholder="Customer or Lead name" />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="datetime-local" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => setDialogOpen(false)}>Log Activity</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
