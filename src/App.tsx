import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';

// Lazy-loaded pages
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Products = lazy(() => import('@/pages/inventory/Products'));
const ProductDetail = lazy(() => import('@/pages/inventory/ProductDetail'));
const Warehouses = lazy(() => import('@/pages/inventory/Warehouses'));
const StockMovements = lazy(() => import('@/pages/inventory/StockMovements'));
const Categories = lazy(() => import('@/pages/inventory/Categories'));
const Customers = lazy(() => import('@/pages/crm/Customers'));
const Leads = lazy(() => import('@/pages/crm/Leads'));
const Deals = lazy(() => import('@/pages/crm/Deals'));
const Activities = lazy(() => import('@/pages/crm/Activities'));
const Suppliers = lazy(() => import('@/pages/procurement/Suppliers'));
const PurchaseOrders = lazy(() => import('@/pages/procurement/PurchaseOrders'));
const SalesOrders = lazy(() => import('@/pages/sales/SalesOrders'));
const Invoices = lazy(() => import('@/pages/sales/Invoices'));
const Analytics = lazy(() => import('@/pages/reports/Analytics'));
const ExcelExport = lazy(() => import('@/pages/reports/ExcelExport'));
const AIAssistant = lazy(() => import('@/pages/ai/AIAssistant'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const UsersPage = lazy(() => import('@/pages/settings/UsersPage'));
const RolesPage = lazy(() => import('@/pages/settings/RolesPage'));
const AuditLog = lazy(() => import('@/pages/settings/AuditLog'));
const Login = lazy(() => import('@/pages/auth/Login'));
const Register = lazy(() => import('@/pages/auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword'));
const NotFound = lazy(() => import('@/pages/NotFound'));

function App() {
  return (
    <Suspense fallback={<LoadingSkeleton />}>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Protected routes */}
        <Route
          element={
            <AuthGuard>
              <AppShell />
            </AuthGuard>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="inventory/products" element={<Products />} />
          <Route path="inventory/products/:id" element={<ProductDetail />} />
          <Route path="inventory/warehouses" element={<Warehouses />} />
          <Route path="inventory/movements" element={<StockMovements />} />
          <Route path="inventory/categories" element={<Categories />} />
          <Route path="crm/customers" element={<Customers />} />
          <Route path="crm/leads" element={<Leads />} />
          <Route path="crm/deals" element={<Deals />} />
          <Route path="crm/activities" element={<Activities />} />
          <Route path="procurement/suppliers" element={<Suppliers />} />
          <Route path="procurement/orders" element={<PurchaseOrders />} />
          <Route path="sales/orders" element={<SalesOrders />} />
          <Route path="sales/invoices" element={<Invoices />} />
          <Route path="reports/analytics" element={<Analytics />} />
          <Route path="reports/export" element={<ExcelExport />} />
          <Route path="ai" element={<AIAssistant />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="settings/users" element={<UsersPage />} />
          <Route path="settings/roles" element={<RolesPage />} />
          <Route path="settings/audit-log" element={<AuditLog />} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
