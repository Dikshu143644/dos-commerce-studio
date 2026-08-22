export interface ParsedSheet {
  name: string;
  headers: string[];
  rows: Record<string, unknown>[];
  totalRows: number;
}

export interface ColumnMapping {
  sourceColumn: string;
  targetField: string;
  transform?: (value: unknown) => unknown;
}

export interface ExportConfig {
  filename: string;
  sheetName: string;
  columns: ExportColumn[];
  data: Record<string, unknown>[];
  title?: string;
  subtitle?: string;
}

export interface ExportColumn {
  key: string;
  header: string;
  width?: number;
  format?: 'text' | 'number' | 'currency' | 'date' | 'percentage';
}

export interface TemplateDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  columns: ExportColumn[];
  sampleData?: Record<string, unknown>[];
}
