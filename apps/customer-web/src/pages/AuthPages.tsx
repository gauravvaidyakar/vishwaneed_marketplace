import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, CheckCircle2, LockKeyhole } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { z } from 'zod';
import { marketplaceApi, runtimeConfig } from '../api';
import { getErrorMessage } from '../api/errors';
import { useAuth } from '../auth/AuthProvider';
import { FormField } from '../components/ui/FormField';

const loginSchema = z.object({ emailOrMobile: z.string().min(5, 'Enter your email or mobile number.'), password: z.string().min(8, 'Password must be at least 8 characters.') });
type LoginForm = z.infer<typeof loginSchema>;

const registerSchema = z.object({
  name: z.string().min(2, 'Enter your full name.'),
  email: z.email('Enter a valid email address.'),
  mobile: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number.'),
  password: z.string().min(10, 'Use at least 10 characters.').regex(/[A-Z]/, 'Include an uppercase letter.').regex(/[0-9]/, 'Include a number.'),
  acceptTerms: z.boolean().refine((value) => value, 'Please accept the terms to continue.'),
});
type RegisterForm = z.infer<typeof registerSchema>;

const forgotSchema = z.object({ emailOrMobile: z.string().min(5, 'Enter your registered email or mobile number.') });
type ForgotForm = z.infer<typeof forgotSchema>;

const resetSchema = z.object({ password: z.string().min(10, 'Use at least 10 characters.').regex(/[A-Z]/, 'Include an uppercase letter.').regex(/[0-9]/, 'Include a number.'), confirmPassword: z.string() }).refine((values) => values.password === values.confirmPassword, { message: 'Passwords do not match.', path: ['confirmPassword'] });
type ResetForm = z.infer<typeof resetSchema>;

function AuthShell({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return <div className="auth-page"><section className="auth-story"><Link className="back-link back-link--light" to="/"><ArrowLeft size={17} /> Back to store</Link><div><span className="eyebrow eyebrow--light">Vishwaneed customer</span><h1>Food with roots.<br />Shopping with trust.</h1><p>Discover approved products from rural producers while keeping one simple customer checkout.</p><ul><li><CheckCircle2 /> GST-inclusive product prices</li><li><CheckCircle2 /> Multi-vendor cart</li><li><CheckCircle2 /> Backend-verified checkout</li></ul></div></section><section className="auth-panel"><div className="auth-card"><LockKeyhole className="auth-icon" aria-hidden="true" /><h2>{title}</h2><p>{intro}</p>{children}{runtimeConfig.isMock && <div className="mock-note">Development adapter: use any valid-looking credentials. No real account is created.</div>}</div></section></div>;
}

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const destination = (location.state as { from?: string } | null)?.from ?? '/account';
  const [serverError, setServerError] = useState('');
  const form = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { emailOrMobile: '', password: '' } });
  if (isAuthenticated) return <Navigate to={destination} replace />;
  const submit = form.handleSubmit(async (values) => { try { setServerError(''); await login(values); void navigate(destination, { replace: true }); } catch (error) { setServerError(getErrorMessage(error)); } });
  return <AuthShell title="Welcome back" intro="Sign in to continue to your account and checkout."><form className="stack-form" onSubmit={(event) => void submit(event)} noValidate><FormField label="Email or mobile" autoComplete="username" registration={form.register('emailOrMobile')} error={form.formState.errors.emailOrMobile} /><FormField label="Password" type="password" autoComplete="current-password" registration={form.register('password')} error={form.formState.errors.password} />{serverError && <p className="form-error" role="alert">{serverError}</p>}<div className="form-row-between"><span>Secure customer session</span><Link to="/forgot-password">Forgot password?</Link></div><button className="button button--primary button--full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Signing in…' : 'Sign in'}</button></form><p className="auth-switch">New to Vishwaneed? <Link to="/register">Create an account</Link></p></AuthShell>;
}

export function RegisterPage() {
  const { isAuthenticated, register } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const form = useForm<RegisterForm>({ resolver: zodResolver(registerSchema), defaultValues: { name: '', email: '', mobile: '', password: '', acceptTerms: false } });
  if (isAuthenticated) return <Navigate to="/account" replace />;
  const submit = form.handleSubmit(async (values) => { try { setServerError(''); const input = { name: values.name, email: values.email, mobile: values.mobile, password: values.password }; await register(input); void navigate('/verify-mobile', { replace: true }); } catch (error) { setServerError(getErrorMessage(error)); } });
  return <AuthShell title="Create your account" intro="Register as a customer to save addresses and check out."><form className="stack-form" onSubmit={(event) => void submit(event)} noValidate><FormField label="Full name" autoComplete="name" registration={form.register('name')} error={form.formState.errors.name} /><FormField label="Email" type="email" autoComplete="email" registration={form.register('email')} error={form.formState.errors.email} /><FormField label="Mobile" inputMode="numeric" autoComplete="tel" registration={form.register('mobile')} error={form.formState.errors.mobile} /><FormField label="Password" type="password" autoComplete="new-password" hint="At least 10 characters, with an uppercase letter and number." registration={form.register('password')} error={form.formState.errors.password} /><label className="checkbox-field"><input type="checkbox" {...form.register('acceptTerms')} /> I agree to the customer terms and privacy policy.</label>{form.formState.errors.acceptTerms && <small className="field-error">{form.formState.errors.acceptTerms.message}</small>}{serverError && <p className="form-error" role="alert">{serverError}</p>}<button className="button button--primary button--full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Creating account…' : 'Create account'}</button></form><p className="auth-switch">Already registered? <Link to="/login">Sign in</Link></p></AuthShell>;
}

export function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [developmentResetUrl, setDevelopmentResetUrl] = useState('');
  const [serverError, setServerError] = useState('');
  const form = useForm<ForgotForm>({ resolver: zodResolver(forgotSchema), defaultValues: { emailOrMobile: '' } });
  const submit = form.handleSubmit(async ({ emailOrMobile }) => { try { setServerError(''); const result = await marketplaceApi.forgotPassword(emailOrMobile); setDevelopmentResetUrl(result.developmentResetUrl ?? ''); setSent(true); } catch (error) { setServerError(getErrorMessage(error)); } });
  return <AuthShell title="Reset your password" intro="We’ll ask the backend to send the configured reset instructions.">{sent ? <div className="success-message"><CheckCircle2 /><h3>Request received</h3><p>If the account exists, reset instructions will be sent securely.</p>{developmentResetUrl && <a className="button button--primary" href={developmentResetUrl}>Open development reset link</a>}<Link className="button button--secondary" to="/login">Return to sign in</Link></div> : <form className="stack-form" onSubmit={(event) => void submit(event)} noValidate><FormField label="Email or mobile" registration={form.register('emailOrMobile')} error={form.formState.errors.emailOrMobile} />{serverError && <p className="form-error" role="alert">{serverError}</p>}<button className="button button--primary button--full" disabled={form.formState.isSubmitting}>{form.formState.isSubmitting ? 'Sending…' : 'Send reset instructions'}</button></form>}</AuthShell>;
}

export function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const token = params.get('token') ?? '';
  const form = useForm<ResetForm>({ resolver: zodResolver(resetSchema), defaultValues: { password: '', confirmPassword: '' } });
  const submit = form.handleSubmit(async ({ password }) => { try { setServerError(''); await marketplaceApi.resetPassword({ token, password }); void navigate('/login', { replace: true }); } catch (error) { setServerError(getErrorMessage(error)); } });
  return <AuthShell title="Choose a new password" intro="Enter a secure password for your customer account."><form className="stack-form" onSubmit={(event) => void submit(event)} noValidate><FormField label="New password" type="password" autoComplete="new-password" registration={form.register('password')} error={form.formState.errors.password} /><FormField label="Confirm password" type="password" autoComplete="new-password" registration={form.register('confirmPassword')} error={form.formState.errors.confirmPassword} />{!token && <p className="form-error" role="alert">The reset token is missing.</p>}{serverError && <p className="form-error" role="alert">{serverError}</p>}<button className="button button--primary button--full" disabled={!token || form.formState.isSubmitting}>Update password</button></form></AuthShell>;
}
