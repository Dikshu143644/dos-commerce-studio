import mongoose, { Schema, Document } from 'mongoose';

export interface IPortalCartItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  unit_price: number;
}

export interface IPortalCart extends Document {
  user: mongoose.Types.ObjectId;
  customer?: mongoose.Types.ObjectId;
  items: IPortalCartItem[];
  updatedAt: Date;
}

const PortalCartItemSchema = new Schema<IPortalCartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    unit_price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const PortalCartSchema = new Schema<IPortalCart>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    customer: { type: Schema.Types.ObjectId, ref: 'Customer' },
    items: [PortalCartItemSchema],
  },
  { timestamps: true }
);

export const PortalCart = mongoose.model<IPortalCart>('PortalCart', PortalCartSchema);
