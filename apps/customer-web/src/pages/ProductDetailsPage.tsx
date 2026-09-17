import { ArrowLeft, Check, Minus, Plus, ShieldCheck, ShoppingBag, Star, Truck } from 'lucide-react';
import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getErrorMessage } from '../api/errors';
import { ErrorState, LoadingState } from '../components/ui/AsyncState';
import { discountPercentage, formatMoney } from '../components/ui/format';
import { useAddToCart } from '../features/cart/hooks';
import { useProduct } from '../features/catalogue/hooks';

export function ProductDetailsPage() {
  const { productId = '' } = useParams();
  const productQuery = useProduct(productId);
  const addToCart = useAddToCart();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [notice, setNotice] = useState('');

  if (productQuery.isLoading) return <div className="page shell"><LoadingState label="Loading product" /></div>;
  if (productQuery.isError || !productQuery.data) return <div className="page shell"><ErrorState message={getErrorMessage(productQuery.error)} onRetry={() => void productQuery.refetch()} /></div>;

  const product = productQuery.data;
  const outOfStock = product.stockStatus === 'OUT_OF_STOCK';
  const discount = discountPercentage(product.price, product.mrp);
  const add = async (buyNow = false) => {
    try {
      await addToCart.mutateAsync({ productId: product.id, quantity });
      setNotice(`${product.name} added to cart.`);
      if (buyNow) void navigate('/cart');
    } catch (error) {
      setNotice(getErrorMessage(error));
    }
  };

  return (
    <div className="page shell">
      <Link className="back-link" to="/products"><ArrowLeft size={17} /> Back to products</Link>
      <article className="product-detail">
        <section className="gallery" aria-label="Product images">
          <div className="gallery-main"><img src={product.images[activeImage]} alt={`${product.name} view ${activeImage + 1}`} /></div>
          <div className="thumbnails">{product.images.map((image, index) => <button key={image} className={index === activeImage ? 'active' : ''} type="button" onClick={() => setActiveImage(index)} aria-label={`Show product image ${index + 1}`}><img src={image} alt="" /></button>)}</div>
        </section>
        <section className="product-info">
          <p className="breadcrumbs">{product.categoryName} · {product.productType === 'RAW_COMMODITY' ? 'Raw / commodity' : 'Value-added'}</p>
          <h1>{product.name}</h1>
          <div className="detail-rating"><Star size={17} fill="currentColor" /> <strong>{product.rating}</strong><span>({product.reviewCount} verified reviews)</span></div>
          <p className="vendor-byline">Sold by <strong>{product.vendor.name}</strong> · {product.vendor.location}</p>
          <div className="detail-price"><strong>{formatMoney(product.price)}</strong>{product.mrp && <del>{formatMoney(product.mrp)}</del>}{discount !== null && <span>{discount}% off</span>}</div>
          <p className="gst-note">Inclusive of applicable GST</p>
          <div className={`stock-status stock-status--${product.stockStatus.toLowerCase()}`}><Check size={16} /> {product.stockStatus === 'IN_STOCK' ? `In stock (${product.availableQuantity} units)` : product.stockStatus === 'LOW_STOCK' ? `Only ${product.availableQuantity} left` : 'Currently out of stock'}</div>
          <p className="detail-description">{product.description}</p>
          <p><strong>Net weight:</strong> {product.weight}</p>
          <div className="purchase-row">
            <div className="quantity-control" aria-label="Quantity"><button type="button" aria-label="Decrease quantity" disabled={quantity <= 1} onClick={() => setQuantity((value) => Math.max(1, value - 1))}><Minus size={16} /></button><span>{quantity}</span><button type="button" aria-label="Increase quantity" disabled={quantity >= product.availableQuantity} onClick={() => setQuantity((value) => Math.min(product.availableQuantity, value + 1))}><Plus size={16} /></button></div>
            <button className="button button--primary" type="button" disabled={outOfStock || addToCart.isPending} onClick={() => void add()}><ShoppingBag size={18} /> Add to cart</button>
            <button className="button button--accent" type="button" disabled={outOfStock || addToCart.isPending} onClick={() => void add(true)}>Buy now</button>
          </div>
          <p className="form-message" aria-live="polite">{notice}</p>
          <div className="delivery-trust"><span><Truck /> Vendor-wise shipping is quoted at checkout</span><span><ShieldCheck /> Secure marketplace checkout</span></div>
        </section>
      </article>
      <section className="detail-panels">
        <div><h2>Ingredients</h2>{product.ingredients?.length ? <ul>{product.ingredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}</ul> : <p>Not supplied by the vendor.</p>}</div>
        <div><h2>Product information</h2><dl>{Object.entries(product.specifications).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></div>
        <div><h2>About the producer</h2><p><strong>{product.vendor.name}</strong></p><p>{product.vendor.location}</p><p>★ {product.vendor.rating} marketplace rating</p></div>
      </section>
    </div>
  );
}
