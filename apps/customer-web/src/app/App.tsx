import { lazy, Suspense } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from '../auth/ProtectedRoute';
import { CustomerLayout } from '../components/layout/CustomerLayout';
import { AccountPage } from '../pages/AccountPage';
import { AddressesPage } from '../pages/AddressesPage';
import { ForgotPasswordPage, LoginPage, RegisterPage, ResetPasswordPage } from '../pages/AuthPages';
import { CartPage } from '../pages/CartPage';
import { HomePage } from '../pages/HomePage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { ProductDetailsPage } from '../pages/ProductDetailsPage';
import { ProductsPage } from '../pages/ProductsPage';
import { LoadingState } from '../components/ui/AsyncState';
import { VerifyMobilePage } from '../pages/VerifyMobilePage';
import { Providers } from './Providers';

const CheckoutPage = lazy(() => import('../pages/CheckoutPage').then((module) => ({ default: module.CheckoutPage })));
const OrderConfirmationPage = lazy(() => import('../pages/OrderConfirmationPage').then((module) => ({ default: module.OrderConfirmationPage })));
const OrderDetailsPage = lazy(() => import('../pages/OrderDetailsPage').then((module) => ({ default: module.OrderDetailsPage })));
const OrdersPage = lazy(() => import('../pages/OrdersPage').then((module) => ({ default: module.OrdersPage })));
const TrackingPage = lazy(() => import('../pages/TrackingPage').then((module) => ({ default: module.TrackingPage })));
const ComplaintsPage = lazy(() => import('../pages/ComplaintsPage').then((module) => ({ default: module.ComplaintsPage })));
const ComplaintDetailsPage = lazy(() => import('../pages/ComplaintDetailsPage').then((module) => ({ default: module.ComplaintDetailsPage })));
const ProfilePage = lazy(() => import('../pages/ProfilePage').then((module) => ({ default: module.ProfilePage })));
const NotificationsPage = lazy(() => import('../pages/NotificationsPage').then((module) => ({ default: module.NotificationsPage })));

export function App() {
  return <BrowserRouter><Providers><Suspense fallback={<div className="page shell"><LoadingState label="Loading page" /></div>}><Routes><Route element={<CustomerLayout />}><Route index element={<HomePage />} /><Route path="shop" element={<ProductsPage />} /><Route path="products" element={<ProductsPage />} /><Route path="products/:productId" element={<ProductDetailsPage />} /><Route path="login" element={<LoginPage />} /><Route path="register" element={<RegisterPage />} /><Route path="forgot-password" element={<ForgotPasswordPage />} /><Route path="reset-password" element={<ResetPasswordPage />} /><Route element={<ProtectedRoute />}><Route path="verify-mobile" element={<VerifyMobilePage />} /><Route path="cart" element={<CartPage />} /><Route path="account" element={<AccountPage />} /><Route path="profile" element={<ProfilePage />} /><Route path="addresses" element={<AddressesPage />} /><Route path="checkout" element={<CheckoutPage />} /><Route path="order-confirmation/:orderId" element={<OrderConfirmationPage />} /><Route path="orders" element={<OrdersPage />} /><Route path="orders/:orderId" element={<OrderDetailsPage />} /><Route path="orders/:orderId/tracking" element={<TrackingPage />} /><Route path="complaints" element={<ComplaintsPage />} /><Route path="complaints/:complaintId" element={<ComplaintDetailsPage />} /><Route path="notifications" element={<NotificationsPage />} /></Route><Route path="*" element={<NotFoundPage />} /></Route></Routes></Suspense></Providers></BrowserRouter>;
}
