import { beforeEach, describe, expect, it } from 'vitest';
import { createMockMarketplaceApi } from './mockMarketplaceApi';

describe('development marketplace adapter', () => {
  beforeEach(() => window.localStorage.clear());

  it('filters the catalogue by product type', async () => {
    const api = createMockMarketplaceApi();
    const result = await api.getProducts({ productType: 'RAW_COMMODITY', page: 1, limit: 20 });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items.every((product) => product.productType === 'RAW_COMMODITY')).toBe(true);
  });

  it('keeps products grouped by vendor in one cart', async () => {
    const api = createMockMarketplaceApi();
    await api.addCartItem('prod-mango-pickle', 1);
    await api.addCartItem('prod-ragi-flour', 1);
    const cart = await api.getCart();
    expect(cart.itemCount).toBe(2);
    expect(cart.groups).toHaveLength(2);
  });
});
