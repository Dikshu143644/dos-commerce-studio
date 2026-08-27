import mongoose, { Schema, Document } from 'mongoose';

export interface ILead extends Document {
  name: string;
  company_name?: string;
  email?: string;
  phone?: string;
  source: 'website' | 'referral' | 'cold_call' | 'trade_show' | 'social_media' | 'advertisement' | 'other';
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  estimated_value?: number;
  assigned_to?: mongoose.Types.ObjectId;
  notes?: string;
  score?: number;
}

const LeadSchema = new Schema<ILead>(
  {
    name: { type: String, required: true, trim: true },
    company_name: { type: String, trim: true },
    email: { type: String, lowercase: true, trim: true },
    phone: { type: String },
    source: {
      type: String,
      enum: ['website', 'referral', 'cold_call', 'trade_show', 'social_media', 'advertisement', 'other'],
      default: 'website',
    },
    status: {
      type: String,
      enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'],
      default: 'new',
    },
    estimated_value: { type: Number, default: 0 },
    assigned_to: { type: Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
    score: { type: Number, default: 50 },
  },
  { timestamps: true }
);

export const Lead = mongoose.model<ILead>('Lead', LeadSchema);
