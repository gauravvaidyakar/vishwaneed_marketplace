import { ArrowRight, CheckCircle2, CreditCard, MapPin, ShieldCheck, Truck } from 'lucide-react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { marketplaceApi, runtimeConfig } from '../api';
import type { CheckoutSummary, OrderConfirmation, PaymentMethod } from '../api/types';
import { getErrorMessage } from '../api/errors';
import { EmptyState, ErrorState, LoadingState } from '../components/ui/AsyncState';
import { formatMoney } from '../components/ui/format';
import { addressesKey } from './AddressesPage';
import { cartKey, useCart } from '../features/cart/hooks';

export function CheckoutPage() {
  const cart = useCart();
  const addresses = useQuery({ queryKey: addressesKey, queryFn: () => marketplaceApi.getAddresses() });
  const [addressId, setAddressId] = useState('');
  const [summary, setSummary] = useState<CheckoutSummary | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const preferred = addresses.data?.find((address) => address.isDefault) ?? addresses.data?.[0];
    if (preferred && !addressId) setAddressId(preferred.id);
  }, [addressId, addresses.data]);

  const validate = useMutation({ mutationFn: (selectedAddress: string) => marketplaceApi.validateCheckout(selectedAddress), onSuccess: setSummary });
  const createOrder = useMutation({
    mutationFn: () => {
      if (!summary) throw new Error('Validate checkout before placing the order.');
      return marketplaceApi.createOrder({ quoteId: summary.quoteId, addressId, paymentMethod });
    },
    onSuccess: (confirmation: OrderConfirmation) => {
      void queryClient.invalidateQueries({ queryKey: cartKey });
      void navigate('/order-confirmation', { replace: true, state: { confirmation } });
    },
  });

  if (cart.isLoading || addresses.isLoading) return <div className="page shell"><LoadingState label="Preparing checkout" /></div>;
  if (cart.isError || addresses.isError) return <div className="page shell"><ErrorState message={getErrorMessage(cart.error ?? addresses.error)} /></div>;
  if (!cart.data?.itemCount) return <div className="page shell"><EmptyState title="Your cart is empty" message="Add products before starting checkout." action={<Link className="button button--primary" to="/products">Browse products</Link>} /></div>;

  return <div className="page shell checkout-page"><div className="checkout-steps" aria-label="Checkout progress"><span className="complete"><CheckCircle2 /> Cart</span><ArrowRight /><span className="active">Address & quote</span><ArrowRight /><span>Confirmation</span></div><div className="page-heading"><div><span className="eyebrow">Secure checkout</span><h1>Review your delivery</h1><p>One customer checkout, grouped vendor-wise for fulfilment.</p></div></div><div className="checkout-layout"><section className="checkout-main"><div className="checkout-card"><div className="card-title"><MapPin /><div><h2>Delivery address</h2><p>Select a saved address for the backend shipping quote.</p></div><Link to="/addresses">Manage</Link></div>{addresses.data?.length ? <div className="checkout-addresses">{addresses.data.map((address) => <label key={address.id} className={addressId === address.id ? 'selected' : ''}><input type="radio" name="address" checked={addressId === address.id} onChange={() => { setAddressId(address.id); setSummary(null); }} /><span><strong>{address.label} · {address.recipientName}</strong><small>{address.line1}, {address.city}, {address.state} — {address.pincode}</small></span></label>)}</div> : <EmptyState title="No address saved" message="Add an address before checkout." action={<Link className="button button--secondary" to="/addresses">Add address</Link>} />}</div><div className="checkout-card"><div className="card-title"><Truck /><div><h2>Items by vendor</h2><p>Each vendor group receives its own shipment and tracking.</p></div></div>{cart.data.groups.map((group) => <div className="checkout-vendor" key={group.vendor.id}><div><strong>{group.vendor.name}</strong><span>{group.items.length} product{group.items.length === 1 ? '' : 's'}</span></div><span>{formatMoney(group.productSubtotal)}</span></div>)}</div>{summary && <div className="checkout-card"><div className="card-title"><CreditCard /><div><h2>Payment method</h2><p>The backend-provided quote is valid until {new Date(summary.expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.</p></div></div><label className="payment-choice selected"><input type="radio" name="payment" checked={paymentMethod === 'COD'} onChange={() => setPaymentMethod('COD')} /><span><strong>Cash on delivery</strong><small>Payment will be tracked as COD, not prepaid success.</small></span></label><label className={`payment-choice ${paymentMethod === 'PREPAID' ? 'selected' : ''} ${runtimeConfig.isMock ? 'disabled' : ''}`}><input type="radio" name="payment" value="PREPAID" disabled={runtimeConfig.isMock} checked={paymentMethod === 'PREPAID'} onChange={() => setPaymentMethod('PREPAID')} /><span><strong>UPI / card / net banking</strong><small>{runtimeConfig.isMock ? 'Waiting for Developer 2 payment-session and verification APIs.' : 'Continue to the secure payment provider.'}</small></span></label></div>}</section><aside className="order-summary checkout-summary"><h2>Price details</h2>{summary ? <><div><span>Product subtotal</span><strong>{formatMoney(summary.productSubtotal)}</strong></div>{summary.vendors.map((group) => <div key={group.vendor.id}><span>Shipping · {group.vendor.name}</span><strong>{formatMoney(group.shipping)}</strong></div>)}<div><span>Total shipping</span><strong>{formatMoney(summary.totalShipping)}</strong></div><div className="summary-total"><span>Final payable amount</span><strong>{formatMoney(summary.payableTotal)}</strong></div><small>GST-inclusive product prices. Amounts are supplied by the checkout API.</small><button className="button button--primary button--full" disabled={createOrder.isPending} onClick={() => createOrder.mutate()}>{createOrder.isPending ? 'Placing order…' : runtimeConfig.isMock ? 'Place development COD order' : paymentMethod === 'COD' ? 'Place COD order' : 'Continue to payment'}</button></> : <><p className="summary-note">Select an address, then request a fresh backend quote for price, stock and vendor-wise shipping.</p><button className="button button--primary button--full" type="button" disabled={!addressId || validate.isPending} onClick={() => validate.mutate(addressId)}>{validate.isPending ? 'Validating…' : 'Get checkout quote'}</button></>}{(validate.isError || createOrder.isError) && <p className="form-error" role="alert">{getErrorMessage(validate.error ?? createOrder.error)}</p>}<span className="secure-note"><ShieldCheck size={17} /> Backend remains the source of truth.</span></aside></div></div>;
}
