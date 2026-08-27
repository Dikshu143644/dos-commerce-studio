import mongoose, { Schema, Document } from 'mongoose';

export interface IKnowledgeBase extends Document {
  title: string;
  category: string;
  content: string;
  tags: string[];
  embedding_vector?: number[];
  is_published: boolean;
  author: mongoose.Types.ObjectId;
}

const KnowledgeBaseSchema = new Schema<IKnowledgeBase>(
  {
    title: { type: String, required: true, trim: true },
    category: { type: String, required: true },
    content: { type: String, required: true },
    tags: [{ type: String }],
    embedding_vector: [{ type: Number }],
    is_published: { type: Boolean, default: true },
    author: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

KnowledgeBaseSchema.index({ title: 'text', content: 'text', tags: 'text' });

export const KnowledgeBase = mongoose.model<IKnowledgeBase>('KnowledgeBase', KnowledgeBaseSchema);
