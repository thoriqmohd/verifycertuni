import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Copy, KeyRound, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { generateApiKey, generateApiSecret, formatDate } from "@/lib/format";
import { Paginator, usePaged } from "@/components/Pagination";
import { EmptyState } from "@/components/StatCard";

const empty = { name: "", registration_no: "", contact_person: "", contact_email: "", address: "", commission_rate: 40, logo_url: "" };

export default function AdminUniversities() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState<any>(empty);
  const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);

  const load = async () => {
    const { data } = await supabase.from("universities").select("*").order("created_at", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => rows.filter((r) => (filter === "all" || r.status === filter) && r.name.toLowerCase().includes(q.toLowerCase())), [rows, q, filter]);
  useEffect(() => { setPage(1); }, [q, filter]);
  const { slice, pages, page: pg, total } = usePaged(filtered, page, 10);

  const openNew = () => { setEditId(null); setF(empty); setDialogOpen(true); };
  const openEdit = (r: any) => { setEditId(r.id); setF({ ...r }); setDialogOpen(true); };

  const uploadLogo = async (file: File) => {
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error: upErr } = await supabase.storage.from("university-logos").upload(path, file, { upsert: true });
    if (upErr) { toast.error(upErr.message); return; }
    const { data } = supabase.storage.from("university-logos").getPublicUrl(path);
    setF((prev: any) => ({ ...prev, logo_url: data.publicUrl }));
    toast.success("Logo uploaded");
  };

  const save = async () => {
    setBusy(true);
    if (editId) {
      const { error } = await supabase.from("universities").update({
        name: f.name, registration_no: f.registration_no, contact_person: f.contact_person,
        contact_email: f.contact_email, address: f.address, commission_rate: Number(f.commission_rate), logo_url: f.logo_url,
      }).eq("id", editId);
      if (error) toast.error(error.message); else toast.success("University updated");
    } else {
      const { error } = await supabase.from("universities").insert({
        name: f.name, registration_no: f.registration_no, contact_person: f.contact_person,
        contact_email: f.contact_email, address: f.address, commission_rate: Number(f.commission_rate), logo_url: f.logo_url,
        api_key: generateApiKey(), api_secret: generateApiSecret(), status: "pending",
      });
      if (error) toast.error(error.message); else toast.success("University added");
    }
    setBusy(false); setDialogOpen(false); load();
  };

  const setStatus = async (id: string, status: "active" | "pending" | "suspended" | "inactive") => {
    const { error } = await supabase.from("universities").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(`Status set to ${status}`); load(); }
  };

  const regenKey = async (id: string) => {
    const { error } = await supabase.from("universities").update({ api_key: generateApiKey(), api_secret: generateApiSecret() }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success("API credentials regenerated"); load(); }
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("universities").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("University removed"); load(); }
  };

  return (
    <AppLayout title="Universities" breadcrumbs={[{ label: "Admin" }, { label: "Universities" }]}>
      <Card>
        <CardContent className="p-4 lg:p-6">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Search universities..." value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild><Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add university</Button></DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>{editId ? "Edit university" : "Add university"}</DialogTitle></DialogHeader>
                <div className="space-y-3">
                  <div><Label>Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Registration no.</Label><Input value={f.registration_no ?? ""} onChange={(e) => setF({ ...f, registration_no: e.target.value })} /></div>
                    <div><Label>Commission rate (%)</Label><Input type="number" value={f.commission_rate} onChange={(e) => setF({ ...f, commission_rate: e.target.value })} /></div>
                  </div>
                  <div><Label>Contact person</Label><Input value={f.contact_person ?? ""} onChange={(e) => setF({ ...f, contact_person: e.target.value })} /></div>
                  <div><Label>Contact email</Label><Input value={f.contact_email ?? ""} onChange={(e) => setF({ ...f, contact_email: e.target.value })} /></div>
                  <div><Label>Address</Label><Textarea rows={2} value={f.address ?? ""} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
                  <div>
                    <Label>University logo</Label>
                    <div className="flex items-center gap-3 mt-1">
                      {f.logo_url && <img src={f.logo_url} alt="logo" className="h-12 w-12 object-contain rounded border bg-white p-1" />}
                      <Input type="file" accept="image/*" onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadLogo(file); }} />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                  <Button onClick={save} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={<Building2 className="h-5 w-5" />} title="No universities yet" description="Add your first partner university to get started." />
          ) : (
            <>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader><TableRow><TableHead>University</TableHead><TableHead className="hidden md:table-cell">Reg no.</TableHead><TableHead>Commission</TableHead><TableHead className="hidden lg:table-cell">API key</TableHead><TableHead>Status</TableHead><TableHead className="hidden md:table-cell">Created</TableHead><TableHead></TableHead></TableRow></TableHeader>
                  <TableBody>
                    {slice.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="font-medium">{r.name}</div>
                          <div className="text-xs text-muted-foreground">{r.contact_email}</div>
                        </TableCell>
                        <TableCell className="text-sm hidden md:table-cell">{r.registration_no}</TableCell>
                        <TableCell>{r.commission_rate}%</TableCell>
                        <TableCell className="hidden lg:table-cell">
                          <button onClick={() => { navigator.clipboard.writeText(r.api_key); toast.success("API key copied"); }} className="font-mono text-xs flex items-center gap-1.5 hover:text-primary">
                            {r.api_key?.slice(0, 16)}… <Copy className="h-3 w-3" />
                          </button>
                        </TableCell>
                        <TableCell><StatusBadge status={r.status} /></TableCell>
                        <TableCell className="text-sm text-muted-foreground hidden md:table-cell">{formatDate(r.created_at)}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(r)}>Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => regenKey(r.id)}><KeyRound className="h-3.5 w-3.5 mr-2" />Regenerate API key</DropdownMenuItem>
                              {r.status !== "active" && <DropdownMenuItem onClick={() => setStatus(r.id, "active")}>Approve</DropdownMenuItem>}
                              {r.status !== "suspended" && <DropdownMenuItem onClick={() => setStatus(r.id, "suspended")}>Suspend</DropdownMenuItem>}
                              <AlertDialog>
                                <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem></AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader><AlertDialogTitle>Delete university?</AlertDialogTitle><AlertDialogDescription>This will remove all certificates and verification requests linked to this university.</AlertDialogDescription></AlertDialogHeader>
                                  <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => remove(r.id)}>Delete</AlertDialogAction></AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <Paginator page={pg} pages={pages} total={total} onChange={setPage} />
            </>
          )}
        </CardContent>
      </Card>
    </AppLayout>
  );
}
