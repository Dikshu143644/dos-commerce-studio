import os
import json
import urllib.request
import urllib.error

PROJECT_REF = os.getenv("SUPABASE_PROJECT_REF", "dkypdrocnebusgdlndhn")
ACCESS_TOKEN = os.getenv("SUPABASE_ACCESS_TOKEN", "")
API_URL = f"https://api.supabase.com/v1/projects/{PROJECT_REF}/database/query"

def run_sql(query: str):
    req = urllib.request.Request(
        API_URL,
        data=json.dumps({"query": query}).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {ACCESS_TOKEN}",
            "Content-Type": "application/json",
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        },
        method="POST"
    )
    try:
        with urllib.request.urlopen(req) as resp:
            return resp.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        error_body = e.read().decode("utf-8")
        print(f"HTTP Error {e.code}: {error_body}")
        return None

SEED_SQL = """
-- Insert Default Roles
INSERT INTO roles (id, name, description, is_system, permissions) VALUES
('11111111-1111-1111-1111-111111111111', 'admin', 'Administrator with full system access', true, '{"all": true}')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description, is_system, permissions) VALUES
('22222222-2222-2222-2222-222222222222', 'manager', 'Operations and CRM manager', true, '{"inventory": true, "crm": true, "sales": true, "procurement": true, "reports": true}')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description, is_system, permissions) VALUES
('33333333-3333-3333-3333-333333333333', 'staff', 'Inventory and warehouse staff', true, '{"inventory": true, "sales_read": true}')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description, is_system, permissions) VALUES
('44444444-4444-4444-4444-444444444444', 'client', 'Client / Viewer access', true, '{"dashboard": true, "sales_orders": true, "invoices": true}')
ON CONFLICT (name) DO NOTHING;

INSERT INTO roles (id, name, description, is_system, permissions) VALUES
('55555555-5555-5555-5555-555555555555', 'viewer', 'Basic viewer access', true, '{"dashboard": true}')
ON CONFLICT (name) DO NOTHING;

-- Insert Default Branches
INSERT INTO branches (id, name, code, city, state, country, is_active) VALUES
('b1111111-1111-1111-1111-111111111111', 'Mumbai Central Hub', 'BR-MUM', 'Mumbai', 'Maharashtra', 'India', true),
('b2222222-2222-2222-2222-222222222222', 'Delhi Logistics Center', 'BR-DEL', 'New Delhi', 'Delhi', 'India', true),
('b3333333-3333-3333-3333-333333333333', 'Bengaluru Tech Warehouse', 'BR-BLR', 'Bengaluru', 'Karnataka', 'India', true)
ON CONFLICT (code) DO NOTHING;

-- Insert Default Warehouses
INSERT INTO warehouses (id, name, code, address, city, state, is_active) VALUES
('10000000-0000-0000-0000-000000000001', 'West Coast Warehouse', 'WH-MUM', 'Andheri East Industrial Zone', 'Mumbai', 'Maharashtra', true),
('10000000-0000-0000-0000-000000000002', 'North Hub Depot', 'WH-DEL', 'Okhla Phase III', 'New Delhi', 'Delhi', true),
('10000000-0000-0000-0000-000000000003', 'South Tech Center', 'WH-BLR', 'Electronic City Phase 1', 'Bengaluru', 'Karnataka', true)
ON CONFLICT (code) DO NOTHING;

-- Insert Categories
INSERT INTO categories (id, name, slug, description, sort_order) VALUES
('20000000-0000-0000-0000-000000000001', 'Electronics & PCB', 'electronics', 'Circuit boards, microcontrollers, and electronic modules', 1),
('20000000-0000-0000-0000-000000000002', 'Industrial Machinery & Parts', 'industrial-parts', 'Servo motors, precision bearings, and actuators', 2),
('20000000-0000-0000-0000-000000000003', 'Wiring & Connectors', 'wiring', 'Copper cables, PCB connectors, and harnesses', 3),
('20000000-0000-0000-0000-000000000004', 'Raw Materials', 'raw-materials', 'Aluminum sheets, structural alloys, and compounds', 4),
('20000000-0000-0000-0000-000000000005', 'Lighting & Optoelectronics', 'lighting', 'LED panels, optical sensors, and displays', 5)
ON CONFLICT (slug) DO NOTHING;

-- Insert Products
INSERT INTO products (id, name, sku, category_id, description, selling_price, purchase_price, reorder_point, image_url, is_active) VALUES
('30000000-0000-0000-0000-000000000001', 'Circuit Board Pro X1', 'PCB-PRO-001', '20000000-0000-0000-0000-000000000001', 'Multi-layer high frequency printed circuit board for edge computing and IoT gateway controllers', 125.00, 78.50, 25, '/images/products/circuit-board-pro.jpg', true),
('30000000-0000-0000-0000-000000000002', 'Industrial Servo Motor 750W', 'SRV-750W-002', '20000000-0000-0000-0000-000000000002', 'High-torque AC brushless servo motor with integrated 24-bit magnetic absolute encoder', 340.00, 210.00, 10, '/images/products/servo-motor.jpg', true),
('30000000-0000-0000-0000-000000000003', 'Copper Wire 2.5mm Reel (100m)', 'WIR-COP-250', '20000000-0000-0000-0000-000000000003', 'Pure oxygen-free electrolytic copper wire with double insulation for industrial automation', 88.00, 52.00, 30, '/images/products/copper-wire.jpg', true),
('30000000-0000-0000-0000-000000000004', 'Ultra-Bright LED Panel 60W', 'LED-PAN-60W', '20000000-0000-0000-0000-000000000005', 'Energy-efficient high CRI industrial cleanroom and factory LED lighting panel with PWM dimming', 65.00, 38.00, 15, '/images/products/led-panel.jpg', true),
('30000000-0000-0000-0000-000000000005', 'Precision Steel Bearings Set', 'BRG-STL-800', '20000000-0000-0000-0000-000000000002', 'ABEC-9 graded stainless steel deep groove ball bearings for high-RPM rotary machinery', 45.00, 24.00, 40, '/images/products/steel-bearings.jpg', true),
('30000000-0000-0000-0000-000000000006', 'Thermal Paste TG-7 Extreme', 'THM-PST-007', '20000000-0000-0000-0000-000000000001', 'High thermal conductivity 14.5 W/mK non-conductive thermal interface compound (50g)', 22.50, 11.00, 50, '/images/products/thermal-paste.jpg', true),
('30000000-0000-0000-0000-000000000007', 'PCB Terminal Connector 12-Pin', 'CON-PCB-12P', '20000000-0000-0000-0000-000000000003', 'Screwless push-in DIN-rail mountable terminal connector blocks with gold-plated pins', 15.00, 6.50, 100, '/images/products/pcb-connector.jpg', true),
('30000000-0000-0000-0000-000000000008', 'Anodized Aluminum Sheet 3mm', 'ALU-SHT-3MM', '20000000-0000-0000-0000-000000000004', '6061-T6 aerospace-grade brushed aluminum enclosure panel sheets (1000mm x 500mm)', 110.00, 68.00, 20, '/images/products/aluminum-sheet.jpg', true),
('30000000-0000-0000-0000-000000000009', 'Precision Resistor Pack 10K Ohm', 'RES-PCK-10K', '20000000-0000-0000-0000-000000000001', '0.1% tolerance thin-film surface mount resistors reel of 1000 pieces', 32.00, 14.00, 25, '/images/products/resistor-pack.jpg', true)
ON CONFLICT (sku) DO NOTHING;

-- Insert Inventory Levels
INSERT INTO inventory (product_id, warehouse_id, quantity, reserved_quantity) VALUES
('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 142, 12),
('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 38, 4),
('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 280, 20),
('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 95, 10),
('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 18, 5),
('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 115, 0),
('30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 450, 30),
('30000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000003', 64, 8),
('30000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000001', 82, 0)
ON CONFLICT (product_id, warehouse_id) DO NOTHING;

-- Insert Customers
INSERT INTO customers (id, company_name, contact_person, email, phone, customer_type, credit_limit, is_active) VALUES
('40000000-0000-0000-0000-000000000001', 'Apex Robotics Ltd', 'Rajiv Nair', 'procurement@apexrobotics.io', '+91 98201 12345', 'wholesale', 250000.00, true),
('40000000-0000-0000-0000-000000000002', 'TechVentures Enterprise', 'Sarah Johnson', 'orders@techventures.com', '+91 98111 23456', 'distributor', 500000.00, true),
('40000000-0000-0000-0000-000000000003', 'Quantum Dynamics Labs', 'Dr. Alok Verma', 'contact@quantumdynamics.org', '+91 98450 34567', 'regular', 100000.00, true)
ON CONFLICT (id) DO NOTHING;

-- Insert CRM Leads
INSERT INTO leads (id, company_name, contact_person, email, phone, status, source) VALUES
('50000000-0000-0000-0000-000000000001', 'Mehta Industries', 'Vikram Mehta', 'vikram@mehtaindustries.in', '+91 98765 43210', 'qualified', 'website'),
('50000000-0000-0000-0000-000000000002', 'GlobalTech Systems', 'Sarah Jenkins', 'sjenkins@globaltech.com', '+1 415 555 0199', 'proposal', 'referral'),
('50000000-0000-0000-0000-000000000003', 'SolarDrive Energy', 'Ananya Deshmukh', 'ananya@solardrive.co', '+91 98222 33445', 'negotiation', 'trade_show')
ON CONFLICT (id) DO NOTHING;

-- Insert Deals
INSERT INTO deals (id, title, customer_id, value, stage, probability, expected_close_date) VALUES
('60000000-0000-0000-0000-000000000001', '500-Unit Edge Controller Supply Contract', '40000000-0000-0000-0000-000000000001', 62500.00, 'negotiation', 85, CURRENT_DATE + 14),
('60000000-0000-0000-0000-000000000002', 'Factory Lighting Retrofit Q3', '40000000-0000-0000-0000-000000000002', 128000.00, 'proposal', 70, CURRENT_DATE + 21),
('60000000-0000-0000-0000-000000000003', 'Annual Industrial Bearings Framework', '40000000-0000-0000-0000-000000000003', 45000.00, 'closed_won', 100, CURRENT_DATE - 2)
ON CONFLICT (id) DO NOTHING;

-- Insert Suppliers
INSERT INTO suppliers (id, company_name, contact_person, email, phone, is_active) VALUES
('70000000-0000-0000-0000-000000000001', 'MicroChip & Semiconductor Tech Corp', 'David Chang', 'orders@microchiptech.corp', '+1 408 555 0142', true),
('70000000-0000-0000-0000-000000000002', 'Bharat Precision Motors Pvt Ltd', 'Rajesh Kulkarni', 'sales@bharatmotors.in', '+91 22 2847 8899', true),
('70000000-0000-0000-0000-000000000003', 'Indo-Copper Smelting & Wireworks', 'Suresh Patel', 'commercial@indocopper.com', '+91 265 233 4455', true)
ON CONFLICT (id) DO NOTHING;
"""

def main():
    print("Seeding demo data into Supabase...")
    res = run_sql(SEED_SQL)
    print("Seed result:", res)
    print("Verification of products:")
    prod_check = run_sql("SELECT name, sku, selling_price FROM products;")
    print("Products in Supabase:", prod_check)

if __name__ == "__main__":
    main()
