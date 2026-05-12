import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, ShieldOff, ShieldCheck } from "lucide-react";

type FinanceUser = {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  status: string;
  created_at: string;
};

export default function UniFinance() {
  const [list, setList] = useState<FinanceUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FinanceUser | null>(null);
  const [form, setForm] = useState({ full_name: "", email: "", password: "" });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    // Get user_ids that are finance_admin
    const { data: roleRows } = await supabase.from("user_roles").select("user_id").eq("role", "finance_admin");
    const ids = (roleRows ?? []).map((r) => r.user_id);
    if (ids.length === 0) { setList([]); setLoading(false); return; }
    const { data: profs } = await supabase
      .from("users_profile").select("id,user_id,full_name,email,status,created_at").in("user_id", ids);
    setList((profs as FinanceUser[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditing(null); setForm({ full_name: "", email: "", password: "" }); setOpen(true); };
  const openEdit = (u: FinanceUser) => { setEditing(u); setForm({ full_name: u.full_name, email: u.email, password: "" }); setOpen(true); };

  const save = async () => {
    setSaving(true);
    try {
      if (editing) {
        const { error } = await supabase
          .from("users_profile").update({ full_name: form.full_name }).eq("id", editing.id);
        if (error) throw error;
        toast.success("Finance admin updated");
      } else {
        if (!form.email || !form.password || !form.full_name) {
          toast.error("All fields are required"); setSaving(false); return;
        }
        const { data, error } = await supabase.functions.invoke("uni-create-finance", { body: form });
        if (error || (data as any)?.error) throw new Error((data as any)?.error ?? error?.message);
        toast.success("Finance admin created");
      }
      setOpen(false);
      await load();
    } catch (e: any) {
      toast.error(e.message ?? "Failed");
    } finally { setSaving(false); }
  };

  const toggleStatus = async (u: FinanceUser) => {
    const next = u.status === "active" ? "inactive" : "active";
    const { error } = await supabase.from("users_profile").update({ status: next }).eq("id", u.id);
    if (error) return toast.error(error.message);
    toast.success(`Marked ${next}`);
    load();
  };

  const remove = async (u: FinanceUser) => {
    if (!confirm(`Delete ${u.full_name}? This removes their access permanently.`)) return;
    const { data, error } = await supabase.functions.invoke("uni-delete-finance", { body: { user_id: u.user_id } });
    if (error || (data as any)?.error) return toast.error((data as any)?.error ?? error?.message);
    toast.success("Deleted");
    load();
  };

  return (
    <AppLayout title="Finance Admins" breadcrumbs={[{ label: "University", to: "/university/dashboard" }, { label: "Finance Admins" }]}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Manage Finance Admins</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" />Add Finance Admin</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{editing ? "Edit Finance Admin" : "New Finance Admin"}</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Full name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
                <div><Label>Email</Label><Input type="email" value={form.email} disabled={!!editing} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
                {!editing && (
                  <div><Label>Password</Label><Input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
                )}
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={save} disabled={saving}>{saving ? "Saving..." : "Save"}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-muted-foreground">No finance admins yet. Add one to get started.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead><TableHead>Email</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell><Badge variant={u.status === "active" ? "default" : "secondary"}>{u.status}</Badge></TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(u)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleStatus(u)}>
                        {u.status === "active" ? <ShieldOff className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(u)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
