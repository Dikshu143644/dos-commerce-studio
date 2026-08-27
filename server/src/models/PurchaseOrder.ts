import mongoose, { Schema, Document } from 'mongoose';

export interface IPOItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  received_quantity: number;
  total: number;
}

export interface IPurchaseOrder extends Document {
  po_number: string;
  supplier: mongoose.Types.ObjectId;
  warehouse: mongoose.Types.ObjectId;
  status: 'draft' | 'ordered' | 'partially_received' | 'received' | 'cancelled';
  order_date: Date;
  expected_delivery_date?: Date;
  items: IPOItem[];
  subtotal: number;
  tax_total: number;
  total_amount: number;
  notes?: string;
  created_by: mongoose.Types.ObjectId;
}

const POItemSchema = new Schema<IPOItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit_price: { type: Number, required: true, min: 0 },
    tax_rate: { type: Number, default: 18 },
    received_quantity: { type: Number, default: 0 },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
  {
    po_number: { type: String, required: true, unique: true, uppercase: true },
    supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    status: {
      type: String,
      enum: ['draft', 'ordered', 'partially_received', 'received', 'cancelled'],
      default: 'draft',
    },
    order_date: { type: Date, default: Date.now },
    expected_delivery_date: { type: Date },
    items: [POItemSchema],
    subtotal: { type: Number, required: true },
    tax_total: { type: Number, required: true },
    total_amount: { type: Number, required: true },
    notes: { type: String },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const PurchaseOrder = mongoose.model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
