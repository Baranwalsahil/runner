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
      <div className="p-xl text-center font-hud-mono uppercase tracking-widest text-sm text-on-surface-variant">
        Loading…
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto max-w-md p-lg">
      <div className="hud-panel hud-corners p-lg">
        <p className="font-hud-mono text-xs uppercase tracking-widest text-primary-fixed mb-md">
          <span aria-hidden="true">[ OPERATOR.ACCESS ]</span>
        </p>
        <h1 className="mb-lg font-hud-mono font-bold text-2xl uppercase tracking-widest text-primary-fixed [text-shadow:0_0_12px_rgba(195,244,0,0.35)]">
          {mode === "signin" ? "Sign in" : "Create account"}
        </h1>

        <div className="mb-md flex gap-md text-sm font-hud-mono uppercase tracking-widest">
        <button
          type="button"
          onClick={() => setMode("signin")}
          aria-pressed={mode === "signin"}
          className={
            mode === "signin"
              ? "border-b-2 border-primary-fixed pb-xs text-primary-fixed"
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
              ? "border-b-2 border-primary-fixed pb-xs text-primary-fixed"
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
