import { FormEvent, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Armchair, Blocks, Bot, Box, Check, ChevronDown, CircleCheck, Clock3, CreditCard, Drill, Headphones, Heart, MapPin, PackageOpen, RotateCcw, Search, ShieldCheck, ShoppingBag, SlidersHorizontal, Sparkles, Trash2, Truck, WalletCards, Zap } from 'lucide-react';
import { categories, formatPrice, products } from '../data/catalog';
import { useCommerce } from '../store/CommerceStore';
import { EmptyState, Glass, PageIntro, ProductCard, Quantity, Rating, Stepper } from '../components/ui';
import { StoreShell } from '../components/StoreShell';

const categoryIcons: Record<string, typeof Headphones> = { Electronics: Headphones, Industrial: Drill, Office: Armchair, 'Raw Materials': Blocks, Packaging: PackageOpen };

export function HomePage() {
  const navigate = useNavigate();
  return <StoreShell>
    <section className="home-hero bento">
      <Glass className="hero-main">
        <div className="hero-copy"><span className="hero-kicker"><Sparkles size={13}/> Intelligent commerce, delivered</span><h1>Shop smarter.<br/><em>Live better.</em></h1><p>Exceptional products for work and life, curated by people and powered by a little intelligence.</p><div className="hero-actions"><Link to="/shop" className="btn btn-orange">Shop the collection <ArrowRight size={17}/></Link><Link to="/shop?deal=true" className="btn btn-ghost">Explore deals</Link></div><div className="hero-proof"><span><b>4.9</b> customer rating</span><i/><span><b>10k+</b> happy shoppers</span><i/><span><b>24h</b> dispatch</span></div></div>
        <div className="hero-product"><div className="hero-halo"/><img src={products[0].image} alt="Aura Pro headphones"/><span className="floating-tag tag-price"><small>From</small><b>{formatPrice(products[0].price)}</b></span><span className="floating-tag tag-rating"><Rating value={4.9}/><small>Editor’s pick</small></span></div>
      </Glass>
      <Glass className="hero-side ai-discovery"><span className="mini-icon purple"><Bot size={20}/></span><div><span className="eyebrow">DOS intelligence</span><h2>Not sure what fits?</h2><p>Tell our shopping assistant what you need and get a hand-picked shortlist.</p></div><button onClick={() => navigate('/shop')} className="round-link"><ArrowRight/></button></Glass>
      <Glass className="hero-side delivery-card"><div className="delivery-route"><span><Box/></span><i/><span><Truck/></span><i/><span><MapPin/></span></div><h3>Express delivery</h3><p>Free across India above ₹999</p></Glass>
    </section>

    <section className="home-section"><PageIntro eyebrow="Explore collections" title="Made for every ambition" copy="From the studio to the shop floor, discover tools that move your work forward."/><div className="category-bento">{categories.map((cat, i) => { const Icon = categoryIcons[cat.name]; return <Link to={`/shop?category=${encodeURIComponent(cat.name)}`} key={cat.name} className={`glass category-tile category-${i}`}><span style={{background:`${cat.color}18`,color:cat.color}}><Icon/></span><div><h3>{cat.name}</h3><p>{cat.count} products</p></div><ArrowRight className="cat-arrow"/></Link>; })}</div></section>

    <section className="home-section"><PageIntro eyebrow="Curated for you" title="This week’s standouts" copy="Products earning attention for all the right reasons." action={<Link to="/shop" className="text-link">View all products <ArrowRight size={15}/></Link>}/><div className="featured-grid">{products.slice(0,4).map(p => <ProductCard product={p} key={p.id}/>)}</div></section>

    <section className="deal-bento bento">
      <Glass className="deal-main"><div className="deal-copy"><span className="deal-pill"><Zap size={12}/> 48 hours only</span><h2>Upgrade your<br/>everyday setup.</h2><p>Save up to 30% on selected work essentials.</p><Link to="/shop?deal=true" className="btn btn-dark">Shop the edit <ArrowRight size={16}/></Link></div><div className="deal-images"><img src={products[1].image}/><img src={products[4].image}/></div></Glass>
      <Glass className="values-card"><span className="mini-icon orange"><RotateCcw/></span><h3>30-day returns</h3><p>Changed your mind? Returns are simple and always free.</p><a href="#about">Our promise <ArrowRight size={13}/></a></Glass>
      <Glass className="values-card"><span className="mini-icon green"><ShieldCheck/></span><h3>Genuine, always</h3><p>Every product is verified and backed by full warranty.</p><a href="#about">Learn more <ArrowRight size={13}/></a></Glass>
    </section>

    <section className="brand-strip glass"><span>Trusted brands</span>{['NEXA','KEYHAUS','FORGE','FORMA','NOVA','META/FORM'].map(b => <b key={b}>{b}</b>)}</section>
  </StoreShell>;
}

export function ShopPage() {
  const [params] = useSearchParams();
  const initialCategory = params.get('category') || '';
  const [category, setCategory] = useState(initialCategory);
  const [brand, setBrand] = useState('');
  const [maxPrice, setMaxPrice] = useState(90000);
  const [sort, setSort] = useState('featured');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const query = (params.get('q') || '').toLowerCase();
  const deal = params.get('deal') === 'true';
  const filtered = useMemo(() => {
    const result = products.filter(p => (!category || p.category === category) && (!brand || p.brand === brand) && p.price <= maxPrice && (!query || p.name.toLowerCase().includes(query) || p.category.toLowerCase().includes(query)) && (!deal || !!p.originalPrice));
    return [...result].sort((a,b) => sort === 'low' ? a.price-b.price : sort === 'high' ? b.price-a.price : sort === 'rating' ? b.rating-a.rating : 0);
  }, [category, brand, maxPrice, sort, query, deal]);
  const brands = [...new Set(products.map(p => p.brand))];
  return <StoreShell>
    <div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><b>{deal ? 'Deals' : query ? `Search: “${query}”` : 'Shop'}</b></div>
    <PageIntro eyebrow="The collection" title={deal ? 'Deals worth discovering' : query ? 'Search results' : 'Find your next favorite'} copy="Thoughtfully sourced, genuinely useful, and ready when you are."/>
    <div className="shop-layout">
      <Glass className={`filter-panel ${filtersOpen ? 'open' : ''}`}><div className="filter-head"><h3><SlidersHorizontal size={16}/> Filters</h3><button onClick={() => {setCategory('');setBrand('');setMaxPrice(90000)}}>Reset</button></div>
        <div className="filter-group"><h4>Category <ChevronDown size={14}/></h4>{categories.map(c => <label key={c.name}><input type="radio" name="category" checked={category===c.name} onChange={() => setCategory(c.name)}/><span>{c.name}</span><small>{c.count}</small></label>)}</div>
        <div className="filter-group"><h4>Price range</h4><input className="range" type="range" min="1000" max="90000" step="1000" value={maxPrice} onChange={e => setMaxPrice(+e.target.value)}/><div className="range-values"><span>₹1,000</span><b>Up to {formatPrice(maxPrice)}</b></div></div>
        <div className="filter-group"><h4>Brand <ChevronDown size={14}/></h4>{brands.map(b => <label key={b}><input type="radio" name="brand" checked={brand===b} onChange={() => setBrand(b)}/><span>{b}</span></label>)}</div>
        <div className="filter-group"><h4>Rating</h4>{[4.5,4].map(r => <label key={r}><input type="checkbox"/><span className="filter-stars">★★★★★ <small>{r}+ & up</small></span></label>)}</div>
        <button className="btn btn-primary btn-block" onClick={() => setFiltersOpen(false)}>Apply filters</button>
      </Glass>
      <div className="product-results"><Glass className="results-bar"><div><b>{filtered.length}</b> products</div><button className="mobile-filter" onClick={() => setFiltersOpen(!filtersOpen)}><SlidersHorizontal size={15}/> Filters</button><label>Sort by <select value={sort} onChange={e => setSort(e.target.value)}><option value="featured">Featured</option><option value="rating">Popularity</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option></select></label></Glass>
        {filtered.length ? <div className="catalog-grid">{filtered.map(p => <ProductCard product={p} key={p.id}/>)}</div> : <Glass className="no-results"><Search/><h2>No products found</h2><p>Try removing a filter or searching for something else.</p><button className="btn btn-primary" onClick={() => {setCategory('');setBrand('');setMaxPrice(90000)}}>Clear filters</button></Glass>}
      </div>
    </div>
  </StoreShell>;
}

export function ProductDetailPage() {
  const { id } = useParams();
  const product = products.find(p => p.id === id) || products[0];
  const { addToCart, toggleWishlist, wishlist } = useCommerce();
  const [image, setImage] = useState(0); const [quantity, setQuantity] = useState(1); const [tab, setTab] = useState('description'); const [color, setColor] = useState(0);
  const navigate = useNavigate();
  const buy = () => { addToCart(product, quantity); navigate('/checkout'); };
  return <StoreShell><div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><Link to={`/shop?category=${product.category}`}>{product.category}</Link><span>/</span><b>{product.name}</b></div>
    <section className="product-detail bento">
      <Glass className="gallery-card"><div className="main-image"><span className="image-label">{product.badge || 'Featured'}</span><button className={`gallery-wish ${wishlist.includes(product.id) ? 'active' : ''}`} onClick={() => toggleWishlist(product.id)}><Heart fill={wishlist.includes(product.id) ? 'currentColor' : 'none'}/></button><img src={product.gallery[image]} alt={product.name}/></div><div className="thumbs">{product.gallery.map((src,i) => <button className={image===i?'active':''} onClick={() => setImage(i)} key={src}><img src={src}/></button>)}</div></Glass>
      <Glass className="product-info"><span className="product-detail-category">{product.brand} · {product.category}</span><h1>{product.name}</h1><div className="detail-rating"><Rating value={product.rating} count={product.reviews}/><span>SKU {product.sku}</span></div><div className="detail-price"><strong>{formatPrice(product.price)}</strong>{product.originalPrice && <><del>{formatPrice(product.originalPrice)}</del><span>Save {formatPrice(product.originalPrice-product.price)}</span></>}</div><p className="tax-note">Inclusive of all taxes · EMI available from {formatPrice(Math.ceil(product.price/6))}/month</p>
        <div className="info-divider"/>{product.colors && <div className="option-block"><label>Finish <b>{['Midnight','Sand','Violet'][color] || 'Classic'}</b></label><div className="swatches">{product.colors.map((c,i) => <button className={color===i?'active':''} style={{background:c}} onClick={() => setColor(i)} key={c}/>)}</div></div>}
        <div className="purchase-row"><Quantity value={quantity} onChange={setQuantity} max={product.stock}/><button className="btn btn-orange" onClick={() => addToCart(product, quantity)}><ShoppingBag size={17}/> Add to bag</button><button className="btn btn-primary" onClick={buy}>Buy now</button></div>
        <div className="delivery-check"><MapPin size={18}/><div><b>Delivery to 560001</b><span>Arrives by tomorrow · Free express delivery</span></div><button>Change</button></div>
        <div className="trust-row"><span><ShieldCheck/>2-year warranty</span><span><RotateCcw/>30-day returns</span><span><Check/>Authentic</span></div>
      </Glass>
    </section>
    <Glass className="product-tabs"><div className="tab-head"><button className={tab==='description'?'active':''} onClick={()=>setTab('description')}>Description</button><button className={tab==='specs'?'active':''} onClick={()=>setTab('specs')}>Specifications</button><button className={tab==='reviews'?'active':''} onClick={()=>setTab('reviews')}>Reviews <span>{product.reviews}</span></button></div>{tab==='description' && <div className="tab-copy"><h2>Designed around you.</h2><p>{product.description} Every detail is considered, from the durable materials to the intuitive everyday experience.</p><div className="feature-pills"><span><Sparkles/>Premium finish</span><span><Zap/>Built to perform</span><span><ShieldCheck/>Made to last</span></div></div>}{tab==='specs' && <div className="spec-grid">{Object.entries(product.specs).map(([k,v])=><div key={k}><span>{k}</span><b>{v}</b></div>)}</div>}{tab==='reviews' && <div className="review-summary"><strong>{product.rating}</strong><div><Rating value={product.rating}/><b>Excellent</b><p>Based on {product.reviews} verified reviews</p></div><blockquote>“Exactly the quality I hoped for. Delivery was fast and the unboxing experience felt genuinely premium.”<cite>— Verified buyer</cite></blockquote></div>}</Glass>
    <section className="home-section related"><PageIntro eyebrow="Complete the setup" title="You may also like"/><div className="featured-grid">{products.filter(p=>p.id!==product.id).slice(0,4).map(p=><ProductCard product={p} key={p.id}/>)}</div></section>
  </StoreShell>;
}

export function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCommerce();
  const subtotal = cart.reduce((s,i)=>s+i.product.price*i.quantity,0); const shipping = subtotal>999?0:99; const tax = Math.round(subtotal*.18);
  if (!cart.length) return <StoreShell><PageIntro eyebrow="Your bag" title="Shopping bag"/><EmptyState icon={<ShoppingBag size={34}/>} title="Your bag is waiting" copy="Fill it with something useful, beautiful, or both." to="/shop" label="Browse products"/></StoreShell>;
  return <StoreShell><div className="breadcrumbs"><Link to="/">Home</Link><span>/</span><b>Shopping bag</b></div><PageIntro eyebrow="Your selection" title={`Shopping bag · ${cart.reduce((s,i)=>s+i.quantity,0)} items`} copy="Review your items before heading to checkout."/>
    <div className="cart-layout"><div className="cart-items">{cart.map(({product,quantity})=><Glass className="cart-item" key={product.id}><Link to={`/product/${product.id}`} className="cart-image"><img src={product.image}/></Link><div className="cart-copy"><span>{product.category}</span><Link to={`/product/${product.id}`}><h3>{product.name}</h3></Link><p>{product.colors?'Midnight · Standard':'Standard pack'}</p><div className="mobile-cart-price">{formatPrice(product.price)}</div></div><Quantity value={quantity} max={product.stock} onChange={n=>updateQuantity(product.id,n)}/><div className="cart-price"><b>{formatPrice(product.price*quantity)}</b>{product.originalPrice&&<del>{formatPrice(product.originalPrice*quantity)}</del>}</div><button className="remove-button" onClick={()=>removeFromCart(product.id)}><Trash2/></button></Glass>)}<Link to="/shop" className="continue-link"><ArrowLeft size={15}/> Continue shopping</Link></div>
      <Glass className="order-summary"><h2>Order summary</h2><div className="coupon"><input placeholder="Coupon code"/><button>Apply</button></div><div className="summary-lines"><span>Subtotal <b>{formatPrice(subtotal)}</b></span><span>Shipping <b className="free">{shipping?formatPrice(shipping):'Free'}</b></span><span>Estimated tax <b>{formatPrice(tax)}</b></span></div><div className="summary-total"><span>Total <small>Including taxes</small></span><strong>{formatPrice(subtotal+shipping+tax)}</strong></div><Link to="/checkout" className="btn btn-orange btn-block">Proceed to checkout <ArrowRight size={17}/></Link><p className="secure-note"><ShieldCheck size={14}/> Secure checkout · Easy returns</p><div className="payment-marks"><span>VISA</span><span>UPI</span><span>RuPay</span><span>COD</span></div></Glass>
    </div>
  </StoreShell>;
}

export function CheckoutPage() {
  const { cart, clearCart } = useCommerce(); const navigate=useNavigate(); const [step,setStep]=useState(0); const [payment,setPayment]=useState('upi');
  const subtotal=cart.reduce((s,i)=>s+i.product.price*i.quantity,0); const tax=Math.round(subtotal*.18); const total=subtotal+tax;
  const next=(e?:FormEvent)=>{e?.preventDefault(); if(step<2)setStep(step+1);else{clearCart();navigate('/order-success')}};
  if(!cart.length) return <StoreShell><EmptyState icon={<ShoppingBag size={34}/>} title="Nothing to check out" copy="Your cart is empty. Add a few products and come back." to="/shop" label="Start shopping"/></StoreShell>;
  return <StoreShell><div className="checkout-header"><Link to="/cart"><ArrowLeft size={16}/> Back to bag</Link><Stepper steps={['Address','Payment','Review']} active={step}/><span>Secure checkout <ShieldCheck size={15}/></span></div><div className="checkout-layout"><div className="checkout-steps">
    <Glass className={`checkout-card ${step===0?'active':''}`}><div className="checkout-card-title"><span>{step>0?<Check/>:'01'}</span><div><h2>Shipping address</h2><p>Where should we send your order?</p></div>{step>0&&<button onClick={()=>setStep(0)}>Edit</button>}</div>{step===0&&<form className="address-form" onSubmit={next}><div className="field-row"><label>First name<input required defaultValue="Ananya"/></label><label>Last name<input required defaultValue="Kapoor"/></label></div><label>Street address<input required defaultValue="42, Residency Road"/></label><div className="field-row three"><label>City<input required defaultValue="Bengaluru"/></label><label>State<select defaultValue="Karnataka"><option>Karnataka</option><option>Maharashtra</option><option>Delhi</option></select></label><label>PIN code<input required defaultValue="560001"/></label></div><label>Phone number<input required defaultValue="+91 98765 43210"/></label><label className="check-label"><input type="checkbox" defaultChecked/> Save this address for next time</label><button className="btn btn-primary" type="submit">Continue to payment <ArrowRight size={16}/></button></form>}{step>0&&<p className="collapsed-value">Ananya Kapoor · 42, Residency Road, Bengaluru 560001</p>}</Glass>
    <Glass className={`checkout-card ${step===1?'active':''} ${step<1?'locked':''}`}><div className="checkout-card-title"><span>{step>1?<Check/>:'02'}</span><div><h2>Payment method</h2><p>Choose how you’d like to pay.</p></div>{step>1&&<button onClick={()=>setStep(1)}>Edit</button>}</div>{step===1&&<div className="payment-options">{[{id:'upi',icon:Zap,title:'UPI / Razorpay',copy:'Google Pay, PhonePe, Paytm'},{id:'card',icon:CreditCard,title:'Credit or debit card',copy:'Visa, Mastercard, RuPay'},{id:'cod',icon:WalletCards,title:'Cash on delivery',copy:'Pay when your order arrives'}].map(o=><label className={payment===o.id?'selected':''} key={o.id}><input type="radio" name="payment" checked={payment===o.id} onChange={()=>setPayment(o.id)}/><span><o.icon/></span><div><b>{o.title}</b><small>{o.copy}</small></div><i/></label>)}<div className="checkout-nav"><button className="btn btn-ghost" onClick={()=>setStep(0)}>Back</button><button className="btn btn-primary" onClick={()=>setStep(2)}>Review order <ArrowRight size={16}/></button></div></div>}{step>1&&<p className="collapsed-value">{payment==='upi'?'UPI via Razorpay':payment==='card'?'Credit or debit card':'Cash on delivery'}</p>}</Glass>
    <Glass className={`checkout-card ${step===2?'active':''} ${step<2?'locked':''}`}><div className="checkout-card-title"><span>03</span><div><h2>Review order</h2><p>One last look before it’s yours.</p></div></div>{step===2&&<div className="review-order">{cart.map(i=><div key={i.product.id}><img src={i.product.image}/><span><b>{i.product.name}</b><small>Qty {i.quantity}</small></span><strong>{formatPrice(i.product.price*i.quantity)}</strong></div>)}<button className="btn btn-orange btn-block" onClick={()=>next()}>Place order · {formatPrice(total)} <ArrowRight size={16}/></button><p><ShieldCheck/> By placing this order, you agree to our terms.</p></div>}</Glass>
  </div><Glass className="checkout-summary"><h2>Your order</h2>{cart.map(i=><div className="summary-product" key={i.product.id}><span><img src={i.product.image}/><i>{i.quantity}</i></span><div><b>{i.product.name}</b><small>{i.product.category}</small></div><strong>{formatPrice(i.product.price*i.quantity)}</strong></div>)}<div className="summary-lines"><span>Subtotal <b>{formatPrice(subtotal)}</b></span><span>Delivery <b className="free">Free</b></span><span>Tax <b>{formatPrice(tax)}</b></span></div><div className="summary-total"><span>Total</span><strong>{formatPrice(total)}</strong></div><div className="summary-help"><ShieldCheck/><p><b>Buyer protection</b><br/>Secure payment and 30-day returns.</p></div></Glass></div></StoreShell>;
}

export function OrderSuccessPage() {
  return <StoreShell minimal><Glass className="success-card"><div className="success-icon"><CircleCheck/><i/><i/></div><span className="eyebrow">Order confirmed</span><h1>It’s officially yours.</h1><p>Thanks, Ananya. We’ve received your order and will let you know the moment it’s on the move.</p><Glass className="success-order"><span>Order number <b>#DOS-847291</b></span><span>Estimated delivery <b>Tomorrow, 28 Aug</b></span></Glass><div className="success-actions"><Link to="/track/DOS-847291" className="btn btn-primary">Track your order <ArrowRight size={16}/></Link><Link to="/" className="btn btn-ghost">Continue shopping</Link></div><small><Clock3 size={13}/> A confirmation has been sent to ananya@example.com</small></Glass></StoreShell>;
}
