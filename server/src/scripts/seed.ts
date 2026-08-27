import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { User } from '../models/User.js';
import { Company } from '../models/Company.js';
import { Branch } from '../models/Branch.js';
import { Role } from '../models/Role.js';
import { Category } from '../models/Category.js';
import { Product } from '../models/Product.js';
import { Warehouse } from '../models/Warehouse.js';
import { Inventory } from '../models/Inventory.js';
import { Supplier } from '../models/Supplier.js';
import { Customer } from '../models/Customer.js';
import { Lead } from '../models/Lead.js';
import { Deal } from '../models/Deal.js';
import { Quotation } from '../models/Quotation.js';
import { SalesOrder } from '../models/SalesOrder.js';
import { Invoice } from '../models/Invoice.js';
import { Expense } from '../models/Expense.js';

async function seed() {
  console.log('🌱 Starting StockFlow Enterprise Database Seeding...');
  await mongoose.connect(env.MONGODB_URI);

  // Clear existing
  await Promise.all([
    User.deleteMany({}),
    Company.deleteMany({}),
    Branch.deleteMany({}),
    Role.deleteMany({}),
    Category.deleteMany({}),
    Product.deleteMany({}),
    Warehouse.deleteMany({}),
    Inventory.deleteMany({}),
    Supplier.deleteMany({}),
    Customer.deleteMany({}),
    Lead.deleteMany({}),
    Deal.deleteMany({}),
    Quotation.deleteMany({}),
    SalesOrder.deleteMany({}),
    Invoice.deleteMany({}),
    Expense.deleteMany({}),
  ]);

  // 1. Company
  const company = await Company.create({
    name: 'StockFlow Enterprises Pvt Ltd',
    legal_name: 'StockFlow Multi-Warehouse Logistics & Components Ltd',
    gstin: '27AABCS1429B1Z8',
    pan: 'AABCS1429B',
    email: 'contact@stockflow.com',
    phone: '+91 22 4920 1800',
    address: 'Tower 4, Bandra Kurla Complex, Mumbai, Maharashtra 400051',
    currency: 'INR',
  });

  // 2. Branches
  const mumbaiBranch = await Branch.create({
    name: 'Mumbai Central Headquarters',
    code: 'BR-MUM',
    company: company._id,
    location: 'Mumbai, Maharashtra',
    address: 'BKC Commercial Hub, Mumbai 400051',
    phone: '+91 22 4920 1801',
  });

  const delhiBranch = await Branch.create({
    name: 'Delhi Northern Logistics Hub',
    code: 'BR-DEL',
    company: company._id,
    location: 'Gurugram, NCR',
    address: 'Cyber City Sector 29, Gurugram 122002',
    phone: '+91 124 4920 1802',
  });

  // 3. Roles
  await Role.create([
    { name: 'Super Admin', key: 'super_admin', description: 'Full root access to all modules and configurations' },
    { name: 'Branch Manager', key: 'branch_manager', description: 'Manages branch operations, stock, and local sales' },
    { name: 'Sales Executive', key: 'sales_executive', description: 'Handles leads, deals, quotations, and sales orders' },
    { name: 'Inventory Manager', key: 'inventory_manager', description: 'Supervises warehouse stock, receiving, and transfers' },
    { name: 'Accountant', key: 'accountant', description: 'Manages expenses, invoices, P&L, GST compliance, and cash flow' },
    { name: 'Client', key: 'client', description: 'External B2B buyer portal access' },
  ]);

  // 4. Users
  const adminUser = await User.create({
    email: 'admin@stockflow.com',
    password: 'password123',
    full_name: 'Admin User',
    role: 'super_admin',
    branch: mumbaiBranch._id,
    company: company._id,
  });

  await User.create([
    {
      email: 'manager@stockflow.com',
      password: 'password123',
      full_name: 'Rahul Verma (Manager)',
      role: 'branch_manager',
      branch: mumbaiBranch._id,
      company: company._id,
    },
    {
      email: 'accountant@stockflow.com',
      password: 'password123',
      full_name: 'Ananya Roy (Accountant)',
      role: 'accountant',
      branch: mumbaiBranch._id,
      company: company._id,
    },
    {
      email: 'buyer@apexindustrial.in',
      password: 'password123',
      full_name: 'Rajesh Sharma (Apex Industrial)',
      role: 'client',
      company: company._id,
    },
  ]);

  // 5. Categories
  const catElectronics = await Category.create({ name: 'Electronics', slug: 'electronics', description: 'PCBs and semiconductors' });
  const catIndustrial = await Category.create({ name: 'Industrial Parts', slug: 'industrial-parts', description: 'Motors, bearings & actuators' });
  const catRawMaterials = await Category.create({ name: 'Raw Materials', slug: 'raw-materials', description: 'Copper, aluminum sheets' });

  // 6. Warehouses
  const whMum = await Warehouse.create({
    code: 'WH-MUM',
    name: 'Mumbai Central Logistics Hub',
    branch: mumbaiBranch._id,
    location: 'Bhiwandi Sector 4, Mumbai',
    capacity_sqft: 45000,
  });

  const whDel = await Warehouse.create({
    code: 'WH-DEL',
    name: 'Delhi Northern Distribution Centre',
    branch: delhiBranch._id,
    location: 'Manesar Logistics Park, Gurugram',
    capacity_sqft: 35000,
  });

  // 7. Products & Inventory
  const products = [
    {
      sku: 'PCB-PRO-001',
      name: 'Circuit Board Pro X1',
      category: catElectronics._id,
      cost_price: 95,
      selling_price: 125,
      hsn_code: '8534',
      unit: 'PCS',
      min_order_qty: 5,
      reorder_level: 25,
    },
    {
      sku: 'SRV-750W-002',
      name: 'Industrial Servo Motor 750W',
      category: catIndustrial._id,
      cost_price: 260,
      selling_price: 340,
      hsn_code: '8501',
      unit: 'PCS',
      min_order_qty: 1,
      reorder_level: 10,
    },
    {
      sku: 'WIR-COP-250',
      name: 'Copper Wire 2.5mm Reel (100m)',
      category: catRawMaterials._id,
      cost_price: 68,
      selling_price: 88,
      hsn_code: '7408',
      unit: 'REEL',
      min_order_qty: 2,
      reorder_level: 40,
    },
  ];

  for (const prodData of products) {
    const p = await Product.create(prodData);
    await Inventory.create({
      product: p._id,
      warehouse: whMum._id,
      quantity: 120,
      reserved_quantity: 15,
      bin_location: 'A-12-04',
    });
    await Inventory.create({
      product: p._id,
      warehouse: whDel._id,
      quantity: 85,
      reserved_quantity: 5,
      bin_location: 'B-04-01',
    });
  }

  // 8. Suppliers
  await Supplier.create([
    {
      name: 'MicroChip Semiconductor Supplies Ltd',
      code: 'SUP-0001',
      contact_person: 'David Chen',
      email: 'orders@microchipsupplies.com',
      phone: '+91 22 8849 2011',
      address: 'Electronics Zone, SEZ, Navi Mumbai',
      city: 'Navi Mumbai',
      payment_terms_days: 45,
      rating: 4.8,
    },
    {
      name: 'Apex Precision Metallurgy Ltd',
      code: 'SUP-0002',
      contact_person: 'Harish Mehta',
      email: 'sales@apexmetallurgy.in',
      phone: '+91 20 4492 1199',
      address: 'MIDC Bhosari, Pune',
      city: 'Pune',
      payment_terms_days: 30,
      rating: 4.6,
    },
  ]);

  // 9. Customers
  const customerApex = await Customer.create({
    company_name: 'Apex Industrial Solutions',
    code: 'CUST-0001',
    customer_type: 'enterprise',
    email: 'procurement@apexindustrial.in',
    phone: '+91 80 4920 1888',
    gstin: '29AABCA8849K1ZZ',
    billing_address: 'Plot 42, Sector 8, Whitefield Tech Park, Bangalore 560066',
    shipping_address: 'Plot 42, Sector 8, Whitefield Tech Park, Bangalore 560066',
    city: 'Bangalore',
    state: 'Karnataka',
    credit_limit: 500000,
    payment_terms_days: 30,
    assigned_to: adminUser._id,
  });

  // 10. Quotations
  await Quotation.create({
    quotation_number: 'QT-2026-001',
    customer: customerApex._id,
    customer_name: 'Rajesh Sharma',
    customer_company: 'Apex Industrial Solutions',
    customer_email: 'rajesh@apexindustrial.in',
    status: 'sent',
    issue_date: new Date(),
    expiry_date: new Date(Date.now() + 15 * 86400000),
    items: [
      { description: 'Industrial Servo Motor 750W', quantity: 10, unit_price: 340, tax_rate: 18, amount: 3400 },
      { description: 'Precision Steel Bearings Set', quantity: 25, unit_price: 45, tax_rate: 18, amount: 1125 },
    ],
    subtotal: 4525,
    tax_total: 814.5,
    discount: 225,
    total_amount: 5114.5,
    created_by: adminUser._id,
  });

  // 11. Expenses
  await Expense.create([
    {
      expense_number: 'EXP-2026-0001',
      title: 'Central Hub Monthly Facility Lease',
      category: 'Warehouse Rent',
      amount: 145000,
      date: new Date(),
      payment_method: 'bank_transfer',
      vendor: 'Bandra Realty Holdings',
      status: 'approved',
      recorded_by: adminUser._id,
    },
    {
      expense_number: 'EXP-2026-0002',
      title: 'Inter-City Freight Transit (MUM to DEL)',
      category: 'Logistics & Freight',
      amount: 48500,
      date: new Date(),
      payment_method: 'corporate_card',
      vendor: 'BlueDart Express Logistics',
      status: 'approved',
      recorded_by: adminUser._id,
    },
  ]);

  console.log('✅ StockFlow Database Seeding Completed Successfully!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seeding Error:', err);
  process.exit(1);
});
