import mongoose, { Schema, Document } from 'mongoose';

export interface ISetting extends Document {
  key: string;
  value: any;
  category: 'general' | 'company' | 'finance' | 'inventory' | 'sales' | 'notifications';
  description?: string;
  is_public: boolean;
}

const SettingSchema = new Schema<ISetting>(
  {
    key: { type: String, required: true, unique: true, trim: true },
    value: { type: Schema.Types.Mixed, required: true },
    category: {
      type: String,
      enum: ['general', 'company', 'finance', 'inventory', 'sales', 'notifications'],
      default: 'general',
    },
    description: { type: String },
    is_public: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Setting = mongoose.model<ISetting>('Setting', SettingSchema);
