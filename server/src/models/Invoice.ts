import mongoose, { Schema, Document } from 'mongoose';

export interface IInvoiceItem {
  product: mongoose.Types.ObjectId;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number;
}

export interface IInvoice extends Document {
  invoice_number: string;
  sales_order: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  status: 'draft' | 'issued' | 'paid' | 'partially_paid' | 'overdue' | 'cancelled';
  issue_date: Date;
  due_date: Date;
  items: IInvoiceItem[];
  subtotal: number;
  tax_total: number;
  cgst: number;
  sgst: number;
  igst: number;
  discount: number;
  total_amount: number;
  amount_paid: number;
  balance_due: number;
  created_by: mongoose.Types.ObjectId;
}

const InvoiceItemSchema = new Schema<IInvoiceItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    description: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit_price: { type: Number, required: true },
    tax_rate: { type: Number, default: 18 },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const InvoiceSchema = new Schema<IInvoice>(
  {
    invoice_number: { type: String, required: true, unique: true, uppercase: true },
    sales_order: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    status: {
      type: String,
      enum: ['draft', 'issued', 'paid', 'partially_paid', 'overdue', 'cancelled'],
      default: 'issued',
    },
    issue_date: { type: Date, default: Date.now },
    due_date: { type: Date, required: true },
    items: [InvoiceItemSchema],
    subtotal: { type: Number, required: true },
    tax_total: { type: Number, required: true },
    cgst: { type: Number, default: 0 },
    sgst: { type: Number, default: 0 },
    igst: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total_amount: { type: Number, required: true },
    amount_paid: { type: Number, default: 0 },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

InvoiceSchema.virtual('balance_due').get(function (this: IInvoice) {
  return Math.max(0, this.total_amount - (this.amount_paid || 0));
});

export const Invoice = mongoose.model<IInvoice>('Invoice', InvoiceSchema);
