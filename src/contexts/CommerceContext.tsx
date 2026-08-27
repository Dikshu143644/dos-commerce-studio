import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

const CART_STORAGE_KEY = 'dos_client_cart';
const ORDERS_STORAGE_KEY = 'dos_commerce_orders';
const ACTIVITY_STORAGE_KEY = 'dos_commerce_activity';

export interface CommerceCartItem {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  quantity: number;
  minOrderQty: number;
  stockQuantity?: number;
  image?: string;
}

export type CommerceOrderStatus = 'processing' | 'dispatched' | 'delivered' | 'cancelled';

export interface CommerceOrder {
  id: string;
  orderNumber: string;
  poNumber: string;
  customerName: string;
  createdAt: string;
  status: CommerceOrderStatus;
  items: CommerceCartItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  shippingAddress: string;
  shippingMethod: string;
  source: 'storefront';
}

export interface CommerceActivity {
  id: string;
  type: 'cart' | 'order';
  title: string;
  description: string;
  createdAt: string;
  orderNumber?: string;
}

interface AddProductInput {
  id: string;
  name: string;
  sku: string;
  category: string;
  unitPrice: number;
  minOrderQty?: number;
  stockQuantity?: number;
  image?: string;
}

interface PlaceOrderInput {
  poNumber: string;
  shippingAddress: string;
  shippingMethod: string;
  customerName?: string;
}

interface CommerceContextValue {
  cart: CommerceCartItem[];
  orders: CommerceOrder[];
  activities: CommerceActivity[];
  cartItemCount: number;
  cartTotals: { subtotal: number; tax: number; shipping: number; total: number };
  addProduct: (product: AddProductInput, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeProduct: (productId: string) => void;
  placeOrder: (input: PlaceOrderInput) => CommerceOrder;
}

const CommerceContext = createContext<CommerceContextValue | null>(null);

function readStoredArray<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];

  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function writeStoredValue(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Keep the in-memory workflow available when browser storage is blocked or full.
  }
}

function readCart(): CommerceCartItem[] {
  return readStoredArray<Record<string, unknown>>(CART_STORAGE_KEY)
    .map((item) => ({
      id: String(item.id ?? ''),
      name: String(item.name ?? 'Product'),
      sku: String(item.sku ?? ''),
      category: String(item.category ?? 'Industrial'),
      unitPrice: Number(item.unitPrice ?? item.unit_price ?? item.price ?? 0),
      quantity: Math.max(1, Number(item.quantity ?? 1)),
      minOrderQty: Math.max(1, Number(item.minOrderQty ?? item.min_order_qty ?? 1)),
      stockQuantity: item.stockQuantity !== undefined || item.stock_quantity !== undefined
        ? Math.max(0, Number(item.stockQuantity ?? item.stock_quantity))
        : undefined,
      image: typeof item.image === 'string' ? item.image : undefined,
    }))
    .map((item) => ({
      ...item,
      quantity: Math.min(item.stockQuantity ?? Number.POSITIVE_INFINITY, Math.max(item.minOrderQty, item.quantity)),
    }))
    .filter((item) => item.id && item.unitPrice >= 0 && (item.stockQuantity === undefined || item.stockQuantity >= item.minOrderQty));
}

export function CommerceProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CommerceCartItem[]>(readCart);
  const [orders, setOrders] = useState<CommerceOrder[]>(() =>
    readStoredArray<CommerceOrder>(ORDERS_STORAGE_KEY)
  );
  const [activities, setActivities] = useState<CommerceActivity[]>(() =>
    readStoredArray<CommerceActivity>(ACTIVITY_STORAGE_KEY)
  );

  useEffect(() => {
    writeStoredValue(CART_STORAGE_KEY, cart);
    try {
      window.localStorage.setItem('dos_cart_last_activity', new Date().toISOString());
    } catch {
      // Cart remains usable in memory.
    }
  }, [cart]);

  useEffect(() => {
    writeStoredValue(ORDERS_STORAGE_KEY, orders);
  }, [orders]);

  useEffect(() => {
    writeStoredValue(ACTIVITY_STORAGE_KEY, activities);
  }, [activities]);

  useEffect(() => {
    const syncCommerceState = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY) setCart(readCart());
      if (event.key === ORDERS_STORAGE_KEY) setOrders(readStoredArray<CommerceOrder>(ORDERS_STORAGE_KEY));
      if (event.key === ACTIVITY_STORAGE_KEY) setActivities(readStoredArray<CommerceActivity>(ACTIVITY_STORAGE_KEY));
    };
    window.addEventListener('storage', syncCommerceState);
    return () => window.removeEventListener('storage', syncCommerceState);
  }, []);

  const addProduct = useCallback((product: AddProductInput, quantity = 1) => {
    const minOrderQty = Math.max(1, product.minOrderQty ?? 1);
    const stockQuantity = product.stockQuantity === undefined ? undefined : Math.max(0, product.stockQuantity);
    const safeQuantity = Math.min(
      stockQuantity ?? Number.POSITIVE_INFINITY,
      Math.max(minOrderQty, quantity)
    );
    if (safeQuantity < minOrderQty) return;

    setCart((current) => {
      const existing = current.find((item) => item.id === product.id);
      if (existing) {
        return current.map((item) =>
          item.id === product.id
            ? {
                ...item,
                quantity: Math.min(
                  item.stockQuantity ?? Number.POSITIVE_INFINITY,
                  item.quantity + safeQuantity
                ),
              }
            : item
        );
      }
      return [...current, { ...product, minOrderQty, stockQuantity, quantity: safeQuantity }];
    });

    setActivities((current) => [
      {
        id: `cart-${Date.now()}`,
        type: 'cart' as const,
        title: 'Storefront cart updated',
        description: `${safeQuantity} × ${product.name} added from DOS-SHOP`,
        createdAt: new Date().toISOString(),
      },
      ...current,
    ].slice(0, 25));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setCart((current) =>
      current.map((item) =>
        item.id === productId
          ? {
              ...item,
              quantity: Math.min(
                item.stockQuantity ?? Number.POSITIVE_INFINITY,
                Math.max(item.minOrderQty, quantity)
              ),
            }
          : item
      )
    );
  }, []);

  const removeProduct = useCallback((productId: string) => {
    setCart((current) => current.filter((item) => item.id !== productId));
  }, []);

  const cartTotals = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const tax = Math.round(subtotal * 0.18);
    const shipping = subtotal === 0 || subtotal > 100000 ? 0 : 3500;
    return { subtotal, tax, shipping, total: subtotal + tax + shipping };
  }, [cart]);

  const placeOrder = useCallback((input: PlaceOrderInput) => {
    if (cart.length === 0) throw new Error('Cannot place an order with an empty cart');
    const invalidLine = cart.find((item) =>
      item.quantity < item.minOrderQty ||
      (item.stockQuantity !== undefined && item.quantity > item.stockQuantity)
    );
    if (invalidLine) throw new Error(`Invalid quantity for ${invalidLine.name}`);

    const now = new Date();
    const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
    const tax = Math.round(subtotal * 0.18);
    const shipping = subtotal > 100000 ? 0 : 3500;
    const orderNumber = `SO-${now.getFullYear()}-${String(now.getTime()).slice(-6)}`;
    const order: CommerceOrder = {
      id: `web-${now.getTime()}`,
      orderNumber,
      poNumber: input.poNumber,
      customerName: input.customerName || 'Apex Industrial Buyer',
      createdAt: now.toISOString(),
      status: 'processing',
      items: cart.map((item) => ({ ...item })),
      subtotal,
      tax,
      shipping,
      total: subtotal + tax + shipping,
      shippingAddress: input.shippingAddress,
      shippingMethod: input.shippingMethod,
      source: 'storefront',
    };

    setOrders((current) => [order, ...current]);
    setActivities((current) => [
      {
        id: `order-${now.getTime()}`,
        type: 'order' as const,
        title: `Web order ${orderNumber} created`,
        description: `${order.customerName} submitted ${order.items.length} product lines worth ₹${order.total.toLocaleString('en-IN')}`,
        createdAt: now.toISOString(),
        orderNumber,
      },
      ...current,
    ].slice(0, 25));
    setCart([]);
    return order;
  }, [cart]);

  const value = useMemo<CommerceContextValue>(() => ({
    cart,
    orders,
    activities,
    cartItemCount: cart.reduce((sum, item) => sum + item.quantity, 0),
    cartTotals,
    addProduct,
    updateQuantity,
    removeProduct,
    placeOrder,
  }), [cart, orders, activities, cartTotals, addProduct, updateQuantity, removeProduct, placeOrder]);

  return <CommerceContext.Provider value={value}>{children}</CommerceContext.Provider>;
}

export function useCommerce() {
  const context = useContext(CommerceContext);
  if (!context) throw new Error('useCommerce must be used inside CommerceProvider');
  return context;
}
