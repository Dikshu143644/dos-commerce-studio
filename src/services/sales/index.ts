// Sales Workflow Service - Barrel Exports

export {
  createSalesOrder,
  confirmOrder,
  cancelOrder,
  getSalesOrderWithItems,
  calculateOrderTotals,
  duplicateOrder,
  getSalesOrders,
} from './orders';

export {
  processOrder,
  shipOrder,
  deliverOrder,
  getShipmentDetails,
} from './fulfillment';

export {
  generateInvoice,
  getInvoice,
  emailInvoice,
  getInvoiceHistory,
} from './invoices';

export {
  initiateReturn,
  approveReturn,
  getReturnHistory,
} from './returns';

export {
  recordPayment,
  getPaymentHistory,
  getOutstandingInvoices,
  calculateCustomerBalance,
} from './payments';

export type {
  CreateSalesOrderInput,
  CreateSalesOrderItemInput,
  ConfirmOrderInput,
  ShipOrderInput,
  DeliverOrderInput,
  CancelOrderInput,
  DuplicateOrderInput,
  InvoiceData,
  EmailInvoiceInput,
  RecordPaymentInput,
  InitiateReturnInput,
  ReturnItemInput,
  ApproveReturnInput,
  OrderTotals,
  StockAvailability,
  SalesOrderFilters,
  InvoiceFilters,
  PaymentFilters,
  ReturnFilters,
  PaginatedResponse,
} from './types';
