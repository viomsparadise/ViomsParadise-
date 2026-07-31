import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2, ShieldAlert } from "lucide-react";

export function AdminRoute() {
  const { user, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-forest-950">
        <Loader2 className="h-6 w-6 animate-spin text-ivory" />
      </div>
    );
  }

  if (!user) return <Navigate to="/admin/login" replace />;

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-forest-950 text-ivory">
        <ShieldAlert className="h-10 w-10 text-ember-light" />
        <p className="font-display text-xl">Access restricted</p>
        <p className="max-w-sm text-center text-sm text-ivory/60">
          This account is not registered as an administrator. Contact the property owner to be added to
          <code className="mx-1 rounded bg-ivory/10 px-1.5 py-0.5">admin_users</code>.
        </p>
      </div>
    );
  }

  return <Outlet />;
}
