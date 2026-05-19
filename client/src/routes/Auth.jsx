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
      <div className="p-xl text-center font-mono text-sm text-on-surface-variant">
        Loading…
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="mx-auto max-w-md p-lg">
      <h1 className="mb-lg font-mono text-2xl uppercase tracking-wider text-primary-fixed">
        {mode === "signin" ? "Sign in" : "Create account"}
      </h1>

      <div className="mb-md flex gap-md text-sm font-mono uppercase tracking-wider">
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
  );
}
