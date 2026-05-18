import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { isSignedIn, markSignedIn } from "../lib/authGate";

const EXAMPLE_EMAIL = "internsync.demo@local";
const EXAMPLE_PASSWORD = "demo-internsync-local";

export default function SignIn() {
  const navigate = useNavigate();
  const [email, setEmail] = useState(EXAMPLE_EMAIL);
  const [password, setPassword] = useState(EXAMPLE_PASSWORD);

  if (isSignedIn()) {
    return <Navigate to="/" replace />;
  }

  function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    markSignedIn();
    navigate("/", { replace: true });
  }

  return (
    <div className="cf-page flex min-h-screen flex-col md:flex-row">
      <div className="flex flex-col justify-center bg-gradient-to-br from-blue-600 to-emerald-600 p-8 text-white md:w-2/5">
        <p className="text-sm font-bold uppercase tracking-widest text-blue-100">
          InternSync
        </p>
        <h1 className="mt-2 text-3xl font-bold">Internships</h1>
        <p className="mt-3 text-sm leading-relaxed text-blue-50">
          Match listings to your profile and track applications.
        </p>
      </div>

      <div className="flex flex-1 flex-col justify-center p-6 md:p-10">
        <div className="mx-auto w-full max-w-sm">
          <h2 className="text-2xl font-bold text-slate-900">Sign in</h2>
          <p className="mt-1 text-sm text-slate-600">Use any credentials for the demo</p>

          <form onSubmit={handleSignIn} className="cf-card mt-6 space-y-4 p-6">
            <div>
              <label
                htmlFor="email"
                className="mb-1 block text-sm font-medium text-slate-800"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="cf-input"
                autoComplete="username"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-1 block text-sm font-medium text-slate-800"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="cf-input"
                autoComplete="current-password"
              />
            </div>

            <p className="rounded-lg border border-amber-300 bg-amber-100 px-2 py-2 text-xs text-amber-900">
              Example: {EXAMPLE_EMAIL} / {EXAMPLE_PASSWORD}
            </p>

            <button type="submit" className="cf-btn-primary w-full">
              Sign in
            </button>
          </form>
        </div>

        <p className="mx-auto mt-8 max-w-sm text-center text-xs text-slate-500">
          User credentials dont matter — click sign in
        </p>
      </div>
    </div>
  );
}
