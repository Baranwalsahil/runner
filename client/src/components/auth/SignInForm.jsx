import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";

export default function SignInForm() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || "/dashboard";

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signIn({ identifier, password });
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
        <span className="block text-xs font-hud-mono uppercase tracking-widest text-on-surface-variant">
          Email or Username
        </span>
        <input
          type="text"
          autoComplete="username email"
          required
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          className="mt-xs w-full border border-primary-fixed/40 bg-surface-container-lowest px-md py-sm text-on-surface focus:border-primary-fixed focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="block text-xs font-hud-mono uppercase tracking-widest text-on-surface-variant">
          Password
        </span>
        <input
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-xs w-full border border-primary-fixed/40 bg-surface-container-lowest px-md py-sm text-on-surface focus:border-primary-fixed focus:outline-none"
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
        className="w-full bg-primary-fixed px-md py-sm font-hud-mono uppercase tracking-widest text-on-primary-fixed disabled:opacity-50"
      >
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
