import mongoose, { Schema, Document } from 'mongoose';

export interface ITrackingEvent {
  status_title: string;
  location: string;
  description: string;
  timestamp: Date;
  completed: boolean;
}

export interface IOrderTracking extends Document {
  sales_order: mongoose.Types.ObjectId;
  order_number: string;
  awb_number: string;
  courier_partner: string;
  current_status: 'confirmed' | 'packed' | 'in_transit' | 'out_for_delivery' | 'delivered';
  destination_city: string;
  origin_warehouse: mongoose.Types.ObjectId;
  estimated_delivery?: Date;
  timeline: ITrackingEvent[];
}

const TrackingEventSchema = new Schema<ITrackingEvent>(
  {
    status_title: { type: String, required: true },
    location: { type: String, required: true },
    description: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    completed: { type: Boolean, default: true },
  },
  { _id: false }
);

const OrderTrackingSchema = new Schema<IOrderTracking>(
  {
    sales_order: { type: Schema.Types.ObjectId, ref: 'SalesOrder', required: true },
    order_number: { type: String, required: true, unique: true },
    awb_number: { type: String, required: true },
    courier_partner: { type: String, default: 'BlueDart Express' },
    current_status: {
      type: String,
      enum: ['confirmed', 'packed', 'in_transit', 'out_for_delivery', 'delivered'],
      default: 'in_transit',
    },
    destination_city: { type: String, required: true },
    origin_warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    estimated_delivery: { type: Date },
    timeline: [TrackingEventSchema],
  },
  { timestamps: true }
);

export const OrderTracking = mongoose.model<IOrderTracking>('OrderTracking', OrderTrackingSchema);
