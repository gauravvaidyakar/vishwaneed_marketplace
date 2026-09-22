import { ArrowRight, BadgeCheck, Image as ImageIcon, Leaf, PackageCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import { ProductGrid } from '../components/product/ProductGrid';
import { ErrorState, LoadingState } from '../components/ui/AsyncState';
import { useCategories, useProducts } from '../features/catalogue/hooks';
import type { VendorSummary } from '../api/types';

export function HomePage() {
  const categories = useCategories();
  const featured = useProducts({ limit: 4, page: 1, sort: 'NEWEST' });
  const bestSellers = useProducts({ sort: 'POPULAR', limit: 4, page: 1 });
  const featuredVendors = useMemo(() => {
    const vendors = new Map<string, VendorSummary>();
    [...(featured.data?.items ?? []), ...(bestSellers.data?.items ?? [])].forEach((product) => {
      vendors.set(product.vendor.id, product.vendor);
    });
    return [...vendors.values()].slice(0, 4);
  }, [bestSellers.data?.items, featured.data?.items]);

  return (
    <>
      <section className="home-hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Pure · Natural · Made in India</span>
            <h1>From our villages,<br /><em>to your home.</em></h1>
            <p>Discover honest food made by rural producers using traditional methods and carefully selected ingredients.</p>
            <div className="hero-actions"><Link className="button button--primary" to="/products">Shop now <ArrowRight size={18} /></Link><a className="button button--ghost" href="#our-story">Know our story</a></div>
            <div className="hero-proof"><span><BadgeCheck size={18} /> Verified producers</span><span><Leaf size={18} /> Thoughtful sourcing</span></div>
          </div>
          <div className="hero-image-wrap">
            <img src="https://images.unsplash.com/photo-1464226184884-fa280b87c399?auto=format&fit=crop&w=1400&q=88" alt="Baskets of freshly harvested gourds and cucumbers" />
            <div className="hero-card"><span>{featured.data?.meta.total ?? '—'}</span><small>approved products, one trusted marketplace</small></div>
          </div>
        </div>
      </section>

      <section className="trust-strip"><div className="shell"><span><PackageCheck /> Secure marketplace checkout</span><span><Truck /> Vendor-wise delivery visibility</span><span><BadgeCheck /> Approved products only</span></div></section>

      <section className="section shell" aria-labelledby="categories-heading">
        <div className="section-heading"><div><span className="eyebrow">Explore</span><h2 id="categories-heading">Shop by category</h2></div><Link to="/products">View all <ArrowRight size={17} /></Link></div>
        {categories.isLoading && <LoadingState label="Loading categories" />}
        {categories.isError && <ErrorState message="Categories are unavailable." onRetry={() => void categories.refetch()} />}
        {categories.data && <div className="category-grid">{categories.data.map((category) => <Link className="category-card" key={category.id} to={`/products?category=${category.id}`}>{category.imageUrl ? <img src={category.imageUrl} alt="" /> : <span className="category-image-fallback" aria-hidden="true"><ImageIcon /></span>}<div><h3>{category.name}</h3><p>{category.description}</p></div><ArrowRight aria-hidden="true" /></Link>)}</div>}
      </section>

      <section className="story-section" id="our-story"><div className="shell story-grid"><div><span className="eyebrow">Made in India story</span><h2>Real producers. Real food. A fairer connection.</h2><p>Vishwaneed helps customers discover regionally rooted food while giving rural producers a clear path to market. Every listed product moves through marketplace approval before it reaches the store.</p><Link className="text-link" to="/products">Discover the marketplace <ArrowRight size={17} /></Link></div><img src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=85" alt="A farmer working in green fields" /></div></section>

      <section className="section shell" aria-labelledby="featured-heading">
        <div className="section-heading"><div><span className="eyebrow">Freshly approved</span><h2 id="featured-heading">New arrivals</h2></div><Link to="/products?sort=NEWEST">View all <ArrowRight size={17} /></Link></div>
        {featured.isLoading && <LoadingState label="Loading new arrivals" />}
        {featured.isError && <ErrorState message="New arrivals are unavailable." onRetry={() => void featured.refetch()} />}
        {featured.data && <ProductGrid products={featured.data.items} compact />}
      </section>

      <section className="promo-section"><div className="shell promo-grid"><div><span className="eyebrow eyebrow--light">Millet goodness</span><h2>Everyday staples, grown with care.</h2><p>Build a better pantry with unpolished grains, stone-ground flours and mindful snacks.</p><Link className="button button--light" to="/products?category=millets">Explore millets <ArrowRight size={18} /></Link></div><div className="promo-stat"><strong>GST-inclusive</strong><span>Product prices are shown clearly, without adding tax twice.</span></div></div></section>

      <section className="section shell" aria-labelledby="vendors-heading">
        <div className="section-heading"><div><span className="eyebrow">Trusted producers</span><h2 id="vendors-heading">Featured products</h2></div></div>
        {(featured.isLoading || bestSellers.isLoading) && <LoadingState label="Loading approved vendors" />}
        {(featured.isError || bestSellers.isError) && <ErrorState message="Approved vendors are unavailable." onRetry={() => { void featured.refetch(); void bestSellers.refetch(); }} />}
        {featuredVendors.length > 0 && <div className="vendor-grid">{featuredVendors.map((vendor) => <article className="vendor-card" key={vendor.id}><div className="vendor-avatar">{vendor.name.charAt(0)}</div><div><h3>{vendor.name}</h3><p>{vendor.location}</p><span>{vendor.productCount} approved {vendor.productCount === 1 ? 'product' : 'products'}</span></div></article>)}</div>}
      </section>

      <section className="section shell" aria-labelledby="best-heading">
        <div className="section-heading"><div><span className="eyebrow">Customer favourites</span><h2 id="best-heading">Best sellers</h2></div><Link to="/products?sort=POPULAR">View all <ArrowRight size={17} /></Link></div>
        {bestSellers.isLoading && <LoadingState label="Loading best sellers" />}
        {bestSellers.isError && <ErrorState message="Best sellers are unavailable." onRetry={() => void bestSellers.refetch()} />}
        {bestSellers.data && <ProductGrid products={bestSellers.data.items} compact />}
      </section>
    </>
  );
}
