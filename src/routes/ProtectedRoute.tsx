import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ivory">
        <Loader2 className="h-6 w-6 animate-spin text-forest-800" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/verify-phone" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
