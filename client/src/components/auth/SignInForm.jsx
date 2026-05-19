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
        <span className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">
          Email
        </span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-xs w-full rounded-md border border-outline bg-surface px-md py-sm text-on-surface focus:border-primary-fixed focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="block text-xs font-mono uppercase tracking-wider text-on-surface-variant">
          Password
        </span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-xs w-full rounded-md border border-outline bg-surface px-md py-sm text-on-surface focus:border-primary-fixed focus:outline-none"
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
        className="w-full rounded-md bg-primary-fixed px-md py-sm font-mono uppercase tracking-wider text-on-primary-fixed disabled:opacity-50"
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
