import { Navigate, useLocation } from "react-router-dom";
import useAuth from "../../hooks/useAuth.js";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="p-xl text-center font-mono text-sm text-on-surface-variant">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  return children;
}
