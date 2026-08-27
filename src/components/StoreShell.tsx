import { Menu, Search, ShoppingBag, User, X } from 'lucide-react';
import { FormEvent, ReactNode, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useCommerce } from '../store/CommerceStore';
import { Ambient, Logo } from './ui';

export function StoreHeader() {
  const { cartCount, wishlist, user } = useCommerce();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  const submit = (event: FormEvent) => { event.preventDefault(); if (search.trim()) navigate(`/shop?q=${encodeURIComponent(search)}`); };
  return <header className="store-header glass">
    <Logo/>
    <nav className={menu ? 'open' : ''}>
      <button className="mobile-close" onClick={() => setMenu(false)}><X/></button>
      <NavLink to="/">Home</NavLink><NavLink to="/shop">Shop</NavLink><NavLink to="/shop">Categories</NavLink><NavLink to="/shop?deal=true">Deals</NavLink><a href="#about">About</a>
    </nav>
    <div className="header-actions">
      <form className="header-search" onSubmit={submit}><Search size={17}/><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products"/></form>
      <Link className="icon-button hide-mobile" to="/account?section=wishlist" aria-label="Wishlist">♡{wishlist.length > 0 && <span>{wishlist.length}</span>}</Link>
      <Link className="icon-button" to="/cart" aria-label="Cart"><ShoppingBag size={19}/>{cartCount > 0 && <span>{cartCount}</span>}</Link>
      <Link className="icon-button hide-mobile" to={user ? '/account' : '/login'} aria-label="Account"><User size={19}/></Link>
      <button className="icon-button menu-button" onClick={() => setMenu(true)}><Menu size={20}/></button>
    </div>
  </header>;
}

export function StoreFooter() {
  return <footer className="store-footer" id="about">
    <div className="footer-main"><div><Logo/><p>Everything your business needs,<br/>beautifully connected.</p></div><div><b>Shop</b><Link to="/shop">All products</Link><Link to="/shop?deal=true">Deals</Link><Link to="/account?section=wishlist">Wishlist</Link></div><div><b>Help</b><Link to="/track/DOS-847291">Track order</Link><a href="mailto:support@example.com">Support</a><a href="#about">Delivery</a></div><div><b>Business</b><Link to="/admin">DOS OS</Link><a href="#about">Sell with us</a><a href="#about">Bulk orders</a></div></div>
    <div className="footer-bottom"><span>© 2026 DOS Commerce</span><span>Privacy · Terms · Accessibility</span><span>Made for modern business</span></div>
  </footer>;
}

export function StoreShell({ children, minimal = false }: { children: ReactNode; minimal?: boolean }) {
  return <div className="site-shell"><Ambient/>{!minimal && <StoreHeader/>}<main className={minimal ? 'minimal-main' : 'store-main'}>{children}</main>{!minimal && <StoreFooter/>}</div>;
}
