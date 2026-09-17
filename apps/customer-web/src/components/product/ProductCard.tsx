import { Plus, Star } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { Product } from '../../api/types';
import { getErrorMessage } from '../../api/errors';
import { useAddToCart } from '../../features/cart/hooks';
import { discountPercentage, formatMoney } from '../ui/format';

export function ProductCard({ product }: { product: Product }) {
  const addToCart = useAddToCart();
  const [notice, setNotice] = useState('');
  const discount = discountPercentage(product.price, product.mrp);
  const outOfStock = product.stockStatus === 'OUT_OF_STOCK';

  const add = async () => {
    try {
      await addToCart.mutateAsync({ productId: product.id, quantity: 1 });
      setNotice(`${product.name} added to cart.`);
    } catch (error) {
      setNotice(getErrorMessage(error));
    }
  };

  return (
    <article className="product-card">
      <Link className="product-card-image" to={`/products/${product.slug}`}>
        <img src={product.images[0]} alt={product.name} loading="lazy" />
        {discount !== null && <span className="discount-badge">{discount}% off</span>}
        {outOfStock && <span className="stock-overlay">Out of stock</span>}
      </Link>
      <div className="product-card-body">
        <div className="rating"><Star size={14} fill="currentColor" aria-hidden="true" /><span>{product.rating}</span><span className="muted">({product.reviewCount})</span></div>
        <Link to={`/products/${product.slug}`}><h3>{product.name}</h3></Link>
        <p className="product-meta">{product.weight} · {product.vendor.name}</p>
        <div className="product-price"><strong>{formatMoney(product.price)}</strong>{product.mrp && <del>{formatMoney(product.mrp)}</del>}<small>GST incl.</small></div>
        <button className="add-button" type="button" disabled={outOfStock || addToCart.isPending} onClick={() => void add()}>
          <Plus size={16} aria-hidden="true" /> {addToCart.isPending ? 'Adding…' : outOfStock ? 'Unavailable' : 'Add'}
        </button>
        <p className="sr-only" aria-live="polite">{notice}</p>
      </div>
    </article>
  );
}
