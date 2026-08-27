import mongoose, { Schema, Document } from 'mongoose';

export interface IInventory extends Document {
  product: mongoose.Types.ObjectId;
  warehouse: mongoose.Types.ObjectId;
  quantity: number;
  reserved_quantity: number;
  available_quantity: number;
  bin_location?: string;
  last_counted_at?: Date;
}

const InventorySchema = new Schema<IInventory>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    quantity: { type: Number, required: true, default: 0 },
    reserved_quantity: { type: Number, default: 0 },
    bin_location: { type: String },
    last_counted_at: { type: Date },
  },
  { timestamps: true }
);

InventorySchema.virtual('available_quantity').get(function (this: IInventory) {
  return Math.max(0, this.quantity - (this.reserved_quantity || 0));
});

InventorySchema.index({ product: 1, warehouse: 1 }, { unique: true });

export const Inventory = mongoose.model<IInventory>('Inventory', InventorySchema);
