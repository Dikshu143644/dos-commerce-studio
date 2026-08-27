import mongoose, { Schema, Document } from 'mongoose';

export interface IBranch extends Document {
  name: string;
  code: string;
  company: mongoose.Types.ObjectId;
  location: string;
  address: string;
  contact_person?: string;
  phone?: string;
  is_active: boolean;
}

const BranchSchema = new Schema<IBranch>(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, uppercase: true },
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true },
    location: { type: String, required: true },
    address: { type: String, required: true },
    contact_person: { type: String },
    phone: { type: String },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Branch = mongoose.model<IBranch>('Branch', BranchSchema);
