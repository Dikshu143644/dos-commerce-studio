import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function PurchaseOrders() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Purchase Orders"
        description="Create and track purchase orders from suppliers"
        actions={
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New PO
          </Button>
        }
      />
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <Skeleton className="h-10 w-full max-w-sm" />
            <Skeleton className="h-64 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
