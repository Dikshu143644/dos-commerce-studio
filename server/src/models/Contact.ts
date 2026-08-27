import mongoose, { Schema, Document } from 'mongoose';

export interface IContact extends Document {
  customer: mongoose.Types.ObjectId;
  first_name: string;
  last_name: string;
  designation?: string;
  email: string;
  phone: string;
  is_primary: boolean;
}

const ContactSchema = new Schema<IContact>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    first_name: { type: String, required: true },
    last_name: { type: String, required: true },
    designation: { type: String },
    email: { type: String, required: true },
    phone: { type: String, required: true },
    is_primary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Contact = mongoose.model<IContact>('Contact', ContactSchema);
