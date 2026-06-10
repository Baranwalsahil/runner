import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";

export default function SignUpForm() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signUp({ email, username, password });
      navigate("/dashboard", { replace: true });
    } catch (err) {
      setError(err.message || "Sign up failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-md" aria-label="Sign up">
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
          Username
        </span>
        <input
          type="text"
          autoComplete="username"
          required
          minLength={3}
          maxLength={50}
          pattern="[A-Za-z0-9_-]+"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-xs w-full rounded-xl border border-secondary-fixed-dim/30 bg-[#0b0f16] px-md py-sm text-on-surface focus:border-secondary-fixed-dim focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="block text-xs font-scifi uppercase tracking-[0.2em] text-on-surface-variant">
          Password
        </span>
        <input
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          maxLength={128}
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
        {submitting ? "Creating account…" : "Sign up"}
      </button>
    </form>
  );
}
