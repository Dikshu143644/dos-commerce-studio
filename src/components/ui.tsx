import { ReactNode } from 'react';
import { ArrowRight, Check, Minus, Plus, Star } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Product, formatPrice } from '../data/catalog';
import { useCommerce } from '../store/CommerceStore';

export function Ambient({ dark = false }: { dark?: boolean }) {
  return <div className={`ambient ${dark ? 'ambient-dark' : ''}`} aria-hidden="true"><i className="orb orb-a"/><i className="orb orb-b"/><i className="orb orb-c"/><span className="noise"/></div>;
}

export function Glass({ children, className = '', as: Tag = 'div' }: { children: ReactNode; className?: string; as?: 'div' | 'section' | 'article' | 'aside' }) {
  return <Tag className={`glass ${className}`}>{children}</Tag>;
}

export function Logo({ admin = false }: { admin?: boolean }) {
  return <Link to={admin ? '/admin' : '/'} className="logo"><span className="logo-mark"><i/><i/><i/></span><span>DOS</span>{admin && <em>OS</em>}</Link>;
}

export function PageIntro({ eyebrow, title, copy, action }: { eyebrow?: string; title: string; copy?: string; action?: ReactNode }) {
  return <div className="page-intro"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{copy && <p>{copy}</p>}</div>{action}</div>;
}

export function Rating({ value, count, compact = false }: { value: number; count?: number; compact?: boolean }) {
  return <span className="rating"><Star size={compact ? 13 : 15} fill="currentColor"/> <b>{value}</b>{count !== undefined && <small>({count})</small>}</span>;
}

export function Quantity({ value, onChange, max = 99 }: { value: number; onChange: (n: number) => void; max?: number }) {
  return <div className="quantity"><button aria-label="Decrease quantity" onClick={() => onChange(Math.max(1, value - 1))}><Minus size={14}/></button><span>{value}</span><button aria-label="Increase quantity" onClick={() => onChange(Math.min(max, value + 1))}><Plus size={14}/></button></div>;
}

export function ProductCard({ product, className = '' }: { product: Product; className?: string }) {
  const { addToCart, toggleWishlist, wishlist } = useCommerce();
  const liked = wishlist.includes(product.id);
  return <Glass className={`product-card ${className}`}>
    <div className="product-visual">
      {product.badge && <span className="product-badge">{product.badge}</span>}
      <button className={`wish-button ${liked ? 'active' : ''}`} onClick={() => toggleWishlist(product.id)} aria-label="Toggle wishlist">♡</button>
      <Link to={`/product/${product.id}`}><img src={product.image} alt={product.name}/></Link>
      <button className="quick-add" onClick={() => addToCart(product, 1)}>Add to cart <Plus size={15}/></button>
    </div>
    <Link to={`/product/${product.id}`} className="product-copy">
      <span className="product-category">{product.category}</span>
      <h3>{product.name}</h3>
      <div className="product-meta"><Rating value={product.rating} count={product.reviews} compact/><span className="stock-dot">In stock</span></div>
      <div className="price-row"><strong>{formatPrice(product.price)}</strong>{product.originalPrice && <del>{formatPrice(product.originalPrice)}</del>}</div>
    </Link>
  </Glass>;
}

export function StatusBadge({ children, tone = 'purple' }: { children: ReactNode; tone?: 'purple' | 'green' | 'orange' | 'red' | 'gray' }) {
  return <span className={`status status-${tone}`}><i/>{children}</span>;
}

export function EmptyState({ icon, title, copy, to, label }: { icon: ReactNode; title: string; copy: string; to: string; label: string }) {
  return <Glass className="empty-state"><span>{icon}</span><h2>{title}</h2><p>{copy}</p><Link to={to} className="btn btn-primary">{label}<ArrowRight size={17}/></Link></Glass>;
}

export function Stepper({ steps, active }: { steps: string[]; active: number }) {
  return <div className="stepper">{steps.map((step, index) => <div className={`step ${index <= active ? 'active' : ''}`} key={step}><span>{index < active ? <Check size={15}/> : index + 1}</span><b>{step}</b>{index < steps.length - 1 && <i/>}</div>)}</div>;
}
