import { supabase } from '@/lib/supabase';
import type { Customer, SalesOrder } from '@/types/database';
import type { ConvertLeadToCustomerInput } from './types';

/**
 * Full workflow to convert a lead into a customer:
 * 1. Create customer record from lead data (company, contact, email, phone)
 * 2. Update lead.converted_customer_id
 * 3. Update lead status to 'won'
 * 4. Create activity log entry "Lead converted to customer"
 * 5. Create notification for sales manager
 * 6. Return the new customer
 */
export async function convertLeadToCustomer(
  input: ConvertLeadToCustomerInput
): Promise<Customer> {
  // 1. Fetch the lead
  const { data: lead, error: leadError } = await supabase
    .from('leads')
    .select('*')
    .eq('id', input.lead_id)
    .single();

  if (leadError || !lead) {
    throw new Error(`Lead not found: ${input.lead_id}`);
  }

  // 2. Create customer record from lead data
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .insert({
      name: lead.name as string,
      email: (lead.email as string) ?? null,
      phone: (lead.phone as string) ?? null,
      company: (lead.company as string) ?? null,
      customer_type: input.customer_type ?? 'regular',
      notes: `Converted from lead. Original source: ${lead.source as string}`,
      total_orders: 0,
      total_spent: 0,
      is_active: true,
    })
    .select()
    .single();

  if (customerError) {
    throw new Error(`Failed to create customer from lead: ${customerError.message}`);
  }

  // 3. Update lead.converted_customer_id and status to 'won'
  const { error: updateLeadError } = await supabase
    .from('leads')
    .update({
      converted_customer_id: customer.id,
      status: 'won',
      updated_at: new Date().toISOString(),
    })
    .eq('id', input.lead_id);

  if (updateLeadError) {
    throw new Error(`Failed to update lead conversion: ${updateLeadError.message}`);
  }

  // 4. Create activity log entry
  await supabase.from('crm_activities').insert({
    activity_type: 'note',
    title: 'Lead converted to customer',
    description: `Lead "${lead.name as string}" has been converted to customer "${customer.name as string}"`,
    lead_id: input.lead_id,
    customer_id: customer.id,
    performed_by: input.performed_by,
  });

  // 5. Create notification for sales manager
  await supabase.from('notifications').insert({
    user_id: input.performed_by,
    type: 'success',
    title: 'Lead Converted',
    message: `Lead "${lead.name as string}" has been successfully converted to a customer.`,
    is_read: false,
  });

  // 6. Return the new customer
  return customer as Customer;
}

/**
 * Converts a won deal to a draft sales order:
 * 1. Create draft sales order linked to customer
 * 2. Update deal.won_at timestamp
 * 3. Create activity "Deal won - Sales order created"
 * 4. Send notification to warehouse team
 * 5. Return draft sales order
 */
export async function convertDealToOrder(
  dealId: string,
  performedBy: string
): Promise<SalesOrder> {
  // Fetch the deal
  const { data: deal, error: dealError } = await supabase
    .from('deals')
    .select('*')
    .eq('id', dealId)
    .single();

  if (dealError || !deal) {
    throw new Error(`Deal not found: ${dealId}`);
  }

  if (!deal.customer_id) {
    throw new Error('Deal must be linked to a customer before creating a sales order');
  }

  // Generate an order number
  const orderNumber = `SO-${Date.now().toString(36).toUpperCase()}`;

  // 1. Create draft sales order linked to customer
  const { data: salesOrder, error: orderError } = await supabase
    .from('sales_orders')
    .insert({
      order_number: orderNumber,
      customer_id: deal.customer_id as string,
      status: 'draft',
      order_date: new Date().toISOString().split('T')[0],
      total_amount: deal.value as number,
      tax_amount: 0,
      discount_amount: 0,
      notes: `Created from deal: ${deal.title as string}`,
      created_by: performedBy,
    })
    .select()
    .single();

  if (orderError) {
    throw new Error(`Failed to create sales order: ${orderError.message}`);
  }

  // 2. Update deal.won_at and link the sales order
  const { error: updateDealError } = await supabase
    .from('deals')
    .update({
      won_at: new Date().toISOString(),
      sales_order_id: salesOrder.id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', dealId);

  if (updateDealError) {
    throw new Error(`Failed to update deal: ${updateDealError.message}`);
  }

  // 3. Create activity log
  await supabase.from('crm_activities').insert({
    activity_type: 'note',
    title: 'Deal won - Sales order created',
    description: `Sales order ${orderNumber} created from deal "${deal.title as string}"`,
    deal_id: dealId,
    customer_id: deal.customer_id as string,
    performed_by: performedBy,
  });

  // 4. Send notification to warehouse team (notifies the performer in this case)
  await supabase.from('notifications').insert({
    user_id: performedBy,
    type: 'info',
    title: 'New Sales Order Created',
    message: `A new sales order ${orderNumber} has been created from deal "${deal.title as string}". Please prepare for fulfillment.`,
    is_read: false,
  });

  // 5. Return draft sales order
  return salesOrder as SalesOrder;
}
