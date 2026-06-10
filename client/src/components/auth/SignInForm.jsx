import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";

export default function SignInForm() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn({ email, password });
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err.message || "Sign in failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-md" aria-label="Sign in">
      <label className="block">
        <span className="block text-xs font-scifi uppercase tracking-[0.2em] text-on-surface-variant">
          Email
        </span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-xs w-full rounded-xl border border-secondary-fixed-dim/30 bg-[#0b0f16] px-md py-sm text-on-surface focus:border-secondary-fixed-dim focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="block text-xs font-scifi uppercase tracking-[0.2em] text-on-surface-variant">
          Password
        </span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-xs w-full rounded-xl border border-secondary-fixed-dim/30 bg-[#0b0f16] px-md py-sm text-on-surface focus:border-secondary-fixed-dim focus:outline-none"
        />
      </label>

      {error && (
        <p role="alert" className="text-sm text-red-400">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="w-full rounded-full bg-secondary-container px-md py-sm font-scifi font-medium uppercase tracking-[0.15em] text-on-secondary shadow-[0_0_20px_rgba(0,219,233,0.3)] disabled:opacity-50"
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
