import { useEffect, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import Icon from "./Icon.jsx";

const NAV_LINKS = [
  { to: "/battlefield", label: "BATTLEFIELD" },
  { to: "/dashboard", label: "DASHBOARD" },
  { to: "/leaderboard", label: "LEADERBOARD" },
  { to: "/growth", label: "GROWTH" },
];

export default function TopNavBar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  // Close drawer on route change.
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Lock body scroll while drawer open.
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  return (
    <>
      <nav
        data-testid="top-nav"
        className="fixed top-0 left-0 right-0 z-50 bg-[rgba(10,14,10,0.85)] backdrop-blur-lg border-b border-primary-fixed/30 shadow-[0_0_15px_rgba(195,244,0,0.1)] flex justify-between items-center w-full px-margin-safe h-16"
      >
        <div className="flex items-center gap-md">
          <button
            data-testid="mobile-menu-btn"
            aria-label={menuOpen ? "close menu" : "open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-base hover:bg-surface-variant/50 border border-transparent hover:border-primary-fixed/40 transition-all"
          >
            <Icon name={menuOpen ? "close" : "menu"} className="text-primary-fixed" />
          </button>
          <Link
            to="/"
            className="font-hud-mono font-bold text-primary-fixed tracking-widest [text-shadow:0_0_12px_rgba(195,244,0,0.4)]"
          >
            <span aria-hidden="true" className="opacity-50">[ </span>
            TERRITORY RUN
            <span aria-hidden="true" className="opacity-50"> ]</span>
          </Link>
          <div className="hidden md:flex gap-md">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    "font-hud-mono text-xs uppercase tracking-widest transition-colors pb-1 pt-1",
                    isActive
                      ? "text-primary-fixed border-b-2 border-primary-fixed"
                      : "text-on-surface-variant hover:text-primary",
                  ].join(" ")
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-base">
          <button
            aria-label="notifications"
            className="p-base hover:bg-surface-variant/50 border border-transparent hover:border-primary-fixed/40 transition-all duration-200 active:scale-95 opacity-80"
          >
            <Icon name="notifications" className="text-primary-fixed" />
          </button>
          <Link
            to="/profile"
            aria-label="account"
            className="p-base hover:bg-surface-variant/50 border border-transparent hover:border-primary-fixed/40 transition-all duration-200 active:scale-95 opacity-80 inline-flex"
          >
            <Icon name="account_circle" className="text-primary-fixed" />
          </Link>
        </div>
      </nav>

      {menuOpen && (
        <div
          data-testid="mobile-menu-overlay"
          className="md:hidden fixed inset-0 top-16 z-40 bg-surface/95 backdrop-blur-lg"
          onClick={() => setMenuOpen(false)}
        >
          <div
            data-testid="mobile-menu"
            className="flex flex-col p-md gap-base"
            onClick={(e) => e.stopPropagation()}
          >
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    "block font-hud-mono uppercase tracking-widest text-lg py-md px-md transition-all",
                    isActive
                      ? "text-primary-fixed bg-primary-fixed/10 border-l-4 border-primary-fixed"
                      : "text-on-surface hover:bg-surface-variant/50",
                  ].join(" ")
                }
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
