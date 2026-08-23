// CRM Workflow Service - Barrel Exports

export {
  createLead,
  updateLeadStatus,
  convertLeadToDeal,
  convertLeadToCustomer,
  getLeadTimeline,
  bulkAssignLeads,
} from './leads';

export {
  createDeal,
  advanceDealStage,
  closeDeal,
  getDealTimeline,
  calculatePipelineValue,
} from './deals';

export {
  convertLeadToCustomer as convertLeadToCustomerWorkflow,
  convertDealToOrder,
} from './conversion';

export {
  createActivity,
  completeActivity,
  getUpcomingActivities,
  getActivityFeed,
  bulkCompleteActivities,
} from './activities';

export {
  scheduleFollowUp,
  getOverdueFollowUps,
  getFollowUpsByUser,
  autoScheduleFollowUp,
  snoozeFollowUp,
} from './followups';

export {
  calculateLeadScore,
  scoreAllLeads,
  getHotLeads,
} from './scoring';

export type {
  CreateLeadInput,
  UpdateLeadStatusInput,
  ConvertLeadToCustomerInput,
  ConvertLeadToDealInput,
  CreateDealInput,
  AdvanceDealStageInput,
  CloseDealInput,
  CreateActivityInput,
  CompleteActivityInput,
  ScheduleFollowUpInput,
  SnoozeFollowUpInput,
  LeadScoreBreakdown,
  FollowUpAutoConfig,
  ActivityFilters,
  PaginatedResponse,
  PipelineValueResult,
} from './types';
