import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { marketplaceApi } from "../api";
import { useAuth } from "../auth/AuthProvider";
import { getErrorMessage } from "../api/errors";

export function VerifyMobilePage() {
  const { session, updateCustomer } = useAuth();
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [developmentOtp, setDevelopmentOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const requestCode = async () => {
    try {
      setLoading(true);
      setError("");
      const result = await marketplaceApi.requestVerificationOtp();
      if (result.verified) {
        if (session) updateCustomer({ ...session.customer, mobileVerified: true });
        void navigate("/account", { replace: true });
        return;
      }
      setDevelopmentOtp(result.developmentOtp ?? "");
      setSent(true);
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  };

  const verify = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(code)) {
      setError("Enter the 6-digit verification code.");
      return;
    }
    try {
      setLoading(true);
      setError("");
      await marketplaceApi.verifyOtp(code);
      if (session) updateCustomer({ ...session.customer, mobileVerified: true });
      void navigate("/account", {
        replace: true,
        state: { notice: "Mobile number verified successfully." },
      });
    } catch (caught) {
      setError(getErrorMessage(caught));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page shell verification-page">
      <section className="auth-form-card">
        <ShieldCheck aria-hidden="true" />
        <span className="eyebrow">Account verification</span>
        <h1>Verify your mobile number</h1>
        <p>We use your verified number for order, delivery and account-security updates.</p>
        {!sent ? (
          <button className="button button--primary button--full" disabled={loading} onClick={() => void requestCode()}>
            {loading ? "Sending…" : "Send verification code"}
          </button>
        ) : (
          <form className="stack-form" onSubmit={(event) => void verify(event)}>
            <label className="form-field">
              <span>6-digit verification code</span>
              <input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} />
            </label>
            {developmentOtp && <p className="form-success"><CheckCircle2 size={16} /> Development code: {developmentOtp}</p>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="button button--primary button--full" disabled={loading}>{loading ? "Verifying…" : "Verify mobile"}</button>
            <button className="button button--secondary button--full" type="button" disabled={loading} onClick={() => void requestCode()}>Send a new code</button>
          </form>
        )}
        {!sent && error && <p className="form-error" role="alert">{error}</p>}
      </section>
    </div>
  );
}
