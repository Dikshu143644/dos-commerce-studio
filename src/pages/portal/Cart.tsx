import { useState, useMemo } from 'react';
import { motion } from 'motion/react';
import {
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  ShoppingBag,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/components/shared/PageHeader';
import { EmptyState } from '@/components/shared/EmptyState';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { useAuth } from '@/hooks/useAuth';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface CartItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  unit_price: number;
  quantity: number;
}

const initialCartItems: CartItem[] = [
  {
    id: 'prod-1',
    name: 'Circuit Board Pro X1',
    sku: 'PCB-PRO-001',
    category: 'Electronics',
    unit_price: 10000,
    quantity: 15,
  },
  {
    id: 'prod-2',
    name: 'Industrial Servo Motor 750W',
    sku: 'SRV-750W-002',
    category: 'Industrial Parts',
    unit_price: 27200,
    quantity: 4,
  },
];

export default function Cart() {
  useDocumentTitle('Procurement Order Cart | DOS Commerce');
  const { user, userRole, loginDemo } = useAuth();

  const [items, setItems] = useState<CartItem[]>(initialCartItems);
  const [poNumber, setPoNumber] = useState('PO-APEX-2026-0891');
  const [shippingAddress, setShippingAddress] = useState('Plot 42, Sector 8, Whitefield Tech Park, Bangalore 560066');
  const [shippingMethod, setShippingMethod] = useState('Dedicated Truckload Logistics');
  const [paymentMethod, setPaymentMethod] = useState<'razorpay_upi' | 'credit_card' | 'corporate_net30' | 'cod'>('razorpay_upi');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState<string | null>(null);
  const [loginModalOpen, setLoginModalOpen] = useState(false);

  const isLoggedInCustomer = !!user && userRole !== 'viewer';

  const handleQtyChange = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const nextQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: nextQty };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.info('Item removed from cart');
  };

  const totals = useMemo(() => {
    const subtotal = items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
    const tax = Math.round(subtotal * 0.18);
    const shipping = subtotal > 100000 ? 0 : 3500;
    const total = subtotal + tax + shipping;

    return { subtotal, tax, shipping, total };
  }, [items]);

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    // Enforce Rule: To BUY -> Login is COMPULSORY
    if (!isLoggedInCustomer) {
      toast.warning('Customer Login Required', {
        description: 'You can browse products freely, but login is compulsory to reserve inventory and place orders.',
      });
      setLoginModalOpen(true);
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      const generatedOrderNo = `DOS-ORD-2026-${Math.floor(1000 + Math.random() * 9000)}`;
      setOrderPlaced(generatedOrderNo);
      setItems([]);
      toast.success(`Order Placed & Stock Reserved: ${generatedOrderNo}!`, {
        description: 'Inventory units have been reserved in Mumbai WH. Department staff will confirm fulfillment.',
      });
    }, 800);
  };

  const handleQuickLoginAndProceed = () => {
    loginDemo('client');
    setLoginModalOpen(false);
    toast.success('Signed in as Rohan Mehra! You can now place your order.');
  };

  if (orderPlaced) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="h-20 w-20 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center mx-auto"
        >
          <CheckCircle2 className="h-10 w-10" />
        </motion.div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Order Successfully Placed!</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Your wholesale procurement order <strong className="text-foreground">{orderPlaced}</strong> has been transmitted to Mumbai Central Warehouse for fulfillment.
          </p>
        </div>

        <Card className="p-6 rounded-3xl border-border bg-card text-left max-w-md mx-auto space-y-3">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Order Reference:</span>
            <span className="font-mono font-bold text-foreground">{orderPlaced}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Buyer PO:</span>
            <span className="font-semibold text-foreground">{poNumber}</span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Billing / Payment:</span>
            <span className="font-semibold text-emerald-500">Corporate Credit (Net 30)</span>
          </div>
          <div className="flex justify-between text-xs border-t border-border pt-2 font-bold text-sm">
            <span>Total Invoiced:</span>
            <span className="text-primary">₹{totals.total.toLocaleString('en-IN')}</span>
          </div>
        </Card>

        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Button asChild className="bg-primary text-primary-foreground rounded-xl">
            <Link to={`/portal/tracking?order=${orderPlaced}`}>Track Consignment Live</Link>
          </Button>
          <Button variant="outline" asChild className="rounded-xl">
            <Link to="/portal/orders">View All Orders</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Procurement Order Cart"
        description="Review selected line items, specify your internal purchase order reference, and submit for warehouse dispatch."
      />

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your procurement cart is empty"
          description="Browse the product catalog to add components and raw materials."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items List */}
          <div className="lg:col-span-2 space-y-4">
            <Card className="rounded-3xl border-border bg-card shadow-sm">
              <CardHeader className="pb-3 border-b border-border">
                <CardTitle className="text-base font-bold">Line Items ({items.length})</CardTitle>
              </CardHeader>
              <CardContent className="p-6 divide-y divide-border">
                {items.map((item) => (
                  <div key={item.id} className="py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-foreground">{item.name}</span>
                        <Badge variant="outline" className="text-[10px]">
                          {item.category}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">{item.sku}</p>
                      <p className="text-xs text-muted-foreground">
                        Rate: <strong className="text-foreground">₹{item.unit_price.toLocaleString('en-IN')}</strong> / unit
                      </p>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6">
                      <div className="flex items-center gap-2 bg-background border border-border rounded-xl p-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleQtyChange(item.id, -1)}
                          className="h-7 w-7 rounded-lg"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="font-bold text-sm px-2">{item.quantity}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleQtyChange(item.id, 1)}
                          className="h-7 w-7 rounded-lg"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>

                      <div className="text-right min-w-[100px]">
                        <span className="font-bold text-foreground block">
                          ₹{(item.unit_price * item.quantity).toLocaleString('en-IN')}
                        </span>
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(item.id)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Shipping & PO Configuration */}
            <Card className="rounded-3xl border-border bg-card shadow-sm p-6 space-y-4">
              <h3 className="font-bold text-base text-foreground">Delivery & Billing Preferences</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Internal Buyer PO Reference *</Label>
                  <Input
                    required
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="rounded-xl bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Logistics Dispatch Method</Label>
                  <Select value={shippingMethod} onValueChange={setShippingMethod}>
                    <SelectTrigger className="rounded-xl bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dedicated Truckload Logistics">Dedicated Full Truckload (Direct Hub)</SelectItem>
                      <SelectItem value="Express Ground Surface">Express Ground Cargo (48 Hrs)</SelectItem>
                      <SelectItem value="Priority Air Consignment">Priority Air Cargo (24 Hrs)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Destination Delivery Address *</Label>
                <textarea
                  rows={2}
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-background border border-border text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </Card>
          </div>

          {/* Order Summary Checkout Card */}
          <div className="space-y-4">
            <Card className="rounded-3xl border-border bg-card shadow-sm p-6 space-y-5">
              <CardTitle className="text-base font-bold">Commercial Order Summary</CardTitle>

              <div className="space-y-2.5 text-sm divide-y divide-border">
                <div className="flex justify-between pt-1">
                  <span className="text-muted-foreground">Subtotal ({items.length} items):</span>
                  <span className="font-semibold text-foreground">₹{totals.subtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-2.5">
                  <span className="text-muted-foreground">GST (18% Harmonized):</span>
                  <span className="font-semibold text-foreground">₹{totals.tax.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between pt-2.5">
                  <span className="text-muted-foreground">Freight & Logistics:</span>
                  <span className="font-semibold text-emerald-500">
                    {totals.shipping === 0 ? 'FREE (Wholesale Tier)' : `₹${totals.shipping.toLocaleString('en-IN')}`}
                  </span>
                </div>
                <div className="flex justify-between pt-3 text-base font-bold text-foreground">
                  <span>Grand Total:</span>
                  <span className="text-primary text-xl">₹{totals.total.toLocaleString('en-IN')}</span>
                </div>
              </div>

              {/* Payment Method Selector (Razorpay / UPI / Card / Net30 / COD) */}
              <div className="bg-background p-4 rounded-2xl border border-border space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-foreground">Select Payment Method</span>
                  <Badge variant="outline" className="border-purple-300 bg-purple-50 text-purple-700 text-[10px]">
                    Razorpay Gateway
                  </Badge>
                </div>

                <div className="space-y-2">
                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card cursor-pointer hover:border-purple-400 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'razorpay_upi'}
                        onChange={() => setPaymentMethod('razorpay_upi')}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-xs font-semibold text-foreground">Instant UPI / QR / Google Pay</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">0% Fee</span>
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card cursor-pointer hover:border-purple-400 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'credit_card'}
                        onChange={() => setPaymentMethod('credit_card')}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-xs font-semibold text-foreground">Corporate Credit / Debit Card</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Visa / MC / RuPay</span>
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card cursor-pointer hover:border-purple-400 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'corporate_net30'}
                        onChange={() => setPaymentMethod('corporate_net30')}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-xs font-semibold text-foreground">Net 30 Corporate Credit Line</span>
                    </div>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">Pre-Approved</span>
                  </label>

                  <label className="flex items-center justify-between p-2.5 rounded-xl border border-border bg-card cursor-pointer hover:border-purple-400 transition-colors">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'cod'}
                        onChange={() => setPaymentMethod('cod')}
                        className="text-purple-600 focus:ring-purple-500"
                      />
                      <span className="text-xs font-semibold text-foreground">Cash On Delivery (COD)</span>
                    </div>
                    <span className="text-[10px] text-muted-foreground">Upon Hub Delivery</span>
                  </label>
                </div>
              </div>

              <Button
                onClick={handleCheckout}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-purple-600/25 h-12 text-sm cursor-pointer"
              >
                {isSubmitting ? 'Reserving Stock & Processing...' : `Pay ₹${totals.total.toLocaleString('en-IN')} & Place Order`}
              </Button>
            </Card>
          </div>
        </div>
      )}

      {/* Compulsory Login Required Modal for Guests */}
      <Dialog open={loginModalOpen} onOpenChange={setLoginModalOpen}>
        <DialogContent className="max-w-md rounded-[24px]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <span className="text-xl">🛍️</span> Customer Login Compulsory to Buy
            </DialogTitle>
            <DialogDescription>
              You can browse and compare products freely without signing in. To reserve warehouse stock and place an order, customer authentication is required.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200/80 space-y-2">
              <span className="text-xs font-bold text-purple-900 block">1-CLICK BUYER AUTHENTICATION</span>
              <p className="text-xs text-purple-700">
                Continue instantly with our verified customer demo profile (Rohan Mehra) or sign in with your email account.
              </p>
              <Button
                onClick={handleQuickLoginAndProceed}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs h-10 rounded-xl"
              >
                Continue as Rohan Mehra (Buyer)
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-500">
              <span>Have an existing account?</span>
              <Link to="/login" className="font-bold text-purple-600 hover:underline">
                Go to Customer Login Door &rarr;
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
