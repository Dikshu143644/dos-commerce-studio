export type {
  KnowledgeEntry,
  ToolExecution,
  ContextCache,
  RAGContext,
  ToolDefinition,
  ToolResult,
  QueryResult,
  EmbeddingResult,
} from './types';

export { generateEmbedding, batchEmbeddings, cosineSimilarity } from './embeddings';

export {
  addKnowledgeEntry,
  searchKnowledge,
  updateEntry,
  deleteEntry,
  seedDefaultKnowledge,
} from './knowledge-base';

export {
  buildInventoryContext,
  buildSalesContext,
  buildProcurementContext,
  buildFinanceContext,
  buildCRMContext,
} from './context-builder';

export { executeTool, toolDefinitions } from './tools-executor';

export { processQuery, getAvailableTools } from './query-engine';
