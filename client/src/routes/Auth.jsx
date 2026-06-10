import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import SignInForm from "../components/auth/SignInForm.jsx";
import SignUpForm from "../components/auth/SignUpForm.jsx";
import useAuth from "../hooks/useAuth.js";

export default function Auth() {
  const { user, loading } = useAuth();
  const [mode, setMode] = useState("signin");

  useEffect(() => {
    document.title = "Territory Run — Sign in";
  }, []);

  if (loading) {
    return (
      <div className="p-xl text-center font-scifi uppercase tracking-[0.2em] text-sm text-on-surface-variant">
        Loading…
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto max-w-md p-lg">
      <div className="scifi-panel rounded-2xl p-lg">
        <p className="font-scifi text-[11px] uppercase tracking-[0.3em] text-secondary-fixed-dim mb-2">
          Operator access
        </p>
        <h1 className="mb-lg font-scifi font-light text-3xl uppercase tracking-tight text-on-surface">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>

        <div className="mb-md flex gap-md text-sm font-scifi uppercase tracking-[0.15em]">
          <button
            type="button"
            onClick={() => setMode("signin")}
            aria-pressed={mode === "signin"}
            className={
              mode === "signin"
                ? "border-b-2 border-secondary-fixed-dim pb-xs text-secondary-fixed"
                : "pb-xs text-on-surface-variant"
            }
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            aria-pressed={mode === "signup"}
            className={
              mode === "signup"
                ? "border-b-2 border-secondary-fixed-dim pb-xs text-secondary-fixed"
                : "pb-xs text-on-surface-variant"
            }
          >
            Sign up
          </button>
        </div>

        {mode === "signin" ? <SignInForm /> : <SignUpForm />}
      </div>
    </div>
  );
}
