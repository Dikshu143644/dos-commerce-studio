import mongoose, { Schema, Document } from 'mongoose';

export interface ISOItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  unit_price: number;
  tax_rate: number;
  total: number;
}

export interface ISalesOrder extends Document {
  order_number: string;
  customer: mongoose.Types.ObjectId;
  warehouse: mongoose.Types.ObjectId;
  status: 'draft' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  order_date: Date;
  delivery_date?: Date;
  items: ISOItem[];
  subtotal: number;
  tax_total: number;
  shipping_fee: number;
  total_amount: number;
  po_reference?: string;
  shipping_address?: string;
  notes?: string;
  created_by: mongoose.Types.ObjectId;
}

const SOItemSchema = new Schema<ISOItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit_price: { type: Number, required: true, min: 0 },
    tax_rate: { type: Number, default: 18 },
    total: { type: Number, required: true },
  },
  { _id: false }
);

const SalesOrderSchema = new Schema<ISalesOrder>(
  {
    order_number: { type: String, required: true, unique: true, uppercase: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    status: {
      type: String,
      enum: ['draft', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'draft',
    },
    order_date: { type: Date, default: Date.now },
    delivery_date: { type: Date },
    items: [SOItemSchema],
    subtotal: { type: Number, required: true },
    tax_total: { type: Number, required: true },
    shipping_fee: { type: Number, default: 0 },
    total_amount: { type: Number, required: true },
    po_reference: { type: String },
    shipping_address: { type: String },
    notes: { type: String },
    created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const SalesOrder = mongoose.model<ISalesOrder>('SalesOrder', SalesOrderSchema);
