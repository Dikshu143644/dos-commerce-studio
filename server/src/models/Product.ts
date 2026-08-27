import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  sku: string;
  name: string;
  category: mongoose.Types.ObjectId;
  description?: string;
  cost_price: number;
  selling_price: number;
  tax_rate: number;
  hsn_code?: string;
  unit: string;
  min_order_qty: number;
  reorder_level: number;
  barcode?: string;
  image_url?: string;
  is_active: boolean;
}

const ProductSchema = new Schema<IProduct>(
  {
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    description: { type: String },
    cost_price: { type: Number, required: true, min: 0 },
    selling_price: { type: Number, required: true, min: 0 },
    tax_rate: { type: Number, default: 18 },
    hsn_code: { type: String },
    unit: { type: String, default: 'PCS' },
    min_order_qty: { type: Number, default: 1 },
    reorder_level: { type: Number, default: 10 },
    barcode: { type: String },
    image_url: { type: String },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
