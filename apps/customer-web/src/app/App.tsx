import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { CustomerLayout } from '../components/layout/CustomerLayout';
import { AccountPage } from '../pages/AccountPage';
import { AddressesPage } from '../pages/AddressesPage';
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from '../pages/AuthPages';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { OrderConfirmationPage } from '../pages/OrderConfirmationPage';
import { ProductDetailsPage } from '../pages/ProductDetailsPage';
import { ProductsPage } from '../pages/ProductsPage';
import { Providers } from './Providers';

export function App() {
  return <BrowserRouter><Providers><Routes><Route element={<CustomerLayout />}><Route index element={<HomePage />} /><Route path="products" element={<ProductsPage />} /><Route path="products/:productId" element={<ProductDetailsPage />} /><Route path="cart" element={<CartPage />} /><Route path="login" element={<LoginPage />} /><Route path="register" element={<RegisterPage />} /><Route path="forgot-password" element={<ForgotPasswordPage />} /><Route path="reset-password" element={<ResetPasswordPage />} /><Route element={<ProtectedRoute />}><Route path="account" element={<AccountPage />} /><Route path="addresses" element={<AddressesPage />} /><Route path="checkout" element={<CheckoutPage />} /><Route path="order-confirmation" element={<OrderConfirmationPage />} /></Route><Route path="*" element={<NotFoundPage />} /></Route></Routes></Providers></BrowserRouter>;
}
