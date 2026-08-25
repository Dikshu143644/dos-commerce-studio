import * as XLSX from 'xlsx';

export interface ExcelExportRow {
  [key: string]: string | number | boolean | null | undefined;
}

export function generateAndDownloadExcel(filename: string, sheetName: string, data: ExcelExportRow[]) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export const sampleDatasets = {
  stock: [
    { SKU: 'PCB-PRO-001', Name: 'Circuit Board Pro X1', Category: 'Electronics', Warehouse: 'WH-MUM', Stock: 142, ReorderPoint: 25, CostPrice: 85.0, SellingPrice: 125.0, Status: 'Healthy' },
    { SKU: 'SRV-750W-002', Name: 'Industrial Servo Motor 750W', Category: 'Industrial Parts', Warehouse: 'WH-DEL', Stock: 38, ReorderPoint: 10, CostPrice: 240.0, SellingPrice: 340.0, Status: 'Healthy' },
    { SKU: 'WIR-COP-250', Name: 'Copper Wire 2.5mm Reel', Category: 'Raw Materials', Warehouse: 'WH-BLR', Stock: 280, ReorderPoint: 30, CostPrice: 55.0, SellingPrice: 88.0, Status: 'Healthy' },
    { SKU: 'LED-PAN-60W', Name: 'Ultra-Bright LED Panel 60W', Category: 'Electronics', Warehouse: 'WH-MUM', Stock: 95, ReorderPoint: 15, CostPrice: 42.0, SellingPrice: 65.0, Status: 'Healthy' },
    { SKU: 'BRG-STL-800', Name: 'Precision Steel Bearings Set', Category: 'Industrial Parts', Warehouse: 'WH-KOL', Stock: 18, ReorderPoint: 40, CostPrice: 28.0, SellingPrice: 45.0, Status: 'Critical Low' },
    { SKU: 'THM-PST-007', Name: 'Thermal Paste TG-7 Extreme', Category: 'Electronics', Warehouse: 'WH-MUM', Stock: 115, ReorderPoint: 50, CostPrice: 12.0, SellingPrice: 22.5, Status: 'Healthy' },
    { SKU: 'CON-PCB-12P', Name: 'PCB Terminal Connector 12-Pin', Category: 'Wiring', Warehouse: 'WH-DEL', Stock: 450, ReorderPoint: 100, CostPrice: 8.5, SellingPrice: 15.0, Status: 'Healthy' },
    { SKU: 'ALU-SHT-3MM', Name: 'Anodized Aluminum Sheet 3mm', Category: 'Raw Materials', Warehouse: 'WH-BLR', Stock: 64, ReorderPoint: 20, CostPrice: 75.0, SellingPrice: 110.0, Status: 'Healthy' },
    { SKU: 'RES-PCK-10K', Name: 'Precision Resistor Pack 10K Ohm', Category: 'Electronics', Warehouse: 'WH-MUM', Stock: 82, ReorderPoint: 25, CostPrice: 18.0, SellingPrice: 32.0, Status: 'Healthy' },
  ],
  purchase: [
    { PONumber: 'PO-2026-089', Supplier: 'MicroChip Global Ltd', Items: 4, TotalAmount: 18500.0, OrderDate: '2024-12-14', ExpectedDelivery: '2024-12-22', Status: 'In Transit' },
    { PONumber: 'PO-2026-092', Supplier: 'Apex Automation Corp', Items: 2, TotalAmount: 34000.0, OrderDate: '2024-12-16', ExpectedDelivery: '2024-12-24', Status: 'Confirmed' },
    { PONumber: 'PO-2026-088', Supplier: 'ElectroWire Supply Co', Items: 8, TotalAmount: 12450.0, OrderDate: '2024-12-10', ExpectedDelivery: '2024-12-18', Status: 'Received' },
  ],
  sales: [
    { OrderID: 'SO-2026-104', Customer: 'TechVentures Inc.', Date: '2024-12-18', ProductsCount: 5, Subtotal: 58400.0, Tax: 10512.0, Total: 68912.0, PaymentStatus: 'Paid' },
    { OrderID: 'SO-2026-105', Customer: 'Apex Automation Systems', Date: '2024-12-17', ProductsCount: 3, Subtotal: 128000.0, Tax: 23040.0, Total: 151040.0, PaymentStatus: 'Pending' },
    { OrderID: 'SO-2026-106', Customer: 'GlobalTech Solutions', Date: '2024-12-16', ProductsCount: 2, Subtotal: 45000.0, Tax: 8100.0, Total: 53100.0, PaymentStatus: 'Paid' },
  ],
  customers: [
    { CustomerName: 'TechVentures Inc.', ContactPerson: 'Rajesh Kumar', Email: 'rajesh@techventures.io', Phone: '+91 98201 11223', City: 'Mumbai', TotalOrders: 14, TotalSpent: 284500.0, Status: 'Active VIP' },
    { CustomerName: 'Apex Automation Systems', ContactPerson: 'Priya Sharma', Email: 'priya@apexauto.in', Phone: '+91 98112 33445', City: 'Bangalore', TotalOrders: 9, TotalSpent: 420000.0, Status: 'Active' },
    { CustomerName: 'GlobalTech Solutions', ContactPerson: 'Amit Patel', Email: 'amit@globaltech.com', Phone: '+91 98450 55667', City: 'Delhi', TotalOrders: 22, TotalSpent: 690000.0, Status: 'Active VIP' },
  ],
  valuation: [
    { Category: 'Electronics', SKUCount: 4, TotalUnits: 434, CostValuation: 48620.0, RetailValuation: 75210.0, UnrealizedMargin: 26590.0, MarginPercent: '54.7%' },
    { Category: 'Industrial Parts', SKUCount: 2, TotalUnits: 56, CostValuation: 9624.0, RetailValuation: 13730.0, UnrealizedMargin: 4106.0, MarginPercent: '42.7%' },
    { Category: 'Raw Materials', SKUCount: 2, TotalUnits: 344, CostValuation: 20200.0, RetailValuation: 31680.0, UnrealizedMargin: 11480.0, MarginPercent: '56.8%' },
    { Category: 'Wiring', SKUCount: 1, TotalUnits: 450, CostValuation: 3825.0, RetailValuation: 6750.0, UnrealizedMargin: 2925.0, MarginPercent: '76.5%' },
  ],
};
