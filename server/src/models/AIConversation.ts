import mongoose, { Schema, Document } from 'mongoose';

export interface IAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  agent_type?: string;
  timestamp: Date;
}

export interface IAIConversation extends Document {
  user: mongoose.Types.ObjectId;
  agent_type: 'inventory' | 'sales' | 'procurement' | 'finance' | 'excel' | 'general';
  title: string;
  messages: IAIMessage[];
}

const AIMessageSchema = new Schema<IAIMessage>(
  {
    role: { type: String, enum: ['user', 'assistant', 'system'], required: true },
    content: { type: String, required: true },
    agent_type: { type: String },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: false }
);

const AIConversationSchema = new Schema<IAIConversation>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    agent_type: {
      type: String,
      enum: ['inventory', 'sales', 'procurement', 'finance', 'excel', 'general'],
      default: 'general',
    },
    title: { type: String, default: 'New Conversation' },
    messages: [AIMessageSchema],
  },
  { timestamps: true }
);

export const AIConversation = mongoose.model<IAIConversation>('AIConversation', AIConversationSchema);
