import { ArrowRight, BadgeCheck, Image as ImageIcon, PackageCheck, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMemo } from 'react';
import heroVegetables from '../assets/vishwaneed_hero_vegetables_image.png';
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
  const offers = useMemo(() => [...(featured.data?.items ?? []), ...(bestSellers.data?.items ?? [])]
    .filter((product, index, all) => product.mrp && product.mrp.amount > product.price.amount && all.findIndex((candidate) => candidate.id === product.id) === index)
    .slice(0, 4), [bestSellers.data?.items, featured.data?.items]);
  const trending = useMemo(() => [...(bestSellers.data?.items ?? []), ...(featured.data?.items ?? [])]
    .filter((product, index, all) => all.findIndex((candidate) => candidate.id === product.id) === index)
    .slice(0, 4), [bestSellers.data?.items, featured.data?.items]);

  return (
    <>
      <section className="home-hero">
        <div className="shell hero-grid">
          <div className="hero-copy">
            <span className="eyebrow">Pure · Natural · Made in India</span>
            <h1>From our<br />villages,<br /><em>to your home.</em></h1>
            <p>Discover honest food made by rural producers using traditional methods and carefully selected ingredients.</p>
            <div className="hero-actions"><Link className="button button--primary" to="/products">Shop now <ArrowRight size={18} /></Link></div>
          </div>
          <div className="hero-image-wrap">
            <img src={heroVegetables} width="800" height="503" fetchPriority="high" decoding="async" alt="A fresh harvest of bitter gourds, carrots, cucumbers and leafy greens" />
          </div>
        </div>
      </section>

      <section className="trust-strip"><div className="shell"><span><PackageCheck /> Secure marketplace checkout</span><span><Truck /> Vendor-wise delivery visibility</span><span><BadgeCheck /> Approved products only</span></div></section>

      <section className="section shell" aria-labelledby="categories-heading">
        <div className="section-heading"><div><span className="eyebrow">Explore</span><h2 id="categories-heading">Shop by category</h2></div><Link to="/products">View all <ArrowRight size={17} /></Link></div>
        {categories.isLoading && <LoadingState label="Loading categories" />}
        {categories.isError && <ErrorState message="Categories are unavailable." onRetry={() => void categories.refetch()} />}
        {categories.data && <div className="category-grid">{categories.data.map((category) => <Link className="category-card" key={category.id} to={`/products?category=${category.id}`}>{category.imageUrl ? <img src={category.imageUrl} alt="" loading="lazy" decoding="async" width="800" height="600" /> : <span className="category-image-fallback" aria-hidden="true"><ImageIcon /></span>}<div><h3>{category.name}</h3><p>{category.description}</p></div><ArrowRight aria-hidden="true" /></Link>)}</div>}
      </section>

      <section className="story-section" id="our-story"><div className="shell story-grid"><div><span className="eyebrow">Made in India story</span><h2>Real producers. Real food. A fairer connection.</h2><p>Vishwaneed helps customers discover regionally rooted food while giving rural producers a clear path to market. Every listed product moves through marketplace approval before it reaches the store.</p><Link className="text-link" to="/products">Discover the marketplace <ArrowRight size={17} /></Link></div><img src="https://images.unsplash.com/photo-1500595046743-cd271d694d30?auto=format&fit=crop&w=960&q=76" width="960" height="720" loading="lazy" decoding="async" alt="A farmer working in green fields" /></div></section>

      <section className="section shell" aria-labelledby="featured-heading">
        <div className="section-heading"><div><span className="eyebrow">Freshly approved</span><h2 id="featured-heading">New arrivals</h2></div><Link to="/products?sort=NEWEST">View all <ArrowRight size={17} /></Link></div>
        {featured.isLoading && <LoadingState label="Loading new arrivals" />}
        {featured.isError && <ErrorState message="New arrivals are unavailable." onRetry={() => void featured.refetch()} />}
        {featured.data && <ProductGrid products={featured.data.items} compact />}
      </section>

      {trending.length > 0 && <section className="section shell" aria-labelledby="trending-heading">
        <div className="section-heading"><div><span className="eyebrow">Popular right now</span><h2 id="trending-heading">Trending products</h2></div><Link to="/products?sort=POPULAR">View all <ArrowRight size={17} /></Link></div>
        <ProductGrid products={trending} compact />
      </section>}

      <section className="promo-section"><div className="shell promo-grid"><div><span className="eyebrow eyebrow--light">Millet goodness</span><h2>Everyday staples, grown with care.</h2><p>Build a better pantry with unpolished grains, stone-ground flours and mindful snacks.</p><Link className="button button--light" to="/products?category=millets">Explore millets <ArrowRight size={18} /></Link></div><div className="promo-stat"><strong>GST-inclusive</strong><span>Product prices are shown clearly, without adding tax twice.</span></div></div></section>

      <section className="section shell" aria-labelledby="vendors-heading">
        <div className="section-heading"><div><span className="eyebrow">Regional marketplace</span><h2 id="vendors-heading">Featured vendors</h2></div></div>
        {(featured.isLoading || bestSellers.isLoading) && <LoadingState label="Loading approved vendors" />}
        {(featured.isError || bestSellers.isError) && <ErrorState message="Approved vendors are unavailable." onRetry={() => { void featured.refetch(); void bestSellers.refetch(); }} />}
        {featuredVendors.length > 0 && <div className="vendor-grid">{featuredVendors.map((vendor) => <article className="vendor-card" key={vendor.id}><div className="vendor-avatar">{vendor.name.charAt(0)}</div><div><h3>{vendor.name}</h3><p>{vendor.location}</p>{vendor.rating > 0 && <p>★ {vendor.rating.toFixed(1)} vendor rating</p>}<span>{vendor.productCount} approved {vendor.productCount === 1 ? 'product' : 'products'}</span></div></article>)}</div>}
      </section>

      <section className="section shell" aria-labelledby="best-heading">
        <div className="section-heading"><div><span className="eyebrow">Customer favourites</span><h2 id="best-heading">Best sellers</h2></div><Link to="/products?sort=POPULAR">View all <ArrowRight size={17} /></Link></div>
        {bestSellers.isLoading && <LoadingState label="Loading best sellers" />}
        {bestSellers.isError && <ErrorState message="Best sellers are unavailable." onRetry={() => void bestSellers.refetch()} />}
        {bestSellers.data && <ProductGrid products={bestSellers.data.items} compact />}
      </section>

      {offers.length > 0 && <section className="section shell" aria-labelledby="offers-heading">
        <div className="section-heading"><div><span className="eyebrow">Current savings</span><h2 id="offers-heading">Offers</h2></div><Link to="/products">View all <ArrowRight size={17} /></Link></div>
        <ProductGrid products={offers} compact />
      </section>}
    </>
  );
}
