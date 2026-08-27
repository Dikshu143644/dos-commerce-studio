import { useEffect } from 'react';
import { Check } from 'lucide-react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { HomePage, ShopPage, ProductDetailPage, CartPage, CheckoutPage, OrderSuccessPage } from './pages/StorefrontPages';
import { AccountPage, AuthPage, OrderTrackingPage } from './pages/AccountPages';
import { AdminDashboardPage, AIAssistantPage, CRMLeadsPage, InventoryPage } from './pages/AdminPages';
import { useCommerce } from './store/CommerceStore';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'smooth' }); }, [pathname]);
  return null;
}

export default function App() {
  const { toast } = useCommerce();
  return <>
    <ScrollToTop />
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/shop" element={<ShopPage />} />
      <Route path="/product/:id" element={<ProductDetailPage />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/checkout" element={<CheckoutPage />} />
      <Route path="/order-success" element={<OrderSuccessPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/account" element={<AccountPage />} />
      <Route path="/track/:id" element={<OrderTrackingPage />} />
      <Route path="/admin" element={<AdminDashboardPage />} />
      <Route path="/admin/inventory" element={<InventoryPage />} />
      <Route path="/admin/crm" element={<CRMLeadsPage />} />
      <Route path="/admin/ai" element={<AIAssistantPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    {toast && <div className="toast"><span><Check size={12}/></span>{toast}</div>}
  </>;
}
