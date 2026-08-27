import mongoose, { Schema, Document } from 'mongoose';

export interface IWarehouse extends Document {
  code: string;
  name: string;
  branch: mongoose.Types.ObjectId;
  location: string;
  capacity_sqft: number;
  manager_name?: string;
  phone?: string;
  is_active: boolean;
}

const WarehouseSchema = new Schema<IWarehouse>(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    name: { type: String, required: true },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch', required: true },
    location: { type: String, required: true },
    capacity_sqft: { type: Number, default: 10000 },
    manager_name: { type: String },
    phone: { type: String },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const Warehouse = mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);
