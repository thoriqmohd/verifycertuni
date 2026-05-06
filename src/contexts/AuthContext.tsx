import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session, User } from "@supabase/supabase-js";

export type AppRole = "super_admin" | "university_admin" | "employer" | "finance_admin" | "public_verifier";

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  university_id: string | null;
  company_id: string | null;
  status: string;
}

interface AuthCtx {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  primaryRole: AppRole | null;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({} as AuthCtx);
export const useAuth = () => useContext(Ctx);

const ROLE_PRIORITY: AppRole[] = ["super_admin", "finance_admin", "university_admin", "employer", "public_verifier"];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExtras = async (uid: string) => {
    const [{ data: prof }, { data: rs }] = await Promise.all([
      supabase.from("users_profile").select("*").eq("user_id", uid).maybeSingle(),
      supabase.from("user_roles").select("role").eq("user_id", uid),
    ]);
    setProfile(prof as Profile | null);
    setRoles(((rs ?? []) as { role: AppRole }[]).map((r) => r.role));
  };

  const refresh = async () => {
    if (user) await loadExtras(user.id);
  };

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      setSession(sess);
      setUser(sess?.user ?? null);
      if (sess?.user) {
        setTimeout(() => loadExtras(sess.user.id), 0);
      } else {
        setProfile(null); setRoles([]);
      }
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) loadExtras(session.user.id).finally(() => setLoading(false));
      else setLoading(false);
    });
    return () => sub.subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const primaryRole = ROLE_PRIORITY.find((r) => roles.includes(r)) ?? null;

  const signOut = async () => { await supabase.auth.signOut(); };

  return <Ctx.Provider value={{ user, session, profile, roles, primaryRole, loading, signOut, refresh }}>{children}</Ctx.Provider>;
}

export function roleHomePath(role: AppRole | null): string {
  switch (role) {
    case "super_admin": return "/admin/dashboard";
    case "university_admin": return "/university/dashboard";
    case "employer": return "/employer/dashboard";
    case "finance_admin": return "/finance/dashboard";
    default: return "/login";
  }
}
