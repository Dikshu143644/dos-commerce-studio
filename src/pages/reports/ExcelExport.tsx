import { Download } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ExcelExport() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Excel Export"
        description="Export data reports to Excel format"
        actions={
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export All
          </Button>
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {['Products', 'Customers', 'Orders', 'Inventory', 'Suppliers', 'Financials'].map(
          (report) => (
            <Card key={report}>
              <CardHeader>
                <CardTitle className="text-base">{report}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Export {report.toLowerCase()} data to .xlsx format
                </p>
                <Button variant="outline" size="sm">
                  <Download className="h-3.5 w-3.5 mr-2" />
                  Download
                </Button>
              </CardContent>
            </Card>
          )
        )}
      </div>
    </div>
  );
}
