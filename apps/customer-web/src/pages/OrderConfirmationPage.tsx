import { CheckCircle2, PackageCheck, Truck } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { getErrorMessage } from '../api/errors';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/AsyncState';
import { formatMoney } from '../components/ui/format';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useOrder } from '../features/orders/hooks';

export function OrderConfirmationPage() {
  const { orderId = '' } = useParams();
  const order = useOrder(orderId);
  if (order.isLoading) return <div className="page shell"><LoadingState label="Confirming your order" /></div>;
  if (order.isError) return <div className="page shell"><ErrorState message={getErrorMessage(order.error)} onRetry={() => void order.refetch()} /></div>;
  if (!order.data) return <div className="page shell"><EmptyState title="Order confirmation unavailable" message="Open the order from My Orders and try again." action={<Link className="button button--primary" to="/orders">My orders</Link>} /></div>;
  const value = order.data;
  return <div className="page shell confirmation-page"><div className="confirmation-success"><CheckCircle2 /><span className="eyebrow">Order received</span><h1>Your order has been placed</h1><p>Master order <strong>#{value.masterOrderNumber}</strong></p><p>{value.paymentMethod === 'COD' ? 'Cash on delivery selected. Payment has not been marked as prepaid.' : value.paymentStatus === 'PAID' ? 'Online payment verified by the backend.' : 'Payment is awaiting backend verification.'}</p></div><section className="confirmation-summary"><div><span>Placed</span><strong>{new Date(value.placedAt).toLocaleString('en-IN')}</strong></div><div><span>Amount</span><strong>{formatMoney(value.payableTotal)}</strong></div><div><span>Payment status</span><StatusBadge status={value.paymentStatus} /></div></section><div className="confirmation-orders"><h2>Vendor-wise sub-orders</h2>{value.vendorOrders.map((vendorOrder) => <article key={vendorOrder.id}><PackageCheck /><div><strong>#{vendorOrder.id} · {vendorOrder.vendor.name}</strong><span>{vendorOrder.items.length} item{vendorOrder.items.length === 1 ? '' : 's'} · {vendorOrder.estimatedDelivery ?? 'Delivery estimate pending'}</span>{vendorOrder.shipment && <small><Truck size={13} /> {vendorOrder.shipment.statusLabel}{vendorOrder.shipment.awb ? ` · AWB ${vendorOrder.shipment.awb}` : ''}</small>}</div><div><StatusBadge status={vendorOrder.status} /><strong>{formatMoney(vendorOrder.orderTotal)}</strong></div></article>)}</div><div className="confirmation-actions"><Link className="button button--primary" to={`/orders/${value.masterOrderId}`}>View order details</Link><Link className="button button--secondary" to="/products">Continue shopping</Link></div></div>;
}
