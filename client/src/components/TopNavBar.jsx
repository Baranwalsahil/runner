import { useEffect, useState } from "react";
import { NavLink, Link, useLocation } from "react-router-dom";
import Icon from "./Icon.jsx";

const NAV_LINKS = [
  { to: "/battlefield", label: "BATTLEFIELD" },
  { to: "/dashboard", label: "DASHBOARD" },
  { to: "/leaderboard", label: "LEADERBOARD" },
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
        className="fixed top-0 left-0 right-0 z-50 bg-[rgba(10,14,20,0.7)] backdrop-blur-lg border-b border-secondary-fixed-dim/20 shadow-[0_0_30px_-10px_rgba(0,219,233,0.35)] flex justify-between items-center w-full px-margin-safe h-16"
      >
        <div className="flex items-center gap-md">
          <button
            data-testid="mobile-menu-btn"
            aria-label={menuOpen ? "close menu" : "open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden p-base hover:bg-surface-variant/50 rounded-full transition-all"
          >
            <Icon name={menuOpen ? "close" : "menu"} className="text-primary-fixed" />
          </button>
          <Link
            to="/"
            className="font-scifi font-medium text-secondary-fixed tracking-[0.25em] scifi-glow"
          >
            TERRITORY RUN
          </Link>
          <div className="hidden md:flex gap-md">
            {NAV_LINKS.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  [
                    "font-scifi text-xs uppercase tracking-[0.2em] transition-colors pb-1 pt-1",
                    isActive
                      ? "text-secondary-fixed border-b-2 border-secondary-fixed-dim"
                      : "text-on-surface-variant hover:text-secondary-fixed",
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
            className="p-base hover:bg-secondary-fixed-dim/10 transition-all duration-200 rounded-full active:scale-95 opacity-80"
          >
            <Icon name="notifications" className="text-secondary-fixed-dim" />
          </button>
          <Link
            to="/profile"
            aria-label="account"
            className="p-base hover:bg-secondary-fixed-dim/10 transition-all duration-200 rounded-full active:scale-95 opacity-80 inline-flex"
          >
            <Icon name="account_circle" className="text-secondary-fixed-dim" />
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
                    "block font-scifi uppercase tracking-[0.15em] text-lg py-md px-md rounded-xl transition-all",
                    isActive
                      ? "text-secondary-fixed bg-secondary-fixed-dim/10 border-l-4 border-secondary-fixed-dim"
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
