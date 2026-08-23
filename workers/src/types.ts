// Cloudflare Workers environment bindings
export interface Env {
  // Supabase
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
  SUPABASE_JWT_SECRET: string;

  // AI Providers
  OPENAI_API_KEY: string;
  GEMINI_API_KEY: string;
  ANTHROPIC_API_KEY: string;
  AI_PRIMARY_PROVIDER: string;

  // Email
  RESEND_API_KEY: string;

  // Payments
  RAZORPAY_WEBHOOK_SECRET: string;

  // CORS
  CORS_ORIGIN: string;

  // KV Namespaces
  RATE_LIMIT: KVNamespace;

  // Environment
  ENVIRONMENT: string;
}

// Chat types
export interface ChatRequest {
  message: string;
  agentType: string;
  conversationId?: string;
  messages?: Array<{ role: string; content: string }>;
  systemPrompt?: string;
  enableRag?: boolean;
  enableTools?: boolean;
}

export interface ToolCallResult {
  tool_name: string;
  success: boolean;
  data: Record<string, unknown> | null;
  error?: string;
  execution_time_ms: number;
}

export interface SSEEvent {
  type: 'token' | 'tool_call' | 'tool_result' | 'done' | 'error';
  content?: string;
  name?: string;
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  sources?: string[];
}

// AI types
export interface AICallOptions {
  messages: Array<{ role: string; content: string; tool_call_id?: string; name?: string }>;
  systemPrompt: string;
  enableTools: boolean;
  stream?: boolean;
}

export interface AICallResponse {
  content: string;
  tool_calls?: Array<{
    id: string;
    function: { name: string; arguments: string };
  }>;
  tokensUsed?: number;
  model?: string;
  provider?: string;
}

// Invoice types
export interface InvoiceData {
  invoice_number: string;
  date: string;
  due_date: string;
  company: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gstin: string;
  };
  customer: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    gstin?: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unit_price: number;
    amount: number;
    hsn_code?: string;
  }>;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
  amount_in_words: string;
  bank_details?: {
    bank_name: string;
    account_number: string;
    ifsc_code: string;
    branch: string;
  };
}

// Excel types
export interface ExcelGenerateRequest {
  template: string;
  filters: Record<string, unknown>;
  format: 'xlsx' | 'csv';
}

// Email types
export interface EmailRequest {
  to: string;
  subject: string;
  template: 'order-confirmation' | 'low-stock-alert' | 'payment-reminder';
  data: Record<string, unknown>;
}

// Notification types
export interface NotificationRequest {
  type: 'whatsapp' | 'sms';
  to: string;
  template: string;
  data: Record<string, unknown>;
}

// Payment types
export interface PaymentWebhookPayload {
  event: string;
  payload: {
    payment?: {
      entity: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        order_id: string;
        method: string;
      };
    };
    order?: {
      entity: {
        id: string;
        amount: number;
        currency: string;
        status: string;
        receipt: string;
      };
    };
  };
}
