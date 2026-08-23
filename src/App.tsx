import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';

// Lazy-loaded pages
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const Products = lazy(() => import('@/pages/inventory/Products'));
const ProductDetail = lazy(() => import('@/pages/inventory/ProductDetail'));
const Warehouses = lazy(() => import('@/pages/inventory/Warehouses'));
const StockMovements = lazy(() => import('@/pages/inventory/StockMovements'));
const Categories = lazy(() => import('@/pages/inventory/Categories'));
const Transfers = lazy(() => import('@/pages/inventory/Transfers'));
const Receiving = lazy(() => import('@/pages/inventory/Receiving'));
const Adjustments = lazy(() => import('@/pages/inventory/Adjustments'));
const LowStock = lazy(() => import('@/pages/inventory/LowStock'));
const Customers = lazy(() => import('@/pages/crm/Customers'));
const Leads = lazy(() => import('@/pages/crm/Leads'));
const Deals = lazy(() => import('@/pages/crm/Deals'));
const Activities = lazy(() => import('@/pages/crm/Activities'));
const FollowUps = lazy(() => import('@/pages/crm/FollowUps'));
const ConversionFunnel = lazy(() => import('@/pages/crm/ConversionFunnel'));
const Suppliers = lazy(() => import('@/pages/procurement/Suppliers'));
const PurchaseOrders = lazy(() => import('@/pages/procurement/PurchaseOrders'));
const SalesOrders = lazy(() => import('@/pages/sales/SalesOrders'));
const Invoices = lazy(() => import('@/pages/sales/Invoices'));
const Returns = lazy(() => import('@/pages/sales/Returns'));
const Payments = lazy(() => import('@/pages/sales/Payments'));
const Analytics = lazy(() => import('@/pages/reports/Analytics'));
const ExcelExport = lazy(() => import('@/pages/reports/ExcelExport'));
const AIAssistant = lazy(() => import('@/pages/ai/AIAssistant'));
const KnowledgeBase = lazy(() => import('@/pages/ai/KnowledgeBase'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const UsersPage = lazy(() => import('@/pages/settings/UsersPage'));
const RolesPage = lazy(() => import('@/pages/settings/RolesPage'));
const AuditLog = lazy(() => import('@/pages/settings/AuditLog'));
const Branches = lazy(() => import('@/pages/settings/Branches'));
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
          <Route index element={<ErrorBoundary><Dashboard /></ErrorBoundary>} />
          <Route path="inventory/products" element={<ErrorBoundary><Products /></ErrorBoundary>} />
          <Route path="inventory/products/:id" element={<ErrorBoundary><ProductDetail /></ErrorBoundary>} />
          <Route path="inventory/warehouses" element={<ErrorBoundary><Warehouses /></ErrorBoundary>} />
          <Route path="inventory/movements" element={<ErrorBoundary><StockMovements /></ErrorBoundary>} />
          <Route path="inventory/categories" element={<ErrorBoundary><Categories /></ErrorBoundary>} />
          <Route path="inventory/transfers" element={<ErrorBoundary><Transfers /></ErrorBoundary>} />
          <Route path="inventory/receiving" element={<ErrorBoundary><Receiving /></ErrorBoundary>} />
          <Route path="inventory/adjustments" element={<ErrorBoundary><Adjustments /></ErrorBoundary>} />
          <Route path="inventory/low-stock" element={<ErrorBoundary><LowStock /></ErrorBoundary>} />
          <Route path="crm/customers" element={<ErrorBoundary><Customers /></ErrorBoundary>} />
          <Route path="crm/leads" element={<ErrorBoundary><Leads /></ErrorBoundary>} />
          <Route path="crm/deals" element={<ErrorBoundary><Deals /></ErrorBoundary>} />
          <Route path="crm/activities" element={<ErrorBoundary><Activities /></ErrorBoundary>} />
          <Route path="crm/follow-ups" element={<ErrorBoundary><FollowUps /></ErrorBoundary>} />
          <Route path="crm/funnel" element={<ErrorBoundary><ConversionFunnel /></ErrorBoundary>} />
          <Route path="procurement/suppliers" element={<ErrorBoundary><Suppliers /></ErrorBoundary>} />
          <Route path="procurement/orders" element={<ErrorBoundary><PurchaseOrders /></ErrorBoundary>} />
          <Route path="sales/orders" element={<ErrorBoundary><SalesOrders /></ErrorBoundary>} />
          <Route path="sales/invoices" element={<ErrorBoundary><Invoices /></ErrorBoundary>} />
          <Route path="sales/returns" element={<ErrorBoundary><Returns /></ErrorBoundary>} />
          <Route path="sales/payments" element={<ErrorBoundary><Payments /></ErrorBoundary>} />
          <Route path="reports/analytics" element={<ErrorBoundary><Analytics /></ErrorBoundary>} />
          <Route path="reports/export" element={<ErrorBoundary><ExcelExport /></ErrorBoundary>} />
          <Route path="ai" element={<ErrorBoundary><AIAssistant /></ErrorBoundary>} />
          <Route path="ai/knowledge-base" element={<ErrorBoundary><KnowledgeBase /></ErrorBoundary>} />
          <Route path="settings" element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} />
          <Route path="settings/users" element={<ErrorBoundary><UsersPage /></ErrorBoundary>} />
          <Route path="settings/roles" element={<ErrorBoundary><RolesPage /></ErrorBoundary>} />
          <Route path="settings/audit-log" element={<ErrorBoundary><AuditLog /></ErrorBoundary>} />
          <Route path="settings/branches" element={<ErrorBoundary><Branches /></ErrorBoundary>} />
        </Route>

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}

export default App;
