import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Bell, Box, CalendarDays, Check, ChevronRight, CircleUserRound, Clock3, Download, Edit3, Eye, EyeOff, Heart, Home, LockKeyhole, LogOut, Mail, MapPin, PackageCheck, Phone, Plus, ShieldCheck, ShoppingBag, Sparkles, Star, Truck, UserRound } from 'lucide-react';
import { Logo, Ambient, Glass, StatusBadge } from '../components/ui';
import { StoreShell } from '../components/StoreShell';
import { formatPrice, order, products } from '../data/catalog';
import { useCommerce } from '../store/CommerceStore';

export function AuthPage() {
  const [view, setView] = useState<'login'|'register'|'forgot'>('login');
  const [registerStep, setRegisterStep] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('ananya@example.com');
  const { login } = useCommerce(); const navigate = useNavigate(); const [params] = useSearchParams();
  const submit = (event: FormEvent) => { event.preventDefault(); if (view==='register' && registerStep===0) { setRegisterStep(1); return; } if (view==='forgot') { setView('login'); return; } login(email); navigate(params.get('returnTo') || '/account'); };
  return <div className="auth-page"><Ambient/><Link to="/" className="auth-logo"><Logo/></Link><Link to="/" className="auth-back"><ArrowLeft/> Back to store</Link>
    <Glass className="auth-showcase"><div className="auth-showcase-copy"><span className="hero-kicker"><Sparkles/> One account, everything connected</span><h1>Commerce that<br/><em>knows you.</em></h1><p>Track every order, save what you love, and get recommendations made around your world.</p><div className="auth-quote"><div className="quote-stars">★★★★★</div><blockquote>“The smoothest shopping experience I’ve had. Everything feels considered.”</blockquote><span>— Mira S., verified customer</span></div></div><div className="auth-art"><span className="auth-art-orb"/><Glass className="auth-float-card card-order"><span><PackageCheck/></span><div><small>Order delivered</small><b>Aura Pro Headphones</b></div><Check/></Glass><Glass className="auth-float-card card-points"><Sparkles/><div><b>+240</b><small>DOS rewards</small></div></Glass><img src={products[2].image} alt="Smart product"/></div></Glass>
    <Glass className="auth-card"><div className="auth-mobile-logo"><Logo/></div>
      {view==='login' && <><span className="eyebrow">Welcome back</span><h2>Good to see you.</h2><p>Sign in to pick up where you left off.</p><form onSubmit={submit}><label>Email address<div className="auth-input"><Mail/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div></label><label>Password <button type="button" onClick={()=>setView('forgot')}>Forgot password?</button><div className="auth-input"><LockKeyhole/><input type={showPassword?'text':'password'} defaultValue="password123" required/><button type="button" onClick={()=>setShowPassword(!showPassword)}>{showPassword?<EyeOff/>:<Eye/>}</button></div></label><label className="remember"><input type="checkbox" defaultChecked/> Keep me signed in</label><button className="btn btn-primary btn-block" type="submit">Sign in <ArrowRight/></button></form><div className="auth-divider"><span>or continue with</span></div><div className="social-row"><button onClick={()=>{login();navigate('/account')}}><b>G</b> Google</button><button onClick={()=>{login();navigate('/account')}}><b>f</b> Facebook</button></div><div className="auth-switch">New to DOS? <button onClick={()=>setView('register')}>Create an account</button></div></>}
      {view==='register' && <><span className="eyebrow">Join DOS</span><h2>{registerStep===0?'Create your account.':'A little about you.'}</h2><p>{registerStep===0?'Save favorites, track orders, and check out faster.':'Help us personalize your DOS experience.'}</p><div className="register-progress"><i className="active"/><i className={registerStep>0?'active':''}/></div><form onSubmit={submit}>{registerStep===0?<><label>Email address<div className="auth-input"><Mail/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div></label><label>Create password<div className="auth-input"><LockKeyhole/><input type="password" placeholder="At least 8 characters" required/></div></label></>:<><div className="field-row"><label>First name<div className="auth-input"><UserRound/><input defaultValue="Ananya" required/></div></label><label>Last name<div className="auth-input"><UserRound/><input defaultValue="Kapoor" required/></div></label></div><label>Phone number<div className="auth-input"><Phone/><input defaultValue="+91 98765 43210" required/></div></label></>}<button className="btn btn-primary btn-block" type="submit">{registerStep===0?'Continue':'Create account'} <ArrowRight/></button></form><div className="auth-switch">Already have an account? <button onClick={()=>setView('login')}>Sign in</button></div></>}
      {view==='forgot' && <><button className="auth-inline-back" onClick={()=>setView('login')}><ArrowLeft/> Sign in</button><span className="forgot-icon"><Mail/></span><h2>Reset your password.</h2><p>Enter your email and we’ll send you a secure reset link.</p><form onSubmit={submit}><label>Email address<div className="auth-input"><Mail/><input type="email" value={email} onChange={e=>setEmail(e.target.value)} required/></div></label><button className="btn btn-primary btn-block">Send reset link <ArrowRight/></button></form></>}
      <div className="auth-secure"><ShieldCheck/> Your data is encrypted and never shared.</div>
    </Glass>
  </div>;
}

const accountNav = [
  {id:'profile',label:'Profile',icon:CircleUserRound},{id:'orders',label:'Orders',icon:ShoppingBag},{id:'addresses',label:'Addresses',icon:MapPin},{id:'wishlist',label:'Wishlist',icon:Heart}
];

export function AccountPage() {
  const { user, logout, wishlist } = useCommerce(); const [params] = useSearchParams(); const navigate=useNavigate();
  const requested = params.get('section'); const [section,setSection]=useState(requested && accountNav.some(n=>n.id===requested)?requested:'profile');
  if(!user) return <Navigate to="/login" replace/>;
  const saved = products.filter(p=>wishlist.includes(p.id));
  const signOut=()=>{logout();navigate('/')};
  return <StoreShell><div className="account-welcome"><div><span className="eyebrow">My DOS</span><h1>Welcome back, Ananya.</h1><p>Everything you love, ordered and organized.</p></div><div className="account-avatar">AK<span/></div></div>
    <div className="account-layout"><Glass className="account-nav"><div className="account-mini-profile"><span>AK</span><div><b>Ananya Kapoor</b><small>{user.email}</small></div></div><nav>{accountNav.map(n=><button className={section===n.id?'active':''} onClick={()=>setSection(n.id)} key={n.id}><n.icon/><span>{n.label}</span>{n.id==='orders'&&<em>3</em>}<ChevronRight/></button>)}</nav><button className="account-logout" onClick={signOut}><LogOut/> Log out</button></Glass>
      <div className="account-content">
        {section==='profile'&&<ProfileSection setSection={setSection}/>} 
        {section==='orders'&&<OrdersSection/>}
        {section==='addresses'&&<AddressesSection/>}
        {section==='wishlist'&&<WishlistSection saved={saved}/>} 
      </div>
    </div>
  </StoreShell>;
}

function ProfileSection({setSection}:{setSection:(s:string)=>void}) {
  return <div className="account-bento"><Glass className="profile-hero"><div className="profile-avatar">AK<button><Edit3/></button></div><div><span className="eyebrow">Personal details</span><h2>Ananya Kapoor</h2><p>Member since February 2025</p></div><button className="btn btn-ghost btn-sm"><Edit3/> Edit profile</button></Glass>
    <Glass className="account-info-card"><div className="info-card-head"><span><Mail/></span><button><Edit3/></button></div><small>Email address</small><b>ananya@example.com</b><p><Check/> Verified</p></Glass>
    <Glass className="account-info-card"><div className="info-card-head"><span className="orange"><Phone/></span><button><Edit3/></button></div><small>Phone number</small><b>+91 98765 43210</b><p><Check/> Verified</p></Glass>
    <Glass className="recent-order-card"><div className="section-card-title"><div><span className="eyebrow">On the way</span><h2>Recent order</h2></div><button onClick={()=>setSection('orders')}>View all <ArrowRight/></button></div><div className="recent-order-row"><div className="stacked-images">{order.items.map(i=><img src={i.product.image} key={i.product.id}/>)}</div><div><b>Order #{order.id}</b><small>2 items · {order.date}</small></div><StatusBadge tone="purple">{order.status}</StatusBadge><strong>{formatPrice(order.total)}</strong><Link to={`/track/${order.id}`}><ChevronRight/></Link></div></Glass>
    <Glass className="account-rewards"><div><Sparkles/><span><small>DOS rewards</small><b>1,240 points</b></span></div><div className="rewards-bar"><i style={{width:'62%'}}/></div><p>760 points to your next ₹500 reward</p></Glass>
    <Glass className="account-address-preview"><span><Home/></span><div><small>Default address</small><b>Residency Road, Bengaluru</b></div><button onClick={()=>setSection('addresses')}>Manage</button></Glass>
  </div>;
}

function OrdersSection() {
  const orders=[order,{...order,id:'DOS-831904',date:'08 Aug 2026',status:'Delivered',total:8499,items:[{product:products[1],quantity:1}]},{...order,id:'DOS-795210',date:'14 Jul 2026',status:'Delivered',total:6299,items:[{product:products[2],quantity:1}]}];
  return <Glass className="orders-panel"><div className="section-card-title"><div><span className="eyebrow">Order history</span><h2>Your orders</h2></div><select><option>Last 6 months</option><option>This year</option></select></div>{orders.map((o,i)=><div className="order-history-row" key={o.id}><img src={o.items[0].product.image}/><div><b>#{o.id}</b><small>{o.date} · {o.items.length} {o.items.length===1?'item':'items'}</small></div><StatusBadge tone={i===0?'purple':'green'}>{o.status}</StatusBadge><strong>{formatPrice(o.total)}</strong><Link to={`/track/${o.id}`}>View order <ChevronRight/></Link></div>)}</Glass>;
}

function AddressesSection() {
  return <div><div className="section-title-inline"><div><span className="eyebrow">Saved places</span><h2>Your addresses</h2></div><button className="btn btn-primary btn-sm"><Plus/> Add address</button></div><div className="address-grid"><Glass className="address-card default"><div><span><Home/></span><StatusBadge tone="purple">Default</StatusBadge></div><h3>Home</h3><p>Ananya Kapoor<br/>42, Residency Road<br/>Bengaluru, Karnataka 560001<br/>+91 98765 43210</p><div><button>Edit</button><button>Remove</button></div></Glass><Glass className="address-card"><div><span className="orange"><Box/></span></div><h3>Office</h3><p>Ananya Kapoor<br/>16, Richmond Circle<br/>Bengaluru, Karnataka 560025<br/>+91 98765 43210</p><div><button>Edit</button><button>Remove</button></div></Glass></div></div>;
}

function WishlistSection({saved}:{saved:typeof products}) {
  const {addToCart,toggleWishlist}=useCommerce();
  return <Glass className="wishlist-panel"><div className="section-card-title"><div><span className="eyebrow">Saved for later</span><h2>Your wishlist</h2></div><span>{saved.length} items</span></div>{saved.length?saved.map(p=><div className="wishlist-row" key={p.id}><Link to={`/product/${p.id}`}><img src={p.image}/></Link><div><span>{p.category}</span><Link to={`/product/${p.id}`}><b>{p.name}</b></Link><small><Star fill="currentColor"/> {p.rating} · In stock</small></div><strong>{formatPrice(p.price)}</strong><button className="btn btn-primary btn-sm" onClick={()=>addToCart(p)}>Add to bag</button><button className="remove-button" onClick={()=>toggleWishlist(p.id)}>×</button></div>):<div className="wishlist-empty"><Heart/><h3>No saved items yet</h3><Link className="btn btn-primary" to="/shop">Explore products</Link></div>}</Glass>;
}

export function OrderTrackingPage() {
  const { id }=useParams(); const [notified,setNotified]=useState(false);
  const stages=[{name:'Confirmed',date:'24 Aug, 10:32',icon:Check},{name:'Packed',date:'24 Aug, 16:45',icon:Box},{name:'Shipped',date:'25 Aug, 08:20',icon:Truck},{name:'Out for delivery',date:'Expected tomorrow',icon:MapPin},{name:'Delivered',date:'Expected 28 Aug',icon:Home}];
  const download=()=>{const blob=new Blob([`DOS Commerce Invoice\nOrder: ${id}\nTotal: ${formatPrice(order.total)}\nThank you for shopping with DOS.`],{type:'application/pdf'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`invoice-${id}.pdf`;a.click();URL.revokeObjectURL(url)};
  return <StoreShell><div className="breadcrumbs"><Link to="/account?section=orders">My orders</Link><span>/</span><b>#{id}</b></div><div className="tracking-heading"><div><span className="eyebrow">Order #{id}</span><h1>Your order is on the move.</h1><p>Estimated delivery <b>tomorrow, 28 August</b></p></div><button className="btn btn-ghost" onClick={download}><Download/> Download invoice</button></div>
    <Glass className="tracking-main"><div className="tracking-status"><span className="truck-live"><Truck/><i/></span><div><small>Current status</small><h2>Shipped from Bengaluru hub</h2><p>25 Aug, 08:20 · Your parcel is heading to the local delivery center.</p></div><StatusBadge tone="purple">In transit</StatusBadge></div><div className="tracking-stepper">{stages.map((s,i)=><div className={`tracking-step ${i<=2?'done':''}`} key={s.name}><div><span><s.icon/></span>{i<stages.length-1&&<i/>}</div><b>{s.name}</b><small>{s.date}</small></div>)}</div></Glass>
    <div className="tracking-grid"><Glass className="tracking-items"><div className="section-card-title"><div><span className="eyebrow">Inside your parcel</span><h2>Order items</h2></div><span>2 items</span></div>{order.items.map(i=><div key={i.product.id}><img src={i.product.image}/><span><b>{i.product.name}</b><small>{i.product.category} · Qty {i.quantity}</small></span><strong>{formatPrice(i.product.price*i.quantity)}</strong></div>)}<div className="tracking-total"><span>Order total</span><b>{formatPrice(order.total)}</b></div></Glass>
      <Glass className="delivery-address"><span className="mini-icon purple"><MapPin/></span><small>Delivering to</small><h3>Ananya Kapoor</h3><p>42, Residency Road<br/>Bengaluru, Karnataka 560001<br/>+91 98765 43210</p><button>Change delivery instructions</button></Glass>
      <Glass className="tracking-alert"><span><Bell/></span><div><h3>Delivery updates</h3><p>Get notified when your parcel is out for delivery.</p></div><button className={notified?'active':''} onClick={()=>setNotified(!notified)}><i/></button></Glass>
    </div><Link to="/account?section=orders" className="continue-link"><ArrowLeft/> Back to all orders</Link>
  </StoreShell>;
}
