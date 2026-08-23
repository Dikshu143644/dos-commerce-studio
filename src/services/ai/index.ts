export type { Message, Conversation, AgentType, AIProvider, AgentConfig, Tool } from './types';
export { inventoryAgent } from './agents/inventory';
export { salesAgent } from './agents/sales';
export { procurementAgent } from './agents/procurement';
export { financeAgent } from './agents/finance';
export { excelAgent } from './agents/excel';
export { generalAgent } from './agents/general';
export { chatWithFallback } from './providers';
export type { StreamCallbacks } from './providers';
export { streamChat } from './streaming';
export type { StreamOptions, StreamCompleteEvent } from './streaming';
export { analyzeIntent } from './router';

import type { AgentConfig, AgentType } from './types';
import { inventoryAgent } from './agents/inventory';
import { salesAgent } from './agents/sales';
import { procurementAgent } from './agents/procurement';
import { financeAgent } from './agents/finance';
import { excelAgent } from './agents/excel';
import { generalAgent } from './agents/general';

const agents: Record<AgentType, AgentConfig> = {
  inventory: inventoryAgent,
  sales: salesAgent,
  procurement: procurementAgent,
  finance: financeAgent,
  excel: excelAgent,
  general: generalAgent,
};

export function getAgent(type: AgentType): AgentConfig {
  return agents[type];
}

export function getAllAgents(): AgentConfig[] {
  return Object.values(agents);
}

export function createAIService() {
  return {
    getAgent,
    getAllAgents,
    agents,
  };
}
