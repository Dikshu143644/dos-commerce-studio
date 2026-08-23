// Inventory Workflow Service - Barrel Exports

export {
  createMovement,
  getMovementHistory,
  getProductTraceability,
} from './movements';

export {
  initiateTransfer,
  approveTransfer,
  rejectTransfer,
  completeTransfer,
  getTransferHistory,
} from './transfers';

export {
  receiveItems,
  getReceivingHistory,
  createGoodsReceivedNote,
} from './receiving';

export {
  createAdjustment,
  getAdjustmentHistory,
} from './adjustments';

export {
  checkLowStock,
  generateAlerts,
  dismissAlert,
  getLowStockProducts,
} from './alerts';

export type {
  CreateMovementInput,
  TransferRequest,
  TransferRequestItem,
  TransferApproval,
  TransferRejection,
  TransferCompletion,
  ReceiveItemsInput,
  ReceiveItemDetail,
  CreateAdjustmentInput,
  LowStockAlert,
  MovementHistoryFilters,
  TransferFilters,
  AdjustmentFilters,
  GRNInput,
  PaginatedResponse,
} from './types';
