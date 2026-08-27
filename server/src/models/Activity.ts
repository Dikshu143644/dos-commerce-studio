import mongoose, { Schema, Document } from 'mongoose';

export interface IActivity extends Document {
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  title: string;
  description?: string;
  customer?: mongoose.Types.ObjectId;
  lead?: mongoose.Types.ObjectId;
  deal?: mongoose.Types.ObjectId;
  due_date?: Date;
  completed_at?: Date;
  status: 'pending' | 'completed' | 'cancelled';
  performed_by: mongoose.Types.ObjectId;
}

const ActivitySchema = new Schema<IActivity>(
  {
    type: {
      type: String,
      enum: ['call', 'email', 'meeting', 'note', 'task'],
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    lead: { type: Schema.Types.ObjectId, ref: 'Lead' },
    deal: { type: Schema.Types.ObjectId, ref: 'Deal' },
    due_date: { type: Date },
    completed_at: { type: Date },
    status: {
      type: String,
      enum: ['pending', 'completed', 'cancelled'],
      default: 'pending',
    },
    performed_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Activity = mongoose.model<IActivity>('Activity', ActivitySchema);
