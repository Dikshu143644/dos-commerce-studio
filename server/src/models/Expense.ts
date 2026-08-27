import mongoose, { Schema, Document } from 'mongoose';

export interface IExpense extends Document {
  expense_number: string;
  title: string;
  category: 'Warehouse Rent' | 'Logistics & Freight' | 'Salaries & Wages' | 'Utilities & Electricity' | 'Packaging Materials' | 'Software & Subscriptions' | 'Equipment Maintenance' | 'Marketing & Ads' | 'Other';
  amount: number;
  date: Date;
  payment_method: 'bank_transfer' | 'corporate_card' | 'upi' | 'petty_cash';
  vendor: string;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  receipt_url?: string;
  recorded_by: mongoose.Types.ObjectId;
}

const ExpenseSchema = new Schema<IExpense>(
  {
    expense_number: { type: String, required: true, unique: true, uppercase: true },
    title: { type: String, required: true, trim: true },
    category: {
      type: String,
      enum: [
        'Warehouse Rent',
        'Logistics & Freight',
        'Salaries & Wages',
        'Utilities & Electricity',
        'Packaging Materials',
        'Software & Subscriptions',
        'Equipment Maintenance',
        'Marketing & Ads',
        'Other',
      ],
      required: true,
    },
    amount: { type: Number, required: true, min: 0 },
    date: { type: Date, default: Date.now },
    payment_method: {
      type: String,
      enum: ['bank_transfer', 'corporate_card', 'upi', 'petty_cash'],
      default: 'bank_transfer',
    },
    vendor: { type: String, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
    notes: { type: String },
    receipt_url: { type: String },
    recorded_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Expense = mongoose.model<IExpense>('Expense', ExpenseSchema);
