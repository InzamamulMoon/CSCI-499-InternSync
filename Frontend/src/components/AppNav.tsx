import { Link, useLocation, useNavigate } from "react-router-dom";
import { signOut } from "../lib/authGate";

const links = [
  { to: "/", label: "Matches" },
  { to: "/profile", label: "Profile" },
  { to: "/tracker", label: "Tracker" },
];

export default function AppNav({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  const location = useLocation();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    navigate("/signin", { replace: true });
  }

  return (
    <header className="cf-header">
      <div className="mx-auto max-w-5xl px-4 py-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="text-sm font-bold uppercase tracking-wider text-white/95">
            InternSync
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <nav className="flex flex-wrap gap-2">
              {links.map(({ to, label }) => {
                const active = location.pathname === to;
                return (
                  <Link
                    key={to}
                    to={to}
                    className={
                      active
                        ? "rounded-lg bg-white px-3 py-1.5 text-sm font-semibold text-blue-700 shadow"
                        : "cf-btn-ghost-light"
                    }
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={handleSignOut}
              className="cf-btn-ghost-light"
            >
              Sign out
            </button>
          </div>
        </div>
        <h1 className="text-xl font-bold text-white">{title}</h1>
        {subtitle ? (
          <p className="mt-0.5 text-sm text-white/85">{subtitle}</p>
        ) : null}
      </div>
    </header>
  );
}
