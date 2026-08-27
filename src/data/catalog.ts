export type Product = {
  id: string;
  name: string;
  category: string;
  brand: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  stock: number;
  sku: string;
  image: string;
  gallery: string[];
  description: string;
  specs: Record<string, string>;
  badge?: string;
  colors?: string[];
};

const img = (id: string) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1000&q=85`;

export const products: Product[] = [
  {
    id: 'aura-headphones', name: 'Aura Pro Headphones', category: 'Electronics', brand: 'Nexa',
    price: 12999, originalPrice: 15999, rating: 4.8, reviews: 428, stock: 34, sku: 'NX-AUR-101', badge: 'Bestseller',
    image: img('photo-1505740420928-5e560c06d30e'),
    gallery: [img('photo-1505740420928-5e560c06d30e'), img('photo-1484704849700-f032a568e944'), img('photo-1546435770-a3e426bf472b')],
    description: 'Immersive spatial sound meets all-day comfort. Aura Pro combines adaptive noise cancellation, studio-tuned 40mm drivers, and a refined lightweight frame.',
    specs: { 'Battery': '38 hours', 'Connectivity': 'Bluetooth 5.3', 'Weight': '254 g', 'Warranty': '2 years' }, colors: ['#1a1a2e', '#e8e4dc', '#7c3aed']
  },
  {
    id: 'arc-keyboard', name: 'Arc 75 Mechanical', category: 'Office', brand: 'Keyhaus',
    price: 8499, rating: 4.7, reviews: 186, stock: 18, sku: 'KH-ARC-075', badge: 'New',
    image: img('photo-1587829741301-dc798b83add3'),
    gallery: [img('photo-1587829741301-dc798b83add3'), img('photo-1618384887929-16ec33fab9ef')],
    description: 'A compact wireless mechanical keyboard designed for focused work. Hot-swappable switches, gasket mount, and three-device connectivity.',
    specs: { 'Layout': '75%', 'Switches': 'Linear tactile', 'Battery': '4000 mAh', 'Connection': '2.4G / BT / USB-C' }, colors: ['#f4f0e8', '#39343b']
  },
  {
    id: 'pulse-watch', name: 'Pulse One Smartwatch', category: 'Electronics', brand: 'Nexa',
    price: 6299, originalPrice: 7999, rating: 4.6, reviews: 312, stock: 52, sku: 'NX-PLS-001', badge: '20% off',
    image: img('photo-1523275335684-37898b6baf30'),
    gallery: [img('photo-1523275335684-37898b6baf30'), img('photo-1544117519-31a4b719223d')],
    description: 'A beautifully minimal smartwatch with complete wellness tracking and a crisp always-on display.',
    specs: { 'Display': '1.43” AMOLED', 'Battery': '12 days', 'Water resistance': '5 ATM', 'Sensors': 'HR, SpO₂, GPS' }, colors: ['#141414', '#f1cbb5']
  },
  {
    id: 'forge-drill', name: 'Forge X Brushless Drill', category: 'Industrial', brand: 'Forge',
    price: 18990, rating: 4.9, reviews: 96, stock: 12, sku: 'FG-X20-BL', badge: 'Pro choice',
    image: img('photo-1572981779307-38b8cabb2407'),
    gallery: [img('photo-1572981779307-38b8cabb2407'), img('photo-1504148455328-c376907d081c')],
    description: 'Professional brushless drilling power with intelligent torque control. Built for demanding fabrication and installation work.',
    specs: { 'Voltage': '20V', 'Torque': '85 Nm', 'Chuck': '13 mm metal', 'Included': '2 batteries + case' }, colors: ['#ec5b27', '#242327']
  },
  {
    id: 'form-chair', name: 'Form Ergonomic Chair', category: 'Office', brand: 'Forma',
    price: 24999, originalPrice: 28999, rating: 4.8, reviews: 144, stock: 9, sku: 'FM-ERG-BLK', badge: 'Limited',
    image: img('photo-1580480055273-228ff5388ef8'),
    gallery: [img('photo-1580480055273-228ff5388ef8'), img('photo-1598300053650-a1d1eeae6b2b')],
    description: 'A responsive ergonomic chair shaped around the way you move, with breathable mesh and precision lumbar support.',
    specs: { 'Material': 'Performance mesh', 'Load': '150 kg', 'Adjustments': '11-point', 'Warranty': '5 years' }, colors: ['#232323', '#d9d1c5']
  },
  {
    id: 'pack-kit', name: 'EcoShip Mailer Kit', category: 'Packaging', brand: 'GreenPack',
    price: 1499, rating: 4.5, reviews: 78, stock: 138, sku: 'GP-ECO-050', badge: 'Eco',
    image: img('photo-1586528116311-ad8dd3c8310d'),
    gallery: [img('photo-1586528116311-ad8dd3c8310d'), img('photo-1607166452427-7e4477079cb9')],
    description: 'Fifty durable recycled mailers in five useful sizes. Water-resistant, tamper-evident, and fully curbside recyclable.',
    specs: { 'Quantity': '50 units', 'Sizes': '5 assorted', 'Material': '90% recycled', 'Closure': 'Self seal' }
  },
  {
    id: 'nova-laptop', name: 'NovaBook Air 14', category: 'Electronics', brand: 'Nova',
    price: 74990, originalPrice: 82990, rating: 4.7, reviews: 251, stock: 21, sku: 'NV-A14-512', badge: 'Deal',
    image: img('photo-1496181133206-80ce9b88a853'),
    gallery: [img('photo-1496181133206-80ce9b88a853'), img('photo-1517336714731-489689fd1ca8')],
    description: 'An exceptionally light performance laptop with a vivid 2.8K display and quiet all-day power.',
    specs: { 'Processor': 'Nova X1 10-core', 'Memory': '16 GB', 'Storage': '512 GB SSD', 'Display': '14” 2.8K OLED' }, colors: ['#c7c8ca', '#242428']
  },
  {
    id: 'alloy-sheets', name: 'Aluminium 6061 Sheets', category: 'Raw Materials', brand: 'Metaform',
    price: 3890, rating: 4.6, reviews: 41, stock: 67, sku: 'MF-AL6-3MM',
    image: img('photo-1535813547-99c456a41d4a'),
    gallery: [img('photo-1535813547-99c456a41d4a'), img('photo-1504917595217-d4dc5ebe6122')],
    description: 'Precision-cut 6061 aluminium sheets with excellent strength, corrosion resistance, and machining characteristics.',
    specs: { 'Grade': '6061-T6', 'Thickness': '3 mm', 'Size': '600 × 1200 mm', 'Tolerance': '±0.1 mm' }
  }
];

export const categories = [
  { name: 'Electronics', icon: 'Headphones', count: 124, color: '#8b5cf6' },
  { name: 'Industrial', icon: 'Drill', count: 86, color: '#f97316' },
  { name: 'Office', icon: 'Armchair', count: 73, color: '#0ea5e9' },
  { name: 'Raw Materials', icon: 'Blocks', count: 210, color: '#10b981' },
  { name: 'Packaging', icon: 'PackageOpen', count: 48, color: '#ec4899' }
];

export const formatPrice = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

export const order = {
  id: 'DOS-847291', date: '24 Aug 2026', total: 14672,
  status: 'Shipped', estimate: 'Tomorrow, 28 Aug',
  items: [{ product: products[0], quantity: 1 }, { product: products[5], quantity: 1 }]
};

export const leads = [
  { id: 1, name: 'Arjun Mehta', company: 'Verto Systems', value: 480000, stage: 'New', avatar: 'AM', time: '2h ago' },
  { id: 2, name: 'Priya Nair', company: 'Kinship Labs', value: 225000, stage: 'New', avatar: 'PN', time: '5h ago' },
  { id: 3, name: 'Rahul Bedi', company: 'Northstar Mfg.', value: 890000, stage: 'Contacted', avatar: 'RB', time: 'Yesterday' },
  { id: 4, name: 'Sara Khan', company: 'Sonder Retail', value: 350000, stage: 'Qualified', avatar: 'SK', time: '3d ago' },
  { id: 5, name: 'Dev Patel', company: 'Axiom Works', value: 675000, stage: 'Qualified', avatar: 'DP', time: '4d ago' },
  { id: 6, name: 'Maya Iyer', company: 'Creo Studio', value: 420000, stage: 'Proposal', avatar: 'MI', time: '5d ago' },
  { id: 7, name: 'Kabir Shah', company: 'Urban Grid', value: 1120000, stage: 'Won', avatar: 'KS', time: '1w ago' }
];
