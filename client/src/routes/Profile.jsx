import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useAuth from "../hooks/useAuth.js";

export default function Profile() {
  const { user, updateProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) return;
    setFirstName(user.first_name ?? "");
    setLastName(user.last_name ?? "");
    setUsername(user.username ?? "");
  }, [user]);

  async function onSubmit(e) {
    e.preventDefault();
    setStatus("saving");
    setError(null);
    const patch = {};
    if (firstName !== (user?.first_name ?? "")) patch.first_name = firstName;
    if (lastName !== (user?.last_name ?? "")) patch.last_name = lastName;
    if (username !== (user?.username ?? "")) patch.username = username;
    if (Object.keys(patch).length === 0) {
      setStatus("idle");
      return;
    }
    try {
      await updateProfile(patch);
      setStatus("saved");
    } catch (err) {
      setStatus("error");
      setError(err?.message || "Update failed");
    }
  }

  async function onSignOut() {
    await signOut();
    navigate("/auth", { replace: true });
  }

  return (
    <div className="px-margin-safe max-w-xl mx-auto w-full">
      <p className="font-hud-mono text-xs uppercase tracking-widest text-primary-fixed mb-2">
        <span aria-hidden="true">[ OPERATOR.FILE ]</span>
      </p>
      <h1 className="font-hud-mono font-bold text-2xl tracking-widest text-primary-fixed mb-lg [text-shadow:0_0_12px_rgba(195,244,0,0.35)]">
        PROFILE
      </h1>
      <form
        data-testid="profile-form"
        onSubmit={onSubmit}
        className="hud-panel hud-corners p-lg space-y-md"
      >
        <label className="block">
          <span className="font-hud-mono text-xs uppercase tracking-widest text-on-surface-variant">▣ EMAIL</span>
          <input
            type="email"
            value={user?.email ?? ""}
            readOnly
            disabled
            aria-label="email"
            className="mt-1 w-full bg-surface-container-low text-on-surface-variant px-md py-sm border border-primary-fixed/40 opacity-60"
          />
        </label>
        <label className="block">
          <span className="font-hud-mono text-xs uppercase tracking-widest text-on-surface-variant">▣ FIRST NAME</span>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            aria-label="first name"
            className="mt-1 w-full bg-surface-container px-md py-sm border border-primary-fixed/40 text-white"
          />
        </label>
        <label className="block">
          <span className="font-hud-mono text-xs uppercase tracking-widest text-on-surface-variant">▣ LAST NAME</span>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            aria-label="last name"
            className="mt-1 w-full bg-surface-container px-md py-sm border border-primary-fixed/40 text-white"
          />
        </label>
        <label className="block">
          <span className="font-hud-mono text-xs uppercase tracking-widest text-on-surface-variant">▣ USERNAME</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-label="username"
            className="mt-1 w-full bg-surface-container px-md py-sm border border-primary-fixed/40 text-white"
          />
        </label>
        {error && (
          <p role="alert" className="text-red-400 text-sm">{error}</p>
        )}
        {status === "saved" && (
          <p className="text-primary-fixed text-sm">Profile saved.</p>
        )}
        <div className="flex items-center justify-between gap-md pt-sm">
          <button
            type="submit"
            disabled={status === "saving"}
            className="bg-primary-fixed text-on-primary-fixed font-hud-mono font-bold uppercase tracking-widest px-lg py-sm disabled:opacity-60"
          >
            {status === "saving" ? "SAVING…" : "SAVE"}
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="border border-primary-fixed/30 font-hud-mono uppercase tracking-widest text-on-surface px-lg py-sm hover:bg-surface-variant/40"
          >
            SIGN OUT
          </button>
        </div>
      </form>
    </div>
  );
}
