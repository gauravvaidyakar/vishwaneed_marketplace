export type Currency = 'INR';

export interface Money {
  amount: number;
  currency: Currency;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  message: string;
  meta?: PageMeta;
}

export interface PageMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PageMeta;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  imageUrl: string;
}

export type ProductType = 'RAW_COMMODITY' | 'VALUE_ADDED';
export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface VendorSummary {
  id: string;
  name: string;
  location: string;
  rating: number;
  productCount: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  categoryId: string;
  categoryName: string;
  productType: ProductType;
  vendor: VendorSummary;
  price: Money;
  mrp?: Money;
  gstInclusive: true;
  weight: string;
  description: string;
  ingredients?: string[];
  specifications: Record<string, string>;
  images: string[];
  stockStatus: StockStatus;
  availableQuantity: number;
  rating: number;
  reviewCount: number;
  featured: boolean;
  bestSeller: boolean;
}

export type ProductSort = 'POPULAR' | 'PRICE_ASC' | 'PRICE_DESC' | 'NEWEST';

export interface ProductQuery {
  search?: string;
  category?: string;
  productType?: ProductType;
  minPrice?: number;
  maxPrice?: number;
  available?: boolean;
  sort?: ProductSort;
  page?: number;
  limit?: number;
  featured?: boolean;
  bestSeller?: boolean;
}

export interface Customer {
  id: string;
  name: string;
  email?: string;
  mobile?: string;
  role: 'CUSTOMER';
}

export interface AuthSession {
  accessToken: string;
  refreshToken?: string;
  customer: Customer;
}

export interface LoginInput {
  emailOrMobile: string;
  password: string;
}

export interface RegisterInput {
  name: string;
  email: string;
  mobile: string;
  password: string;
}

export interface ResetPasswordInput {
  token: string;
  password: string;
}

export interface CartLine {
  id: string;
  product: Product;
  quantity: number;
  currentUnitPrice: Money;
  previousUnitPrice?: Money;
  issue?: 'PRICE_CHANGED' | 'OUT_OF_STOCK' | 'QUANTITY_UNAVAILABLE';
}

export interface CartVendorGroup {
  vendor: VendorSummary;
  items: CartLine[];
  productSubtotal: Money;
}

export interface Cart {
  groups: CartVendorGroup[];
  itemCount: number;
  productSubtotal: Money;
  refreshedAt: string;
}

export interface Address {
  id: string;
  label: 'HOME' | 'WORK' | 'OTHER';
  recipientName: string;
  mobile: string;
  line1: string;
  line2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

export type AddressInput = Omit<Address, 'id'>;

export interface CheckoutVendorGroup {
  vendor: VendorSummary;
  items: CartLine[];
  productSubtotal: Money;
  shipping: Money;
  estimatedDelivery: string;
}

export interface CheckoutSummary {
  quoteId: string;
  addressId: string;
  vendors: CheckoutVendorGroup[];
  productSubtotal: Money;
  totalShipping: Money;
  payableTotal: Money;
  expiresAt: string;
}

export type PaymentMethod = 'COD' | 'PREPAID';

export interface CreateOrderInput {
  quoteId: string;
  addressId: string;
  paymentMethod: PaymentMethod;
}

export interface VendorOrderConfirmation {
  id: string;
  vendorName: string;
  amount: Money;
  status: 'CONFIRMED' | 'PENDING_PAYMENT';
  estimatedDelivery: string;
}

export interface OrderConfirmation {
  masterOrderId: string;
  paymentMethod: PaymentMethod;
  paymentStatus: 'COD_PENDING' | 'PAYMENT_PENDING' | 'PAID';
  payableTotal: Money;
  vendorOrders: VendorOrderConfirmation[];
  placedAt: string;
}

export interface MarketplaceApi {
  getCategories(): Promise<Category[]>;
  getProducts(query: ProductQuery): Promise<Paginated<Product>>;
  getProduct(idOrSlug: string): Promise<Product>;
  login(input: LoginInput): Promise<AuthSession>;
  register(input: RegisterInput): Promise<AuthSession>;
  logout(): Promise<void>;
  forgotPassword(emailOrMobile: string): Promise<void>;
  resetPassword(input: ResetPasswordInput): Promise<void>;
  getCart(): Promise<Cart>;
  addCartItem(productId: string, quantity: number): Promise<Cart>;
  updateCartItem(itemId: string, quantity: number): Promise<Cart>;
  removeCartItem(itemId: string): Promise<Cart>;
  getAddresses(): Promise<Address[]>;
  createAddress(input: AddressInput): Promise<Address>;
  updateAddress(id: string, input: AddressInput): Promise<Address>;
  deleteAddress(id: string): Promise<void>;
  validateCheckout(addressId: string): Promise<CheckoutSummary>;
  createOrder(input: CreateOrderInput): Promise<OrderConfirmation>;
}
