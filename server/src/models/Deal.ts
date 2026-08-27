import mongoose, { Schema, Document } from 'mongoose';

export interface IDeal extends Document {
  title: string;
  customer?: mongoose.Types.ObjectId;
  lead?: mongoose.Types.ObjectId;
  stage: 'qualification' | 'needs_analysis' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  value: number;
  expected_close_date?: Date;
  probability: number;
  assigned_to?: mongoose.Types.ObjectId;
  lost_reason?: string;
  notes?: string;
}

const DealSchema = new Schema<IDeal>(
  {
    title: { type: String, required: true, trim: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    lead: { type: Schema.Types.ObjectId, ref: 'Lead' },
    stage: {
      type: String,
      enum: ['qualification', 'needs_analysis', 'proposal', 'negotiation', 'closed_won', 'closed_lost'],
      default: 'qualification',
    },
    value: { type: Number, required: true, min: 0 },
    expected_close_date: { type: Date },
    probability: { type: Number, default: 20, min: 0, max: 100 },
    assigned_to: { type: Schema.Types.ObjectId, ref: 'User' },
    lost_reason: { type: String },
    notes: { type: String },
  },
  { timestamps: true }
);

export const Deal = mongoose.model<IDeal>('Deal', DealSchema);
