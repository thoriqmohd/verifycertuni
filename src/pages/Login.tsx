import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { roleHomePath, AppRole } from "@/contexts/AuthContext";
import loginBg from "@/assets/login-bg.jpg";

const demoButtons: { role: AppRole; label: string }[] = [
  { role: "super_admin", label: "Super Admin" },
  { role: "university_admin", label: "University Admin" },
  { role: "employer", label: "Employer" },
  { role: "finance_admin", label: "Finance Admin" },
];

export default function Login() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const finishLogin = async (uid: string) => {
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", uid);
    const list = (roles ?? []).map((r: any) => r.role as AppRole);
    const ROLE_PRIORITY: AppRole[] = ["super_admin","finance_admin","university_admin","employer","public_verifier"];
    const primary = ROLE_PRIORITY.find((r) => list.includes(r)) ?? null;
    nav(roleHomePath(primary));
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("manual");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(null);
    if (error) return toast.error(error.message);
    if (data.user) { toast.success("Signed in"); await finishLogin(data.user.id); }
  };

  const handleDemo = async (role: AppRole) => {
    setBusy(role);
    try {
      const { data, error } = await supabase.functions.invoke("demo-login", { body: { role } });
      if (error || !data?.email) throw error ?? new Error("No credentials returned");
      const { data: signed, error: e2 } = await supabase.auth.signInWithPassword({ email: data.email, password: data.password });
      if (e2) throw e2;
      toast.success(`Signed in as ${role.replace("_", " ")}`);
      if (signed.user) await finishLogin(signed.user.id);
    } catch (e: any) {
      toast.error(e?.message ?? "Demo login failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative">
      <img src={loginBg} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-br from-background/90 via-background/80 to-primary/40" />
      <div className="absolute inset-0 bg-black/50" />
      <div className="w-full max-w-md relative z-10">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center"><ShieldCheck className="h-5 w-5 text-primary-foreground" /></div>
          <span className="font-bold text-xl">VerifyCert</span>
        </Link>
        <Card className="shadow-[var(--shadow-card)]">
          <CardHeader>
            <CardTitle>Sign in</CardTitle>
            <CardDescription>Access your VerifyCert dashboard</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <form onSubmit={handleLogin} className="space-y-4">
              <div><Label htmlFor="email">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
              <div><Label htmlFor="password">Password</Label><Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
              <Button type="submit" className="w-full" disabled={busy === "manual"}>{busy === "manual" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Sign in"}</Button>
            </form>
            <div className="relative"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs uppercase"><span className="bg-card px-2 text-muted-foreground">or try a demo</span></div></div>
            <div className="grid grid-cols-2 gap-2">
              {demoButtons.map((b) => (
                <Button key={b.role} variant="outline" size="sm" onClick={() => handleDemo(b.role)} disabled={busy === b.role}>
                  {busy === b.role ? <Loader2 className="h-4 w-4 animate-spin" /> : b.label}
                </Button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">No account? <Link to="/register" className="text-primary font-medium hover:underline">Register as employer</Link></p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
