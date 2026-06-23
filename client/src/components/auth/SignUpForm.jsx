import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";

// Default territory color shown in the picker. The user may change it to any
// hex color; colors are unique per user (server rejects an already-taken one).
const DEFAULT_COLOR = "#c3f400";

export default function SignUpForm() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [color, setColor] = useState(DEFAULT_COLOR);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signUp({ email, username, password, color });
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
        <span className="block text-xs font-hud-mono uppercase tracking-widest text-on-surface-variant">
          Email
        </span>
        <input
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mt-xs w-full border border-primary-fixed/40 bg-surface-container-lowest px-md py-sm text-on-surface focus:border-primary-fixed focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="block text-xs font-hud-mono uppercase tracking-widest text-on-surface-variant">
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
          className="mt-xs w-full border border-primary-fixed/40 bg-surface-container-lowest px-md py-sm text-on-surface focus:border-primary-fixed focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="block text-xs font-hud-mono uppercase tracking-widest text-on-surface-variant">
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
          className="mt-xs w-full border border-primary-fixed/40 bg-surface-container-lowest px-md py-sm text-on-surface focus:border-primary-fixed focus:outline-none"
        />
      </label>

      <label className="block">
        <span className="block text-xs font-hud-mono uppercase tracking-widest text-on-surface-variant">
          Territory color
        </span>
        <div className="mt-xs flex items-center gap-md">
          <input
            type="color"
            aria-label="Territory color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="h-10 w-14 cursor-pointer border border-primary-fixed/40 bg-surface-container-lowest p-xs"
          />
          <span
            className="h-10 w-10 border border-primary-fixed/40"
            style={{ backgroundColor: color }}
            aria-hidden="true"
          />
          <span className="font-hud-mono text-sm uppercase tracking-widest text-on-surface">
            {color}
          </span>
        </div>
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
        {submitting ? "Creating account…" : "Sign up"}
      </button>
    </form>
  );
}
