import { Link, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const location = useLocation();
  const { status, error, refreshUser } = useAuth();

  if (status === "checking") {
    return <main className="grid min-h-screen place-items-center p-6 text-sm text-muted">Checking your session…</main>;
  }
  if (status === "error") {
    return (
      <main className="grid min-h-screen place-items-center p-6">
        <section className="max-w-md rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-white/10 dark:bg-slate-900">
          <h1 className="text-xl font-semibold">Unable to verify your session</h1>
          <p className="mt-3 text-sm text-muted">{error}</p>
          <button className="mt-6 rounded-xl bg-brand px-5 py-3 text-sm font-semibold text-white" onClick={refreshUser}>Try again</button>
          <Link className="mt-4 block text-sm font-medium text-brand" to="/">Back to home</Link>
        </section>
      </main>
    );
  }
  if (status !== "authenticated") return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}