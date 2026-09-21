import { ArrowLeft, ExternalLink, MapPin, PackageSearch, RefreshCw } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import type { Shipment } from '../api/types';
import { getErrorMessage } from '../api/errors';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/AsyncState';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useOrder, useShipmentTracking } from '../features/orders/hooks';

function ShipmentTrackingCard({ vendorName, initial }: { vendorName: string; initial: Shipment }) {
  const tracking = useShipmentTracking(initial.id);
  const shipment = tracking.data ?? initial;
  return <article className="tracking-card"><header><div><span>{vendorName}</span><h2>{shipment.carrier ?? shipment.provider}</h2><p>{shipment.awb ? `AWB ${shipment.awb}` : 'AWB pending'}</p></div><StatusBadge status={shipment.status} /></header>{tracking.isError && <ErrorState message={getErrorMessage(tracking.error)} onRetry={() => void tracking.refetch()} />}<div className="tracking-actions"><span>Updated {new Date(shipment.updatedAt).toLocaleString('en-IN')}</span><button className="text-button" type="button" onClick={() => void tracking.refetch()}><RefreshCw size={15} /> Refresh</button>{shipment.trackingUrl && <a href={shipment.trackingUrl} target="_blank" rel="noreferrer">Carrier tracking <ExternalLink size={14} /></a>}</div><ol className="tracking-timeline">{[...shipment.events].reverse().map((event, index) => <li className={index === 0 ? 'current' : ''} key={event.id}><span /><div><strong>{event.label}</strong>{event.location && <small><MapPin size={13} /> {event.location}</small>}<time>{new Date(event.occurredAt).toLocaleString('en-IN')}</time></div></li>)}</ol></article>;
}

export function TrackingPage() {
  const { orderId = '' } = useParams();
  const order = useOrder(orderId);
  if (order.isLoading) return <div className="page shell"><LoadingState label="Loading shipment tracking" /></div>;
  if (order.isError) return <div className="page shell"><ErrorState message={getErrorMessage(order.error)} onRetry={() => void order.refetch()} /></div>;
  if (!order.data) return <div className="page shell"><EmptyState title="Order not found" message="Tracking is unavailable for this order." /></div>;
  const shipments = order.data.vendorOrders.filter((vendorOrder) => vendorOrder.shipment);
  return <div className="page shell"><Link className="back-link" to={`/orders/${orderId}`}><ArrowLeft size={17} /> Back to order</Link><div className="page-heading"><div><span className="eyebrow">Vendor-wise delivery</span><h1>Track order #{order.data.masterOrderNumber}</h1><p>Each producer shipment progresses independently.</p></div></div>{shipments.length === 0 ? <EmptyState title="Tracking not available yet" message="Shipment and AWB information will appear when returned by the backend." action={<button className="button button--secondary" type="button" onClick={() => void order.refetch()}><PackageSearch size={17} /> Refresh order</button>} /> : <div className="tracking-grid">{shipments.map((vendorOrder) => <ShipmentTrackingCard key={vendorOrder.id} vendorName={vendorOrder.vendor.name} initial={vendorOrder.shipment!} />)}</div>}</div>;
}
