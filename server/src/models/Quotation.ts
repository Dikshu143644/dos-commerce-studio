import mongoose, { Schema, Document } from 'mongoose';

export interface IQuotationItem {
  product?: mongoose.Types.ObjectId;
  description: string;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  amount: number;
}

export interface IQuotation extends Document {
  quotation_number: string;
  customer?: mongoose.Types.ObjectId;
  lead?: mongoose.Types.ObjectId;
  customer_name: string;
  customer_company: string;
  customer_email: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  issue_date: Date;
  expiry_date: Date;
  items: IQuotationItem[];
  subtotal: number;
  tax_total: number;
  discount: number;
  total_amount: number;
  notes?: string;
  created_by: mongoose.Types.ObjectId;
}

const QuotationItemSchema = new Schema<IQuotationItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product' },
    description: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit_price: { type: Number, required: true, min: 0 },
    tax_rate: { type: Number, default: 18 },
    amount: { type: Number, required: true },
  },
  { _id: false }
);

const QuotationSchema = new Schema<IQuotation>(
  {
    quotation_number: { type: String, required: true, unique: true, uppercase: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    lead: { type: Schema.Types.ObjectId, ref: 'Lead' },
    customer_name: { type: String, required: true },
    customer_company: { type: String, required: true },
    customer_email: { type: String, required: true },
    status: {
      type: String,
      enum: ['draft', 'sent', 'accepted', 'rejected', 'expired'],
      default: 'draft',
    },
    issue_date: { type: Date, default: Date.now },
    expiry_date: { type: Date, required: true },
    items: [QuotationItemSchema],
    subtotal: { type: Number, required: true },
    tax_total: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    total_amount: { type: Number, required: true },
    notes: { type: String },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Quotation = mongoose.model<IQuotation>('Quotation', QuotationSchema);
