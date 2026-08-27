import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  name: string;
  key: string;
  description: string;
  permissions: {
    module: string;
    create: boolean;
    read: boolean;
    update: boolean;
    delete: boolean;
  }[];
}

const RoleSchema = new Schema<IRole>(
  {
    name: { type: String, required: true },
    key: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    permissions: [
      {
        module: { type: String, required: true },
        create: { type: Boolean, default: false },
        read: { type: Boolean, default: true },
        update: { type: Boolean, default: false },
        delete: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

export const Role = mongoose.model<IRole>('Role', RoleSchema);
