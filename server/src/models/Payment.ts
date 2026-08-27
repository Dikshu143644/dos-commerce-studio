import mongoose, { Schema, Document } from 'mongoose';

export interface IPayment extends Document {
  payment_number: string;
  invoice: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  amount: number;
  payment_date: Date;
  payment_method: 'bank_transfer' | 'credit_card' | 'upi' | 'cheque' | 'cash';
  transaction_reference?: string;
  status: 'completed' | 'pending' | 'failed';
  notes?: string;
  recorded_by: mongoose.Types.ObjectId;
}

const PaymentSchema = new Schema<IPayment>(
  {
    payment_number: { type: String, required: true, unique: true, uppercase: true },
    invoice: { type: Schema.Types.ObjectId, ref: 'Invoice', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    amount: { type: Number, required: true, min: 1 },
    payment_date: { type: Date, default: Date.now },
    payment_method: {
      type: String,
      enum: ['bank_transfer', 'credit_card', 'upi', 'cheque', 'cash'],
      required: true,
    },
    transaction_reference: { type: String },
    status: {
      type: String,
      enum: ['completed', 'pending', 'failed'],
      default: 'completed',
    },
    notes: { type: String },
    recorded_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Payment = mongoose.model<IPayment>('Payment', PaymentSchema);
