import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Register() {
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    company_name: "", registration_no: "", contact_person: "", email: "", password: "", address: "",
  });
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (f.password.length < 8) return toast.error("Password must be at least 8 characters");
    setBusy(true);
    try {
      const companyId = crypto.randomUUID();

      // Create company
      const { error: cErr } = await supabase.from("companies").insert({
        id: companyId,
        company_name: f.company_name, registration_no: f.registration_no,
        contact_person: f.contact_person, contact_email: f.email, address: f.address, status: "active",
      });
      if (cErr) throw cErr;

      // Create auth user
      const { data: auth, error: aErr } = await supabase.auth.signUp({
        email: f.email, password: f.password,
        options: { emailRedirectTo: `${window.location.origin}/employer/dashboard`, data: { full_name: f.contact_person } },
      });
      if (aErr) throw aErr;
      if (!auth.user) throw new Error("Signup failed");

      // Profile + role
      const { error: pErr } = await supabase.from("users_profile").insert({
        user_id: auth.user.id, full_name: f.contact_person, email: f.email, company_id: companyId, status: "active",
      });
      if (pErr) throw pErr;

      const { error: rErr } = await supabase.from("user_roles").insert({ user_id: auth.user.id, role: "employer" });
      if (rErr) throw rErr;

      toast.success("Account created");
      nav("/employer/dashboard");
    } catch (e: any) {
      toast.error(e?.message ?? "Could not register");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-secondary/40 py-10">
      <div className="w-full max-w-lg">
        <Link to="/" className="flex items-center justify-center gap-2 mb-6">
          <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center"><ShieldCheck className="h-5 w-5 text-primary-foreground" /></div>
          <span className="font-bold text-xl">VerifyCert</span>
        </Link>
        <Card>
          <CardHeader>
            <CardTitle>Register your company</CardTitle>
            <CardDescription>Create an employer account to verify candidate certificates.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={onSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Company name</Label><Input required value={f.company_name} onChange={set("company_name")} /></div>
                <div><Label>Registration number</Label><Input required value={f.registration_no} onChange={set("registration_no")} /></div>
              </div>
              <div><Label>Contact person</Label><Input required value={f.contact_person} onChange={set("contact_person")} /></div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Email</Label><Input type="email" required value={f.email} onChange={set("email")} /></div>
                <div><Label>Password</Label><Input type="password" required minLength={8} value={f.password} onChange={set("password")} /></div>
              </div>
              <div><Label>Address</Label><Textarea rows={2} value={f.address} onChange={set("address")} /></div>
              <Button type="submit" className="w-full" disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create account"}</Button>
              <p className="text-center text-sm text-muted-foreground">Already registered? <Link to="/login" className="text-primary font-medium hover:underline">Sign in</Link></p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
