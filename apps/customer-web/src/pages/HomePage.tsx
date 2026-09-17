import { ArrowRight, BadgeCheck, Leaf, PackageCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProductGrid } from '../components/product/ProductGrid';
import { ErrorState, LoadingState } from '../components/ui/AsyncState';
import { useCategories, useProducts } from '../features/catalogue/hooks';
import { mockVendors } from '../api/mockData';

export function HomePage() {
  const categories = useCategories();
  const featured = useProducts({ featured: true, limit: 4, page: 1 });
  const bestSellers = useProducts({ bestSeller: true, limit: 4, page: 1 });

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
            <div className="hero-card"><span>250+</span><small>rural products, one trusted marketplace</small></div>
          </div>
        </div>
      </section>

      <section className="trust-strip"><div className="shell"><span><PackageCheck /> Secure marketplace checkout</span><span><Truck /> Vendor-wise delivery visibility</span><span><BadgeCheck /> Approved products only</span></div></section>

      <section className="section shell" aria-labelledby="categories-heading">
        <div className="section-heading"><div><span className="eyebrow">Explore</span><h2 id="categories-heading">Shop by category</h2></div><Link to="/products">View all <ArrowRight size={17} /></Link></div>
        {categories.isLoading && <LoadingState label="Loading categories" />}
        {categories.isError && <ErrorState message="Categories are unavailable." onRetry={() => void categories.refetch()} />}
        {categories.data && <div className="category-grid">{categories.data.map((category) => <Link className="category-card" key={category.id} to={`/products?category=${category.id}`}><img src={category.imageUrl} alt="" /><div><h3>{category.name}</h3><p>{category.description}</p></div><ArrowRight aria-hidden="true" /></Link>)}</div>}
      </section>

      <section className="story-section" id="our-story"><div className="shell story-grid"><div><span className="eyebrow">Made in India story</span><h2>Real producers. Real food. A fairer connection.</h2><p>Vishwaneed helps customers discover regionally rooted food while giving rural producers a clear path to market. Every listed product moves through marketplace approval before it reaches the store.</p><Link className="text-link" to="/products">Discover the marketplace <ArrowRight size={17} /></Link></div><img src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=1200&q=85" alt="A farmer working in green fields" /></div></section>

      <section className="section shell" aria-labelledby="featured-heading">
        <div className="section-heading"><div><span className="eyebrow">Chosen for you</span><h2 id="featured-heading">Featured products</h2></div><Link to="/products">View all <ArrowRight size={17} /></Link></div>
        {featured.isLoading && <LoadingState label="Loading featured products" />}
        {featured.isError && <ErrorState message="Featured products are unavailable." onRetry={() => void featured.refetch()} />}
        {featured.data && <ProductGrid products={featured.data.items} compact />}
      </section>

      <section className="promo-section"><div className="shell promo-grid"><div><span className="eyebrow eyebrow--light">Millet goodness</span><h2>Everyday staples, grown with care.</h2><p>Build a better pantry with unpolished grains, stone-ground flours and mindful snacks.</p><Link className="button button--light" to="/products?category=cat-millets">Explore millets <ArrowRight size={18} /></Link></div><div className="promo-stat"><strong>GST-inclusive</strong><span>Product prices are shown clearly, without adding tax twice.</span></div></div></section>

      <section className="section shell" aria-labelledby="vendors-heading">
        <div className="section-heading"><div><span className="eyebrow">Trusted producers</span><h2 id="vendors-heading">Featured vendors</h2></div></div>
        <div className="vendor-grid">{mockVendors.map((vendor) => <article className="vendor-card" key={vendor.id}><div className="vendor-avatar">{vendor.name.charAt(0)}</div><div><h3>{vendor.name}</h3><p>{vendor.location}</p><span>★ {vendor.rating} · {vendor.productCount} products</span></div></article>)}</div>
      </section>

      <section className="section shell" aria-labelledby="best-heading">
        <div className="section-heading"><div><span className="eyebrow">Customer favourites</span><h2 id="best-heading">Best sellers</h2></div><Link to="/products?sort=POPULAR">View all <ArrowRight size={17} /></Link></div>
        {bestSellers.isLoading && <LoadingState label="Loading best sellers" />}
        {bestSellers.data && <ProductGrid products={bestSellers.data.items} compact />}
      </section>
    </>
  );
}
