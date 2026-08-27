import mongoose, { Schema, Document } from 'mongoose';

export interface IReturnItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  unit_price: number;
  reason: string;
  condition: 'good' | 'damaged' | 'refurbished';
}

export interface IReturn extends Document {
  return_number: string;
  sales_order: mongoose.Types.ObjectId;
  customer: mongoose.Types.ObjectId;
  warehouse: mongoose.Types.ObjectId;
  status: 'requested' | 'approved' | 'received' | 'refunded' | 'rejected';
  items: IReturnItem[];
  refund_amount: number;
  restock_status: boolean;
  notes?: string;
  processed_by?: mongoose.Types.ObjectId;
}

const ReturnItemSchema = new Schema<IReturnItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true },
    unit_price: { type: Number, required: true },
    reason: { type: String, required: true },
    condition: { type: String, enum: ['good', 'damaged', 'refurbished'], default: 'good' },
  },
  { _id: false }
);

const ReturnSchema = new Schema<IReturn>(
  {
    return_number: { type: String, required: true, unique: true, uppercase: true },
    sales_order: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    status: {
      type: String,
      enum: ['requested', 'approved', 'received', 'refunded', 'rejected'],
      default: 'requested',
    },
    items: [ReturnItemSchema],
    refund_amount: { type: Number, default: 0 },
    restock_status: { type: Boolean, default: false },
    notes: { type: String },
    processed_by: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

export const Return = mongoose.model<IReturn>('Return', ReturnSchema);
