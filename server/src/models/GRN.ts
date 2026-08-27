import mongoose, { Schema, Document } from 'mongoose';

export interface IGRNItem {
  product: mongoose.Types.ObjectId;
  ordered_quantity: number;
  received_quantity: number;
  accepted_quantity: number;
  rejected_quantity: number;
  rejection_reason?: string;
}

export interface IGRN extends Document {
  grn_number: string;
  purchase_order: mongoose.Types.ObjectId;
  warehouse: mongoose.Types.ObjectId;
  received_date: Date;
  delivery_challan_no?: string;
  transporter?: string;
  vehicle_no?: string;
  items: IGRNItem[];
  inspected_by: mongoose.Types.ObjectId;
  notes?: string;
}

const GRNItemSchema = new Schema<IGRNItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    ordered_quantity: { type: Number, required: true },
    received_quantity: { type: Number, required: true },
    accepted_quantity: { type: Number, required: true },
    rejected_quantity: { type: Number, default: 0 },
    rejection_reason: { type: String },
  },
  { _id: false }
);

const GRNSchema = new Schema<IGRN>(
  {
    grn_number: { type: String, required: true, unique: true, uppercase: true },
    purchase_order: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true },
    warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    received_date: { type: Date, default: Date.now },
    delivery_challan_no: { type: String },
    transporter: { type: String },
    vehicle_no: { type: String },
    items: [GRNItemSchema],
    inspected_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    notes: { type: String },
  },
  { timestamps: true }
);

export const GRN = mongoose.model<IGRN>('GRN', GRNSchema);
