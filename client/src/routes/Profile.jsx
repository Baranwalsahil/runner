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
      <p className="font-scifi text-[11px] uppercase tracking-[0.3em] text-secondary-fixed-dim mb-2">
        Operator file
      </p>
      <h1 className="font-scifi font-light text-3xl tracking-tight text-on-surface mb-lg">PROFILE</h1>
      <form
        data-testid="profile-form"
        onSubmit={onSubmit}
        className="scifi-panel rounded-2xl p-lg space-y-md"
      >
        <label className="block">
          <span className="font-scifi text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">EMAIL</span>
          <input
            type="email"
            value={user?.email ?? ""}
            readOnly
            disabled
            aria-label="email"
            className="mt-1 w-full bg-surface-container-low text-on-surface-variant px-md py-sm rounded-xl border border-secondary-fixed-dim/30 opacity-60"
          />
        </label>
        <label className="block">
          <span className="font-scifi text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">FIRST NAME</span>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            aria-label="first name"
            className="mt-1 w-full bg-surface-container px-md py-sm rounded-xl border border-secondary-fixed-dim/30 text-white"
          />
        </label>
        <label className="block">
          <span className="font-scifi text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">LAST NAME</span>
          <input
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            aria-label="last name"
            className="mt-1 w-full bg-surface-container px-md py-sm rounded-xl border border-secondary-fixed-dim/30 text-white"
          />
        </label>
        <label className="block">
          <span className="font-scifi text-[11px] uppercase tracking-[0.2em] text-on-surface-variant">USERNAME</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            aria-label="username"
            className="mt-1 w-full bg-surface-container px-md py-sm rounded-xl border border-secondary-fixed-dim/30 text-white"
          />
        </label>
        {error && (
          <p role="alert" className="text-red-400 text-sm">{error}</p>
        )}
        {status === "saved" && (
          <p className="text-secondary-fixed font-scifi text-sm">Profile saved.</p>
        )}
        <div className="flex items-center justify-between gap-md pt-sm">
          <button
            type="submit"
            disabled={status === "saving"}
            className="bg-secondary-container text-on-secondary font-scifi font-medium uppercase tracking-[0.15em] px-lg py-sm rounded-full shadow-[0_0_20px_rgba(0,219,233,0.3)] disabled:opacity-60"
          >
            {status === "saving" ? "SAVING…" : "SAVE"}
          </button>
          <button
            type="button"
            onClick={onSignOut}
            className="border border-secondary-fixed-dim/30 font-scifi uppercase tracking-[0.15em] text-on-surface px-lg py-sm rounded-full hover:border-secondary-fixed-dim/60 hover:text-secondary-fixed transition-all"
          >
            SIGN OUT
          </button>
        </div>
      </form>
    </div>
  );
}
