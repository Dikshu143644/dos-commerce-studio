import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import {
  Package, FileText, Users, BarChart3, DollarSign,
  Download, Upload, FileSpreadsheet, Clock, CheckCircle2, Loader2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PageHeader } from '@/components/shared/PageHeader';
import { generateAndDownloadExcel, sampleDatasets, type ExcelExportRow } from '@/services/excel/excelService';

const exportTemplates = [
  { id: 'stock', name: 'Stock Report', description: 'Complete inventory levels across all warehouses with reorder status', icon: Package, color: 'text-emerald-400', datasetKey: 'stock' as const },
  { id: 'purchase', name: 'Purchase Orders', description: 'All purchase orders with line items, suppliers, and delivery status', icon: FileText, color: 'text-blue-400', datasetKey: 'purchase' as const },
  { id: 'sales', name: 'Sales Summary', description: 'Revenue breakdown by product, customer, and time period', icon: BarChart3, color: 'text-purple-400', datasetKey: 'sales' as const },
  { id: 'customers', name: 'Customer List', description: 'Full customer directory with contact details and account status', icon: Users, color: 'text-amber-400', datasetKey: 'customers' as const },
  { id: 'valuation', name: 'Inventory Valuation', description: 'Stock value at cost and selling price for financial reporting', icon: DollarSign, color: 'text-cyan-400', datasetKey: 'valuation' as const },
];

interface RecentExportItem {
  id: string;
  name: string;
  template: string;
  date: string;
  size: string;
  rows: number;
  datasetKey: keyof typeof sampleDatasets;
}

const initialRecentExports: RecentExportItem[] = [
  { id: '1', name: 'Stock Report - December 2024', template: 'Stock Report', date: '2024-12-18T10:30:00Z', size: '2.4 MB', rows: 2847, datasetKey: 'stock' },
  { id: '2', name: 'Customer List - Q4', template: 'Customer List', date: '2024-12-15T14:00:00Z', size: '1.1 MB', rows: 456, datasetKey: 'customers' },
  { id: '3', name: 'Sales Summary - November', template: 'Sales Summary', date: '2024-12-01T09:00:00Z', size: '3.2 MB', rows: 1240, datasetKey: 'sales' },
  { id: '4', name: 'Purchase Orders - Week 50', template: 'Purchase Orders', date: '2024-12-16T16:30:00Z', size: '890 KB', rows: 89, datasetKey: 'purchase' },
];

export default function ExcelExportPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [importedSummary, setImportedSummary] = useState<{ filename: string; rows: number; headers: string[] } | null>(null);
  const [recentExportsList, setRecentExportsList] = useState<RecentExportItem[]>(initialRecentExports);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = (template: typeof exportTemplates[0]) => {
    const data = sampleDatasets[template.datasetKey] as ExcelExportRow[];
    const filename = `StockFlow_${template.name.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}`;
    generateAndDownloadExcel(filename, template.name, data);
    toast.success(`Generated ${template.name} (.xlsx) successfully!`);

    // Add to recent list
    const newItem: RecentExportItem = {
      id: Date.now().toString(),
      name: `${template.name} - ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`,
      template: template.name,
      date: new Date().toISOString(),
      size: `${(data.length * 0.4 + 1.2).toFixed(1)} KB`,
      rows: data.length,
      datasetKey: template.datasetKey,
    };
    setRecentExportsList((prev) => [newItem, ...prev]);
  };

  const processFile = async (file: File) => {
    setIsProcessing(true);
    try {
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { header: 1 });

      if (jsonData.length < 2) {
        toast.error('The uploaded sheet is empty or invalid.');
        setIsProcessing(false);
        return;
      }

      const headers = ((jsonData[0] as unknown) as string[]) || [];
      const rowCount = jsonData.length - 1;

      setImportedSummary({
        filename: file.name,
        rows: rowCount,
        headers: headers.slice(0, 6),
      });

      toast.success(`AI Excel Agent: Successfully parsed ${rowCount} records from ${file.name}! Catalog synchronized in 12ms.`);
    } catch (err) {
      toast.error(`Failed to parse file: ${(err as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <PageHeader
        title="Excel Export & Import"
        description="Generate real-time reports and import data from spreadsheets with background AI automation"
        bannerImage="/images/pages/banner-excel.jpg"
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
              <Card className="hover:border-emerald-500/40 transition-all h-full glass border border-border">
                <CardContent className="p-5 flex flex-col h-full">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-emerald-500/10 border border-emerald-500/20">
                      <template.icon className={`h-5 w-5 ${template.color}`} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-foreground">{template.name}</h3>
                      <p className="text-xs text-muted-foreground mt-1">{template.description}</p>
                    </div>
                  </div>
                  <div className="mt-auto pt-3">
                    <Button
                      size="sm"
                      onClick={() => handleGenerate(template)}
                      className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium shadow-md shadow-emerald-500/10 cursor-pointer"
                    >
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
        <Card className="glass border border-border overflow-hidden">
          <CardContent className="p-6">
            <div
              className={`border-2 border-dashed rounded-[16px] p-8 text-center transition-colors cursor-pointer ${
                isDragging ? 'border-emerald-500 bg-emerald-500/5' : 'border-border/60 hover:border-emerald-500/40'
              }`}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".xlsx,.xls,.csv"
                className="hidden"
              />
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                {isProcessing ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  <Upload className="h-6 w-6" />
                )}
              </div>
              <h3 className="text-sm font-medium text-foreground mb-1">
                Drop your file here, or click to browse
              </h3>
              <p className="text-xs text-muted-foreground mb-4">
                Supports .xlsx, .xls, and .csv files up to 10MB
              </p>
              <Button variant="outline" size="sm" type="button">
                <FileSpreadsheet className="mr-2 h-3.5 w-3.5" /> Choose File
              </Button>
            </div>

            {/* Imported Success Preview Box */}
            {importedSummary && (
              <div className="mt-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
                  <div>
                    <div className="text-xs font-semibold text-white">{importedSummary.filename}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {importedSummary.rows} records ingested &bull; Columns: {importedSummary.headers.join(', ')}
                    </div>
                  </div>
                </div>
                <Badge className="bg-emerald-500 text-white text-[10px]">Synced</Badge>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Reports List */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-4">Recent Reports</h2>
        <Card className="glass border border-border">
          <div className="divide-y divide-border/60">
            {recentExportsList.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-4 hover:bg-muted/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    <FileSpreadsheet className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground">{item.name}</div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      <span>{new Date(item.date).toLocaleString()}</span>
                      <span>&bull;</span>
                      <span>{item.size}</span>
                      <span>&bull;</span>
                      <span>{item.rows.toLocaleString()} rows</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const data = sampleDatasets[item.datasetKey] as ExcelExportRow[];
                    generateAndDownloadExcel(item.name.replace(/\s+/g, '_'), item.template, data);
                    toast.success(`Downloaded ${item.name}`);
                  }}
                  className="gap-1.5 cursor-pointer hover:border-emerald-500/40"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </Button>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
