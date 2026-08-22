import { useState } from 'react';
import { motion } from 'motion/react';
import {
  Package, FileText, Users, BarChart3, DollarSign,
  Download, Upload, FileSpreadsheet, Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';

const exportTemplates = [
  { id: 'stock', name: 'Stock Report', description: 'Complete inventory levels across all warehouses with reorder status', icon: Package, color: 'text-emerald-400' },
  { id: 'purchase', name: 'Purchase Orders', description: 'All purchase orders with line items, suppliers, and delivery status', icon: FileText, color: 'text-blue-400' },
  { id: 'sales', name: 'Sales Summary', description: 'Revenue breakdown by product, customer, and time period', icon: BarChart3, color: 'text-purple-400' },
  { id: 'customers', name: 'Customer List', description: 'Full customer directory with contact details and account status', icon: Users, color: 'text-amber-400' },
  { id: 'valuation', name: 'Inventory Valuation', description: 'Stock value at cost and selling price for financial reporting', icon: DollarSign, color: 'text-cyan-400' },
];

const recentExports = [
  { name: 'Stock Report - December 2024', template: 'Stock Report', date: '2024-12-18T10:30:00Z', size: '2.4 MB', rows: 2847 },
  { name: 'Customer List - Q4', template: 'Customer List', date: '2024-12-15T14:00:00Z', size: '1.1 MB', rows: 456 },
  { name: 'Sales Summary - November', template: 'Sales Summary', date: '2024-12-01T09:00:00Z', size: '3.2 MB', rows: 1240 },
  { name: 'Purchase Orders - Week 50', template: 'Purchase Orders', date: '2024-12-16T16:30:00Z', size: '890 KB', rows: 89 },
];

export default function ExcelExportPage() {
  const [isDragging, setIsDragging] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Excel Export & Import"
        description="Generate reports and import data from spreadsheets"
      />

      {/* Export Templates */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Export Templates</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exportTemplates.map((template, index) => (
            <motion.div
              key={template.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="hover:border-primary/30 transition-colors h-full">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary/10">
                      <template.icon className={`h-5 w-5 ${template.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                    </div>
                  </div>
                  <div className="mt-auto pt-3">
                    <Button size="sm" className="w-full">
                      <Download className="mr-2 h-3.5 w-3.5" /> Generate
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Import Section */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Import Data</h2>
        <Card>
          <CardContent className="p-6">
            <div
              className={`border-2 border-dashed rounded-[16px] p-8 text-center transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-border'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">
                Drop your file here, or click to browse
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Supports .xlsx, .xls, and .csv files up to 10MB
              </p>
              <Button variant="outline" size="sm">
                <FileSpreadsheet className="mr-2 h-3.5 w-3.5" /> Choose File
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Reports</h2>
        <Card>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {recentExports.map((report, index) => (
                <div key={index} className="flex items-center justify-between px-5 py-3.5 hover:bg-secondary/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-[8px] bg-emerald-500/10">
                      <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{report.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {format(new Date(report.date), 'MMM d, yyyy HH:mm')}
                        <span>&middot;</span>
                        <span>{report.size}</span>
                        <span>&middot;</span>
                        <span>{report.rows.toLocaleString()} rows</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">{report.template}</Badge>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
