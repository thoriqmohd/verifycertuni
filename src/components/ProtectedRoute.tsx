import { Navigate, useLocation } from "react-router-dom";
import { useAuth, AppRole, roleHomePath } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

export function ProtectedRoute({ children, allow }: { children: React.ReactNode; allow: AppRole[] }) {
  const { user, loading, roles, primaryRole } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  const ok = roles.some((r) => allow.includes(r));
  if (!ok) return <Navigate to={roleHomePath(primaryRole)} replace />;
  return <>{children}</>;
}
