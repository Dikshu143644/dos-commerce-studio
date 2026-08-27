import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password?: string;
  full_name: string;
  role: 'super_admin' | 'branch_manager' | 'sales_executive' | 'inventory_manager' | 'purchase_manager' | 'accountant' | 'warehouse_staff' | 'client' | 'viewer';
  branch?: mongoose.Types.ObjectId;
  company?: mongoose.Types.ObjectId;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  last_login_at?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, select: false },
    full_name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: [
        'super_admin',
        'branch_manager',
        'sales_executive',
        'inventory_manager',
        'purchase_manager',
        'accountant',
        'warehouse_staff',
        'client',
        'viewer',
      ],
      default: 'viewer',
    },
    branch: { type: Schema.Types.ObjectId, ref: 'Branch' },
    company: { type: Schema.Types.ObjectId, ref: 'Company' },
    phone: { type: String },
    avatar_url: { type: String },
    is_active: { type: Boolean, default: true },
    last_login_at: { type: Date },
  },
  { timestamps: true }
);

UserSchema.pre<IUser>('save', async function (this: IUser, next: (err?: Error) => void) {
  if (!this.isModified('password') || !this.password) return next();
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err as Error);
  }
});

UserSchema.methods.comparePassword = async function (this: IUser, candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

export const User = mongoose.model<IUser>('User', UserSchema);
