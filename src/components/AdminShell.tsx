import { ReactNode, useState } from 'react';
import { BarChart3, Bot, Boxes, ChevronLeft, ChevronRight, CircleDollarSign, Menu, PackageCheck, Search, Settings, ShoppingCart, Sparkles, Users, X } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { Ambient, Logo } from './ui';

const nav = [
  { label: 'Overview', to: '/admin', icon: BarChart3, end: true },
  { label: 'CRM', to: '/admin/crm', icon: Users },
  { label: 'Inventory', to: '/admin/inventory', icon: Boxes },
  { label: 'Sales', to: '/admin', icon: ShoppingCart },
  { label: 'Procurement', to: '/admin/inventory', icon: PackageCheck },
  { label: 'Finance', to: '/admin', icon: CircleDollarSign },
  { label: 'DOS AI', to: '/admin/ai', icon: Bot },
];

export function AdminShell({ children, title, subtitle, action }: { children: ReactNode; title: string; subtitle?: string; action?: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  return <div className={`admin-shell ${collapsed ? 'admin-collapsed' : ''}`}><Ambient/>
    <aside className={`admin-sidebar glass ${mobile ? 'mobile-open' : ''}`}>
      <div className="admin-logo"><Logo admin/><button className="sidebar-mobile-close" onClick={() => setMobile(false)}><X size={18}/></button></div>
      <div className="workspace-pill"><span>DS</span><div><b>DOS Commerce</b><small>Business workspace</small></div></div>
      <nav>{nav.map(item => <NavLink key={item.label} to={item.to} end={item.end} onClick={() => setMobile(false)}><item.icon size={19}/><span>{item.label}</span>{item.label === 'DOS AI' && <em>AI</em>}</NavLink>)}</nav>
      <div className="sidebar-bottom"><NavLink to="/admin"><Settings size={19}/><span>Settings</span></NavLink><div className="admin-user"><span>AK</span><div><b>Ananya Kapoor</b><small>Administrator</small></div></div></div>
      <button className="collapse-button" onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronRight/> : <ChevronLeft/>}</button>
    </aside>
    <section className="admin-content">
      <header className="admin-topbar"><button className="admin-menu" onClick={() => setMobile(true)}><Menu/></button><div className="admin-search"><Search size={18}/><input placeholder="Search anything…"/><kbd>⌘ K</kbd></div><div className="topbar-right"><span className="live-pill"><i/>Live</span><button className="spark-button"><Sparkles size={18}/></button><span className="top-avatar">AK</span></div></header>
      <div className="admin-page"><div className="admin-title"><div><span className="eyebrow">Business workspace</span><h1>{title}</h1>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</div>
    </section>
  </div>;
}
