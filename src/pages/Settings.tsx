import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Settings() {
  const { profile, refresh, user } = useAuth();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [pwd, setPwd] = useState("");

  useEffect(() => { setName(profile?.full_name ?? ""); }, [profile]);

  const saveProfile = async () => {
    if (!profile) return;
    setBusy(true);
    const { error } = await supabase.from("users_profile").update({ full_name: name }).eq("id", profile.id);
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success("Profile updated"); refresh(); }
  };

  const changePassword = async () => {
    if (pwd.length < 8) return toast.error("Password must be at least 8 characters");
    const { error } = await supabase.auth.updateUser({ password: pwd });
    if (error) toast.error(error.message); else { toast.success("Password updated"); setPwd(""); }
  };

  return (
    <AppLayout title="Settings" breadcrumbs={[{ label: "Settings" }]}>
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Profile</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>Full name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
            <div><Label>Email</Label><Input value={user?.email ?? ""} disabled /></div>
            <Button onClick={saveProfile} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save changes"}</Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Change password</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div><Label>New password</Label><Input type="password" value={pwd} onChange={(e) => setPwd(e.target.value)} /></div>
            <Button variant="outline" onClick={changePassword}>Update password</Button>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
