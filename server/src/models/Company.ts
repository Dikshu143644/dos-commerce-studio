import mongoose, { Schema, Document } from 'mongoose';

export interface ICompany extends Document {
  name: string;
  legal_name: string;
  gstin?: string;
  pan?: string;
  email: string;
  phone: string;
  address: string;
  currency: string;
  logo_url?: string;
  created_at: Date;
}

const CompanySchema = new Schema<ICompany>(
  {
    name: { type: String, required: true, trim: true },
    legal_name: { type: String, required: true },
    gstin: { type: String },
    pan: { type: String },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    currency: { type: String, default: 'INR' },
    logo_url: { type: String },
  },
  { timestamps: true }
);

export const Company = mongoose.model<ICompany>('Company', CompanySchema);
