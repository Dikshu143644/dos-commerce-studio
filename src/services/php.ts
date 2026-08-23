import { supabase } from '@/lib/supabase';

const PHP_API_URL = import.meta.env.VITE_PHP_API_URL || 'http://localhost:8080';

/**
 * PHP API client that forwards Supabase JWT in Authorization header.
 * Handles communication with the PHP backend for heavy server-side operations.
 */
class PhpApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }

  private async getAuthHeaders(): Promise<Record<string, string>> {
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }
    return headers;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const headers = await this.getAuthHeaders();
    const url = `${this.baseUrl}${path}`;

    const options: RequestInit = {
      method,
      headers,
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `PHP API error: ${response.status}`);
    }

    // Check if response is a file download
    const contentType = response.headers.get('content-type');
    if (contentType && (contentType.includes('application/pdf') || contentType.includes('application/vnd'))) {
      return response.blob() as unknown as T;
    }

    return response.json();
  }

  private async uploadFile<T>(
    path: string,
    file: File,
    additionalData?: Record<string, string>
  ): Promise<T> {
    const { data: { session } } = await supabase.auth.getSession();
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      for (const [key, value] of Object.entries(additionalData)) {
        formData.append(key, value);
      }
    }

    const headers: Record<string, string> = {};
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    }

    const response = await fetch(`${this.baseUrl}${path}`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `PHP API error: ${response.status}`);
    }

    return response.json();
  }

  /**
   * Generate invoice PDF for a sales order
   */
  async generateInvoice(salesOrderId: string): Promise<Blob> {
    return this.request<Blob>('POST', '/api/invoices/generate', {
      sales_order_id: salesOrderId,
    });
  }

  /**
   * Generate purchase order PDF
   */
  async generatePO(purchaseOrderId: string): Promise<Blob> {
    return this.request<Blob>('POST', '/api/purchase-orders/pdf', {
      purchase_order_id: purchaseOrderId,
    });
  }

  /**
   * Generate stock report (PDF or Excel)
   */
  async generateStockReport(options: {
    format: 'pdf' | 'excel';
    warehouse_id?: string;
    category_id?: string;
  }): Promise<Blob> {
    return this.request<Blob>('POST', '/api/reports/stock', options);
  }

  /**
   * Send transactional email
   */
  async sendEmail(payload: {
    to: string;
    template: string;
    data: Record<string, unknown>;
  }): Promise<{ success: boolean; message_id?: string }> {
    return this.request('POST', '/api/email/send', payload);
  }

  /**
   * Send WhatsApp message via MSG91/Twilio
   */
  async sendWhatsApp(payload: {
    to: string;
    template: string;
    data: Record<string, unknown>;
  }): Promise<{ success: boolean; message_id?: string }> {
    return this.request('POST', '/api/notifications/whatsapp', payload);
  }

  /**
   * Import Excel file (server-side processing for large files)
   */
  async importExcel(file: File, type: string): Promise<{
    success: boolean;
    imported: number;
    errors: Array<{ row: number; message: string }>;
  }> {
    return this.uploadFile('/api/excel/import', file, { type });
  }

  /**
   * Export inventory to Excel (server-side generation)
   */
  async exportInventory(options?: {
    warehouse_id?: string;
    category_id?: string;
  }): Promise<Blob> {
    return this.request<Blob>('POST', '/api/excel/export/inventory', options ?? {});
  }
}

export const phpApi = new PhpApiClient(PHP_API_URL);
