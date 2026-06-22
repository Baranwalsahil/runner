import { useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";

// Mirror of shared/constants.js OWNER_PALETTE — the allowed territory colors.
const OWNER_PALETTE = [
  "#c3f400",
  "#00dbe9",
  "#ffb4aa",
  "#7df4ff",
  "#ffdad5",
  "#ff6b6b",
];

export default function SignUpForm() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [color, setColor] = useState(OWNER_PALETTE[0]);
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

      <fieldset className="block">
        <legend className="block text-xs font-hud-mono uppercase tracking-widest text-on-surface-variant">
          Territory color
        </legend>
        <div className="mt-xs flex flex-wrap gap-sm" role="radiogroup" aria-label="Territory color">
          {OWNER_PALETTE.map((c) => {
            const selected = c === color;
            return (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={selected}
                aria-label={`Color ${c}`}
                onClick={() => setColor(c)}
                style={{ backgroundColor: c }}
                className={`h-8 w-8 rounded-full border-2 transition focus:outline-none focus:ring-2 focus:ring-primary-fixed ${
                  selected
                    ? "border-on-surface scale-110"
                    : "border-transparent opacity-80 hover:opacity-100"
                }`}
              />
            );
          })}
        </div>
      </fieldset>

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
