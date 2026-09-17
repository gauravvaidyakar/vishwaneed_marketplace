import { HttpClient } from './httpClient';
import type {
  Address,
  AddressInput,
  AuthSession,
  Cart,
  Category,
  CheckoutSummary,
  CreateOrderInput,
  LoginInput,
  MarketplaceApi,
  OrderConfirmation,
  Paginated,
  Product,
  ProductQuery,
  RegisterInput,
  ResetPasswordInput,
} from './types';

function productQueryString(query: ProductQuery): string {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== '') params.set(key, String(value));
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : '';
}

export class HttpMarketplaceApi implements MarketplaceApi {
  private readonly client: HttpClient;

  constructor(baseUrl: string) {
    this.client = new HttpClient(baseUrl);
  }

  getCategories(): Promise<Category[]> {
    return this.client.get('/categories');
  }

  async getProducts(query: ProductQuery): Promise<Paginated<Product>> {
    const envelope = await this.client.getEnvelope<Product[]>(`/products${productQueryString(query)}`);
    return {
      items: envelope.data,
      meta: envelope.meta ?? { page: 1, limit: envelope.data.length, total: envelope.data.length, totalPages: 1 },
    };
  }

  getProduct(idOrSlug: string): Promise<Product> {
    return this.client.get(`/products/${encodeURIComponent(idOrSlug)}`);
  }

  login(input: LoginInput): Promise<AuthSession> {
    return this.client.post('/auth/login', input);
  }

  register(input: RegisterInput): Promise<AuthSession> {
    return this.client.post('/auth/register', input);
  }

  logout(): Promise<void> {
    return this.client.post('/auth/logout');
  }

  forgotPassword(emailOrMobile: string): Promise<void> {
    return this.client.post('/auth/forgot-password', { emailOrMobile });
  }

  resetPassword(input: ResetPasswordInput): Promise<void> {
    return this.client.post('/auth/reset-password', input);
  }

  getCart(): Promise<Cart> {
    return this.client.get('/cart');
  }

  addCartItem(productId: string, quantity: number): Promise<Cart> {
    return this.client.post('/cart/items', { productId, quantity });
  }

  updateCartItem(itemId: string, quantity: number): Promise<Cart> {
    return this.client.patch(`/cart/items/${encodeURIComponent(itemId)}`, { quantity });
  }

  removeCartItem(itemId: string): Promise<Cart> {
    return this.client.delete(`/cart/items/${encodeURIComponent(itemId)}`);
  }

  getAddresses(): Promise<Address[]> {
    return this.client.get('/customers/me/addresses');
  }

  createAddress(input: AddressInput): Promise<Address> {
    return this.client.post('/customers/me/addresses', input);
  }

  updateAddress(id: string, input: AddressInput): Promise<Address> {
    return this.client.patch(`/customers/me/addresses/${encodeURIComponent(id)}`, input);
  }

  deleteAddress(id: string): Promise<void> {
    return this.client.delete(`/customers/me/addresses/${encodeURIComponent(id)}`);
  }

  validateCheckout(addressId: string): Promise<CheckoutSummary> {
    return this.client.post('/checkout/validate', { addressId });
  }

  createOrder(input: CreateOrderInput): Promise<OrderConfirmation> {
    return this.client.post('/orders', input);
  }
}
