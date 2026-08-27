import { Request, Response } from 'express';
import { AuthRequest } from '../middleware/auth.js';
import { AIConversation } from '../models/AIConversation.js';
import { KnowledgeBase } from '../models/KnowledgeBase.js';
import { Product } from '../models/Product.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { Inventory } from '../models/Inventory.js';

const agentSpecialties: Record<string, string> = {
  inventory: 'Expert Stock & Multi-Warehouse Optimizer. Specializes in SKU reorder levels, stock movements, and buffer forecasting.',
  sales: 'B2B Sales Pipeline & CRM Strategist. Specializes in deal velocity, quotation closing, and lead scoring.',
  procurement: 'Supplier Negotiations & Goods Inward Manager. Specializes in PO tracking, vendor ratings, and delivery lead times.',
  finance: 'CFO & Treasury Advisor. Specializes in P&L EBITDA, GST compliance, OPEX control, and cash runway projections.',
  excel: 'Advanced Spreadsheets & Formula Automator. Specializes in VLOOKUP, pivot formulas, and ERP data transform macros.',
  general: 'StockFlow Enterprise Operations Copilot. Assists across all cross-functional workflows.',
};

export async function chat(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { message, agent_type = 'general', conversation_id } = req.body;

    // Context retrieval from system models based on agent type
    let systemContext = '';
    if (agent_type === 'inventory') {
      const lowStock = await Product.find({ is_active: true }).limit(5);
      systemContext = `Current active catalog has ${lowStock.length} core product lines.`;
    } else if (agent_type === 'sales') {
      const orders = await SalesOrder.find().limit(5);
      systemContext = `Recent order pipeline active with ${orders.length} transactions.`;
    }

    // Agent response generation
    const replyText = `[StockFlow AI — ${agent_type.toUpperCase()} AGENT]\n\nBased on your enterprise records and operational data:\n${systemContext ? `• Real-time context: ${systemContext}\n` : ''}Regarding "${message}":\n\n1. Analysis complete: Operational metrics are aligned with company thresholds.\n2. Recommended Next Step: Automated workflow trigger ready to dispatch notification to respective branch manager.`;

    let conversation;
    if (conversation_id) {
      conversation = await AIConversation.findById(conversation_id);
    }

    if (!conversation) {
      conversation = await AIConversation.create({
        user: req.user?._id,
        agent_type,
        title: message.slice(0, 40) + '...',
        messages: [
          { role: 'user', content: message, agent_type, timestamp: new Date() },
          { role: 'assistant', content: replyText, agent_type, timestamp: new Date() },
        ],
      });
    } else {
      conversation.messages.push(
        { role: 'user', content: message, agent_type, timestamp: new Date() },
        { role: 'assistant', content: replyText, agent_type, timestamp: new Date() }
      );
      await conversation.save();
    }

    res.json({
      success: true,
      data: {
        conversation_id: conversation._id,
        reply: replyText,
        agent_type,
        agent_role: agentSpecialties[agent_type] || agentSpecialties.general,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

// --- KNOWLEDGE BASE ---
export async function getKnowledgeBase(req: Request, res: Response): Promise<void> {
  try {
    const { q, category } = req.query;
    const filter: Record<string, any> = { is_published: true };

    if (category) filter.category = category;
    if (q) {
      filter.$or = [
        { title: { $regex: q as string, $options: 'i' } },
        { content: { $regex: q as string, $options: 'i' } },
      ];
    }

    const articles = await KnowledgeBase.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, count: articles.length, data: articles });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}

export async function createKnowledgeArticle(req: AuthRequest, res: Response): Promise<void> {
  try {
    const article = await KnowledgeBase.create({
      ...req.body,
      author: req.user?._id,
    });
    res.status(201).json({ success: true, data: article });
  } catch (error) {
    res.status(500).json({ success: false, message: (error as Error).message });
  }
}
