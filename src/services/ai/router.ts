import type { AgentType } from './types';

interface IntentResult {
  agentType: AgentType;
  confidence: number;
  keywords: string[];
}

const agentKeywords: Record<AgentType, string[]> = {
  inventory: [
    'stock', 'inventory', 'warehouse', 'product', 'sku', 'reorder',
    'low stock', 'quantity', 'movement', 'category', 'storage',
    'shelf', 'bin', 'count', 'audit stock', 'stocktake',
  ],
  sales: [
    'customer', 'lead', 'deal', 'pipeline', 'crm', 'sale', 'order',
    'revenue', 'conversion', 'prospect', 'opportunity', 'contact',
    'follow up', 'close', 'won', 'lost', 'quota',
  ],
  procurement: [
    'supplier', 'purchase order', 'po', 'vendor', 'procurement',
    'delivery', 'restock', 'buy', 'source', 'supply chain',
    'procurement', 'receiving', 'goods receipt',
  ],
  finance: [
    'revenue', 'profit', 'loss', 'expense', 'margin', 'cash flow',
    'invoice', 'payment', 'tax', 'gst', 'balance', 'financial',
    'p&l', 'budget', 'forecast', 'cost',
  ],
  excel: [
    'excel', 'spreadsheet', 'export', 'import', 'csv', 'xlsx',
    'report', 'template', 'download', 'upload', 'file',
    'data export', 'generate report',
  ],
  general: [
    'help', 'how to', 'navigate', 'feature', 'settings',
    'what can', 'guide', 'tutorial', 'explain',
  ],
};

export function analyzeIntent(message: string): IntentResult {
  const lower = message.toLowerCase();
  const scores: Record<AgentType, { score: number; matched: string[] }> = {
    inventory: { score: 0, matched: [] },
    sales: { score: 0, matched: [] },
    procurement: { score: 0, matched: [] },
    finance: { score: 0, matched: [] },
    excel: { score: 0, matched: [] },
    general: { score: 0, matched: [] },
  };

  for (const [agent, keywords] of Object.entries(agentKeywords)) {
    for (const keyword of keywords) {
      if (lower.includes(keyword)) {
        scores[agent as AgentType].score += keyword.split(' ').length;
        scores[agent as AgentType].matched.push(keyword);
      }
    }
  }

  const sorted = Object.entries(scores).sort(([, a], [, b]) => b.score - a.score);
  const [topAgent, topScore] = sorted[0];

  if (topScore.score === 0) {
    return { agentType: 'general', confidence: 0.5, keywords: [] };
  }

  const totalScore = sorted.reduce((sum, [, s]) => sum + s.score, 0);
  const confidence = totalScore > 0 ? topScore.score / totalScore : 0.5;

  return {
    agentType: topAgent as AgentType,
    confidence: Math.min(confidence, 1),
    keywords: topScore.matched,
  };
}
