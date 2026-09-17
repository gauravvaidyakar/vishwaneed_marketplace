import { Instagram, Mail, MapPin, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="shell footer-grid">
        <div>
          <Link className="brand brand--footer" to="/"><span className="brand-mark">V</span><span><strong>Vishwaneed</strong><small>Made in India. Made for you.</small></span></Link>
          <p>Connecting trusted rural producers with homes across India through a transparent marketplace.</p>
        </div>
        <div><h2>Shop</h2><Link to="/products">All products</Link><Link to="/products?category=cat-millets">Millets</Link><Link to="/products?category=cat-jaggery">Jaggery</Link><Link to="/products?category=cat-pickles">Pickles</Link></div>
        <div><h2>Customer care</h2><Link to="/account">My account</Link><Link to="/addresses">Addresses</Link><span>Shipping & returns</span><span>Help centre</span></div>
        <div><h2>Contact</h2><span><MapPin size={16} /> Pune, Maharashtra</span><span><Phone size={16} /> +91 00000 00000</span><span><Mail size={16} /> care@vishwaneed.example</span><span><Instagram size={16} /> @vishwaneed</span></div>
      </div>
      <div className="shell footer-bottom"><span>© {new Date().getFullYear()} Vishwaneed Marketplace</span><span>Privacy · Terms · Accessibility</span></div>
    </footer>
  );
}
