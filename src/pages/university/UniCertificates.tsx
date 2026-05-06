import { useEffect, useMemo, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { StatusBadge } from "@/components/StatusBadge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Copy, Loader2, ExternalLink, FileBadge } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Paginator, usePaged } from "@/components/Pagination";
import { EmptyState } from "@/components/StatCard";

const empty = { certificate_number: "", student_name: "", ic_passport: "", matric_number: "", faculty: "", programme_name: "", award_type: "", graduation_date: "", convocation_date: "", certificate_status: "valid" as const };

export default function UniCertificates() {
  const { profile } = useAuth();
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState(""); const [status, setStatus] = useState("all");
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<string | null>(null);
  const [f, setF] = useState<any>(empty); const [busy, setBusy] = useState(false);
  const [page, setPage] = useState(1);

  const load = async () => {
    if (!profile?.university_id) return;
    const { data } = await supabase.from("certificates").select("*").eq("university_id", profile.university_id).order("created_at", { ascending: false });
    setRows(data ?? []);
  };
  useEffect(() => { load(); }, [profile?.university_id]);

  const filtered = useMemo(() => rows.filter((r) => (status === "all" || r.certificate_status === status) && (q === "" || r.student_name.toLowerCase().includes(q.toLowerCase()) || r.certificate_number.toLowerCase().includes(q.toLowerCase()))), [rows, q, status]);
  useEffect(() => { setPage(1); }, [q, status]);
  const { slice, pages, page: pg, total } = usePaged(filtered, page, 10);

  const openNew = () => { setEditId(null); setF(empty); setOpen(true); };
  const openEdit = (r: any) => { setEditId(r.id); setF({ ...r, graduation_date: r.graduation_date ?? "", convocation_date: r.convocation_date ?? "" }); setOpen(true); };

  const save = async () => {
    if (!profile?.university_id) return;
    setBusy(true);
    const payload: any = {
      certificate_number: f.certificate_number, student_name: f.student_name, ic_passport: f.ic_passport,
      matric_number: f.matric_number, faculty: f.faculty, programme_name: f.programme_name, award_type: f.award_type,
      graduation_date: f.graduation_date || null, convocation_date: f.convocation_date || null,
      certificate_status: f.certificate_status, university_id: profile.university_id,
    };
    const { error } = editId ? await supabase.from("certificates").update(payload).eq("id", editId) : await supabase.from("certificates").insert(payload);
    setBusy(false);
    if (error) toast.error(error.message); else { toast.success(editId ? "Certificate updated" : "Certificate added"); setOpen(false); load(); }
  };

  const setCertStatus = async (id: string, s: "valid" | "revoked" | "suspended" | "pending") => {
    const { error } = await supabase.from("certificates").update({ certificate_status: s }).eq("id", id);
    if (error) toast.error(error.message); else { toast.success(`Status: ${s}`); load(); }
  };
  const remove = async (id: string) => {
    const { error } = await supabase.from("certificates").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Removed"); load(); }
  };
  const copyVerify = (cn: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/verify/${cn}`);
    toast.success("Verification link copied");
  };

  return (
    <AppLayout title="Certificates" breadcrumbs={[{ label: "University" }, { label: "Certificates" }]}>
      <Card><CardContent className="p-4 lg:p-6">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="relative flex-1 min-w-[220px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search by name or certificate no..." value={q} onChange={(e) => setQ(e.target.value)} /></div>
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="valid">Valid</SelectItem><SelectItem value="revoked">Revoked</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem><SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add certificate</Button></DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader><DialogTitle>{editId ? "Edit certificate" : "Add certificate"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3 max-h-[60vh] overflow-y-auto pr-1">
                <div className="col-span-2"><Label>Certificate number</Label><Input value={f.certificate_number} onChange={(e) => setF({ ...f, certificate_number: e.target.value })} /></div>
                <div className="col-span-2"><Label>Student name</Label><Input value={f.student_name} onChange={(e) => setF({ ...f, student_name: e.target.value })} /></div>
                <div><Label>IC / Passport</Label><Input value={f.ic_passport ?? ""} onChange={(e) => setF({ ...f, ic_passport: e.target.value })} /></div>
                <div><Label>Matric number</Label><Input value={f.matric_number ?? ""} onChange={(e) => setF({ ...f, matric_number: e.target.value })} /></div>
                <div><Label>Faculty</Label><Input value={f.faculty ?? ""} onChange={(e) => setF({ ...f, faculty: e.target.value })} /></div>
                <div><Label>Programme</Label><Input value={f.programme_name ?? ""} onChange={(e) => setF({ ...f, programme_name: e.target.value })} /></div>
                <div><Label>Award type</Label><Input value={f.award_type ?? ""} onChange={(e) => setF({ ...f, award_type: e.target.value })} /></div>
                <div><Label>Status</Label>
                  <Select value={f.certificate_status} onValueChange={(v) => setF({ ...f, certificate_status: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent><SelectItem value="valid">Valid</SelectItem><SelectItem value="revoked">Revoked</SelectItem><SelectItem value="suspended">Suspended</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label>Graduation date</Label><Input type="date" value={f.graduation_date ?? ""} onChange={(e) => setF({ ...f, graduation_date: e.target.value })} /></div>
                <div><Label>Convocation date</Label><Input type="date" value={f.convocation_date ?? ""} onChange={(e) => setF({ ...f, convocation_date: e.target.value })} /></div>
              </div>
              <DialogFooter><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={save} disabled={busy}>{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {filtered.length === 0 ? (
          <EmptyState icon={<FileBadge className="h-5 w-5" />} title="No certificates yet" description="Add a certificate manually or sync via API." action={<Button onClick={openNew}><Plus className="h-4 w-4 mr-1" /> Add certificate</Button>} />
        ) : (
          <>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader><TableRow><TableHead>Certificate no.</TableHead><TableHead>Student</TableHead><TableHead className="hidden md:table-cell">Programme</TableHead><TableHead className="hidden lg:table-cell">Award</TableHead><TableHead>Status</TableHead><TableHead></TableHead></TableRow></TableHeader>
                <TableBody>
                  {slice.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.certificate_number}</TableCell>
                      <TableCell className="font-medium">{r.student_name}</TableCell>
                      <TableCell className="text-sm hidden md:table-cell">{r.programme_name}</TableCell>
                      <TableCell className="text-sm hidden lg:table-cell">{r.award_type}</TableCell>
                      <TableCell><StatusBadge status={r.certificate_status} /></TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild><Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(r)}>Edit</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => copyVerify(r.certificate_number)}><Copy className="h-3.5 w-3.5 mr-2" />Copy verification link</DropdownMenuItem>
                            <DropdownMenuItem asChild><Link to={`/verify/${r.certificate_number}`} target="_blank"><ExternalLink className="h-3.5 w-3.5 mr-2" />View public page</Link></DropdownMenuItem>
                            {r.certificate_status !== "valid" && <DropdownMenuItem onClick={() => setCertStatus(r.id, "valid")}>Mark valid</DropdownMenuItem>}
                            {r.certificate_status !== "revoked" && <DropdownMenuItem onClick={() => setCertStatus(r.id, "revoked")}>Revoke</DropdownMenuItem>}
                            {r.certificate_status !== "suspended" && <DropdownMenuItem onClick={() => setCertStatus(r.id, "suspended")}>Suspend</DropdownMenuItem>}
                            <AlertDialog>
                              <AlertDialogTrigger asChild><DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>Delete</DropdownMenuItem></AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader><AlertDialogTitle>Delete certificate?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
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
      </CardContent></Card>
    </AppLayout>
  );
}
