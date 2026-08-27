import mongoose, { Schema, Document } from 'mongoose';

export interface ICustomer extends Document {
  company_name: string;
  code: string;
  customer_type: 'regular' | 'wholesale' | 'retail' | 'enterprise';
  email: string;
  phone: string;
  gstin?: string;
  pan?: string;
  billing_address: string;
  shipping_address: string;
  city: string;
  state: string;
  credit_limit: number;
  payment_terms_days: number;
  is_active: boolean;
  assigned_to?: mongoose.Types.ObjectId;
}

const CustomerSchema = new Schema<ICustomer>(
  {
    company_name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    customer_type: {
      type: String,
      enum: ['regular', 'wholesale', 'retail', 'enterprise'],
      default: 'regular',
    },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    gstin: { type: String },
    pan: { type: String },
    billing_address: { type: String, required: true },
    shipping_address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    credit_limit: { type: Number, default: 100000 },
    payment_terms_days: { type: Number, default: 30 },
    is_active: { type: Boolean, default: true },
    assigned_to: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Customer = mongoose.model<ICustomer>('Customer', CustomerSchema);
