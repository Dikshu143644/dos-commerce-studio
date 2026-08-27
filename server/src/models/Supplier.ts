import mongoose, { Schema, Document } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  code: string;
  contact_person: string;
  email: string;
  phone: string;
  gstin?: string;
  address: string;
  city: string;
  payment_terms_days: number;
  rating: number;
  is_active: boolean;
}

const SupplierSchema = new Schema<ISupplier>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    contact_person: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    gstin: { type: String },
    address: { type: String, required: true },
    city: { type: String, required: true },
    payment_terms_days: { type: Number, default: 30 },
    rating: { type: Number, default: 4.5, min: 1, max: 5 },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Supplier = mongoose.model<ISupplier>('Supplier', SupplierSchema);
