import { CheckCircle2, PackageCheck } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import type { OrderConfirmation } from '../api/types';
import { EmptyState } from '../components/ui/AsyncState';
import { formatMoney } from '../components/ui/format';

export function OrderConfirmationPage() {
  const location = useLocation();
  const confirmation = (location.state as { confirmation?: OrderConfirmation } | null)?.confirmation;
  if (!confirmation) return <div className="page shell"><EmptyState title="No new order to show" message="Order confirmation is displayed only after the backend creates an order." action={<Link className="button button--primary" to="/products">Continue shopping</Link>} /></div>;
  return <div className="page shell confirmation-page"><div className="confirmation-success"><CheckCircle2 /><span className="eyebrow">Order received</span><h1>Your order has been placed</h1><p>Master order <strong>#{confirmation.masterOrderId}</strong></p><p>{confirmation.paymentMethod === 'COD' ? 'Cash on delivery selected. Payment has not been marked as prepaid.' : 'Payment is pending backend verification.'}</p></div><section className="confirmation-summary"><div><span>Placed</span><strong>{new Date(confirmation.placedAt).toLocaleString('en-IN')}</strong></div><div><span>Amount payable</span><strong>{formatMoney(confirmation.payableTotal)}</strong></div><div><span>Payment status</span><strong>{confirmation.paymentStatus.replaceAll('_', ' ')}</strong></div></section><div className="confirmation-orders"><h2>Vendor-wise sub-orders</h2>{confirmation.vendorOrders.map((order) => <article key={order.id}><PackageCheck /><div><strong>#{order.id} · {order.vendorName}</strong><span>{order.status.replaceAll('_', ' ')} · {order.estimatedDelivery}</span></div><strong>{formatMoney(order.amount)}</strong></article>)}</div><div className="confirmation-actions"><Link className="button button--primary" to="/products">Continue shopping</Link><Link className="button button--secondary" to="/account">Go to account</Link></div></div>;
}
