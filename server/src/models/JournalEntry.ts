import mongoose, { Schema, Document } from 'mongoose';

export interface IJournalLine {
  account: mongoose.Types.ObjectId;
  description?: string;
  debit: number;
  credit: number;
}

export interface IJournalEntry extends Document {
  entry_number: string;
  date: Date;
  reference?: string;
  description: string;
  lines: IJournalLine[];
  total_debit: number;
  total_credit: number;
  created_by: mongoose.Types.ObjectId;
}

const JournalLineSchema = new Schema<IJournalLine>(
  {
    account: { type: Schema.Types.ObjectId, ref: 'Account', required: true },
    description: { type: String },
    debit: { type: Number, default: 0 },
    credit: { type: Number, default: 0 },
  },
  { _id: false }
);

const JournalEntrySchema = new Schema<IJournalEntry>(
  {
    entry_number: { type: String, required: true, unique: true, uppercase: true },
    date: { type: Date, default: Date.now },
    reference: { type: String },
    description: { type: String, required: true },
    lines: [JournalLineSchema],
    total_debit: { type: Number, required: true },
    total_credit: { type: Number, required: true },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const JournalEntry = mongoose.model<IJournalEntry>('JournalEntry', JournalEntrySchema);
