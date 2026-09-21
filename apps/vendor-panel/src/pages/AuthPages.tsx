import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { z } from "zod";
import { useAuth } from "../auth/AuthProvider";
const loginSchema = z.object({
  identifier: z.string().min(3, "Enter your email or mobile number"),
  password: z.string().min(10, "Password must contain at least 10 characters"),
});
type Login = z.infer<typeof loginSchema>;
export function LoginPage() {
  const { session, login } = useAuth();
  const [error, setError] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Login>({ resolver: zodResolver(loginSchema) });
  if (session) return <Navigate to="/" replace />;
  return (
    <AuthFrame
      title="Welcome back"
      subtitle="Manage products, fulfil orders and track settlements from one secure workspace."
    >
      <form
        onSubmit={(event) => void handleSubmit(async (v) => {
          try {
            setError("");
            await login(v.identifier, v.password);
            const target =
              (location.state as { from?: string } | null)?.from ?? "/";
            void navigate(target, { replace: true });
          } catch (e) {
            setError(e instanceof Error ? e.message : "Login failed");
          }
        })(event)}
      >
        <Field label="Email or mobile" error={errors.identifier?.message}>
          <input autoComplete="username" {...register("identifier")} />
        </Field>
        <Field label="Password" error={errors.password?.message}>
          <input
            type="password"
            autoComplete="current-password"
            {...register("password")}
          />
        </Field>
        {error && <p className="form-error">{error}</p>}
        <button className="primary" disabled={isSubmitting}>
          {isSubmitting ? "Signing in…" : "Sign in securely"}
        </button>
        <p className="auth-switch">
          New vendor? <Link to="/register">Create a vendor account</Link>
        </p>
      </form>
    </AuthFrame>
  );
}
const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(10),
  businessName: z.string().min(2),
  ownerName: z.string().min(2),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().regex(/^\d{6}$/),
});
type Register = z.infer<typeof registerSchema>;
export function RegisterPage() {
  const { session, register: registerVendor } = useAuth();
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const form = useForm<Register>({ resolver: zodResolver(registerSchema) });
  if (session) return <Navigate to="/" />;
  return (
    <AuthFrame
      title="Start selling with Vishwaneed"
      subtitle="Create your business account, then complete KYC and inspection from the panel."
    >
      <form
        onSubmit={(event) => void form.handleSubmit(async (v) => {
          try {
            await registerVendor({
              email: v.email,
              password: v.password,
              businessName: v.businessName,
              ownerName: v.ownerName,
              businessAddress: {
                line1: v.address,
                city: v.city,
                state: v.state,
                pincode: v.pincode,
              },
            });
            void navigate("/profile");
          } catch (e) {
            setError(e instanceof Error ? e.message : "Registration failed");
          }
        })(event)}
      >
        <div className="form-grid">
          {(
            [
              "businessName",
              "ownerName",
              "email",
              "password",
              "address",
              "city",
              "state",
              "pincode",
            ] as const
          ).map((name) => (
            <Field
              key={name}
              label={name.replace(/([A-Z])/g, " $1")}
              error={form.formState.errors[name]?.message}
            >
              <input
                type={name === "password" ? "password" : "text"}
                {...form.register(name)}
              />
            </Field>
          ))}
        </div>
        {error && <p className="form-error">{error}</p>}
        <button className="primary" disabled={form.formState.isSubmitting}>
          Create vendor account
        </button>
        <p className="auth-switch">
          Already registered? <Link to="/login">Sign in</Link>
        </p>
      </form>
    </AuthFrame>
  );
}
function AuthFrame({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="auth-page">
      <section className="auth-story">
        <div className="brand light">
          <span>V</span>
          <div>
            <strong>Vishwaneed</strong>
            <small>Made in India. Made for You.</small>
          </div>
        </div>
        <div>
          <small>VENDOR PARTNERS</small>
          <h1>
            Grow local.
            <br />
            Reach India.
          </h1>
          <p>
            A trusted marketplace for rural producers and purpose-led food
            businesses.
          </p>
        </div>
      </section>
      <section className="auth-card">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
          {children}
        </div>
      </section>
    </div>
  );
}
export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {error && <small>{error}</small>}
    </label>
  );
}
