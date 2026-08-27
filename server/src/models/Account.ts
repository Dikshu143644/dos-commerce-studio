import mongoose, { Schema, Document } from 'mongoose';

export interface IAccount extends Document {
  code: string;
  name: string;
  type: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  balance: number;
  currency: string;
  is_active: boolean;
}

const AccountSchema = new Schema<IAccount>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    type: {
      type: String,
      enum: ['asset', 'liability', 'equity', 'revenue', 'expense'],
      required: true,
    },
    balance: { type: Number, default: 0 },
    currency: { type: String, default: 'INR' },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Account = mongoose.model<IAccount>('Account', AccountSchema);
