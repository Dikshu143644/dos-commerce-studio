import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { Product, products } from '../data/catalog';

type CartItem = { product: Product; quantity: number };
type User = { name: string; email: string } | null;
type CommerceContextValue = {
  cart: CartItem[]; cartCount: number; wishlist: string[]; user: User; toast: string;
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  toggleWishlist: (id: string) => void;
  login: (email?: string) => void; logout: () => void; clearCart: () => void;
};

const CommerceContext = createContext<CommerceContextValue | null>(null);

export function CommerceProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const saved = localStorage.getItem('dos-cart');
    if (saved) { try { return JSON.parse(saved); } catch { /* use demo cart */ } }
    return [{ product: products[0], quantity: 1 }, { product: products[5], quantity: 1 }];
  });
  const [wishlist, setWishlist] = useState<string[]>(() => {
    const saved = localStorage.getItem('dos-wishlist');
    return saved ? JSON.parse(saved) : [products[2].id];
  });
  const [user, setUser] = useState<User>(() => localStorage.getItem('dos-user') ? { name: 'Ananya Kapoor', email: 'ananya@example.com' } : null);
  const [toast, setToast] = useState('');

  useEffect(() => localStorage.setItem('dos-cart', JSON.stringify(cart)), [cart]);
  useEffect(() => localStorage.setItem('dos-wishlist', JSON.stringify(wishlist)), [wishlist]);
  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(''), 2400); return () => clearTimeout(timer); }, [toast]);

  const addToCart = (product: Product, quantity = 1) => {
    setCart(current => current.some(item => item.product.id === product.id)
      ? current.map(item => item.product.id === product.id ? { ...item, quantity: Math.min(item.quantity + quantity, product.stock) } : item)
      : [...current, { product, quantity }]);
    setToast(`${product.name} added to your bag`);
  };
  const removeFromCart = (id: string) => { setCart(current => current.filter(item => item.product.id !== id)); setToast('Item removed from your bag'); };
  const updateQuantity = (id: string, quantity: number) => setCart(current => current.map(item => item.product.id === id ? { ...item, quantity } : item));
  const toggleWishlist = (id: string) => { setWishlist(current => current.includes(id) ? current.filter(x => x !== id) : [...current, id]); setToast(wishlist.includes(id) ? 'Removed from wishlist' : 'Saved to wishlist'); };
  const login = (email = 'ananya@example.com') => { const next = { name: 'Ananya Kapoor', email }; setUser(next); localStorage.setItem('dos-user', JSON.stringify(next)); };
  const logout = () => { setUser(null); localStorage.removeItem('dos-user'); };
  const clearCart = () => setCart([]);
  const cartCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

  return <CommerceContext.Provider value={{ cart, cartCount, wishlist, user, toast, addToCart, removeFromCart, updateQuantity, toggleWishlist, login, logout, clearCart }}>{children}</CommerceContext.Provider>;
}

export const useCommerce = () => {
  const context = useContext(CommerceContext);
  if (!context) throw new Error('useCommerce must be used inside CommerceProvider');
  return context;
};
