import { MapPin, Package, Settings, UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

export function AccountPage() {
  const { session, logout } = useAuth();
  if (!session) return null;
  return <div className="page shell account-page"><div className="page-heading"><div><span className="eyebrow">Customer account</span><h1>Hello, {session.customer.name}</h1><p>Manage your shopping profile and delivery preferences.</p></div><button className="button button--secondary" type="button" onClick={() => void logout()}>Log out</button></div><div className="account-grid"><section className="account-profile"><div className="profile-avatar"><UserRound /></div><h2>{session.customer.name}</h2><p>{session.customer.email ?? session.customer.mobile}</p><span>Customer account</span></section><div className="account-links"><Link to="/addresses"><MapPin /><span><strong>Delivery addresses</strong><small>Add, edit or select your default address</small></span></Link><div className="disabled-account-link"><Package /><span><strong>My orders</strong><small>Requires Developer 2 order-history API</small></span></div><div className="disabled-account-link"><Settings /><span><strong>Profile settings</strong><small>Requires customer-profile API integration</small></span></div></div></div></div>;
}
