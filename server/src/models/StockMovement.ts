import mongoose, { Schema, Document } from 'mongoose';

export interface IStockMovement extends Document {
  product: mongoose.Types.ObjectId;
  warehouse: mongoose.Types.ObjectId;
  destination_warehouse?: mongoose.Types.ObjectId;
  type: 'in' | 'out' | 'transfer' | 'adjustment';
  quantity: number;
  reference_type: 'purchase_order' | 'sales_order' | 'manual_adjustment' | 'internal_transfer' | 'return';
  reference_id?: string;
  notes?: string;
  performed_by: mongoose.Types.ObjectId;
  createdAt: Date;
}

const StockMovementSchema = new Schema<IStockMovement>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    destination_warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    type: { type: String, enum: ['in', 'out', 'transfer', 'adjustment'], required: true },
    quantity: { type: Number, required: true },
    reference_type: {
      type: String,
      enum: ['purchase_order', 'sales_order', 'manual_adjustment', 'internal_transfer', 'return'],
      required: true,
    },
    reference_id: { type: String },
    notes: { type: String },
    performed_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const StockMovement = mongoose.model<IStockMovement>('StockMovement', StockMovementSchema);
