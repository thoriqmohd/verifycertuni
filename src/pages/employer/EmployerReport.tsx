import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, Printer, Download, ArrowLeft, BookmarkPlus } from "lucide-react";
import QRCode from "qrcode";
import { toast } from "sonner";
import { formatDate, formatDateTime, maskIc } from "@/lib/format";
import { StatusBadge } from "@/components/StatusBadge";

export default function EmployerReport() {
  const { id } = useParams();
  const nav = useNavigate();
  const [vr, setVr] = useState<any>(null);
  const [qr, setQr] = useState<string>("");
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("verification_requests").select("*, certificate:certificates(*, university:universities(name)), company:companies(company_name)").eq("id", id).maybeSingle();
      if (!data) return setDenied(true);
      if (data.payment_status !== "paid") return setDenied(true);
      setVr(data);
      const url = `${window.location.origin}/verify/${data.certificate?.certificate_number}`;
      QRCode.toDataURL(url, { width: 220, margin: 1 }).then(setQr);
    })();
  }, [id]);

  if (denied) return <AppLayout title="Report"><Card><CardContent className="text-center py-12"><p className="text-muted-foreground mb-4">This report is not available. Payment may not have been completed.</p><Button asChild><Link to="/employer/dashboard">Back to dashboard</Link></Button></CardContent></Card></AppLayout>;
  if (!vr) return <AppLayout title="Report"><Loader2 className="h-5 w-5 animate-spin text-primary" /></AppLayout>;

  const c = vr.certificate;
  return (
    <AppLayout title="Verification Report" breadcrumbs={[{ label: "Employer" }, { label: "History", to: "/employer/history" }, { label: "Report" }]}>
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-wrap gap-2 mb-4 no-print">
          <Button variant="outline" onClick={() => nav(-1)}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
          <div className="flex-1" />
          <Button variant="outline" onClick={() => { toast.success("Candidate saved"); }}><BookmarkPlus className="h-4 w-4 mr-1" /> Save candidate</Button>
          <Button variant="outline" onClick={() => window.print()}><Printer className="h-4 w-4 mr-1" /> Print</Button>
          <Button onClick={() => window.print()}><Download className="h-4 w-4 mr-1" /> Download PDF</Button>
        </div>

        <Card>
          <CardContent className="p-0">
            <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-8 rounded-t-xl">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-3"><ShieldCheck className="h-6 w-6" /><span className="font-bold text-lg">VerifyCert</span></div>
                  <h1 className="text-2xl font-bold">Certificate Verification Report</h1>
                  <div className="text-primary-foreground/80 mt-1 font-mono text-sm">{vr.report_reference_no}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs uppercase tracking-wider text-primary-foreground/70">Status</div>
                  <div className="mt-1"><StatusBadge status={c.certificate_status} className="text-sm py-1 px-3 bg-white/20 text-white border-white/30" /></div>
                </div>
              </div>
            </div>

            <div className="p-8 grid md:grid-cols-3 gap-8">
              <div className="md:col-span-2 space-y-6">
                <Section title="Certificate Holder">
                  <Field label="Name" value={c.student_name} />
                  <Field label="IC / Passport" value={maskIc(c.ic_passport)} />
                  <Field label="Matric" value={c.matric_number} />
                </Section>
                <Section title="Academic Details">
                  <Field label="University" value={c.university?.name} />
                  <Field label="Faculty" value={c.faculty} />
                  <Field label="Programme" value={c.programme_name} />
                  <Field label="Award" value={c.award_type} />
                  <Field label="Graduation" value={formatDate(c.graduation_date)} />
                  <Field label="Convocation" value={formatDate(c.convocation_date)} />
                  <Field label="Certificate no." value={c.certificate_number} />
                </Section>
                <Section title="Verification">
                  <Field label="Issued to" value={vr.company?.company_name} />
                  <Field label="Verified at" value={formatDateTime(vr.created_at)} />
                </Section>
              </div>
              <div className="text-center">
                {qr && <img src={qr} alt="QR" className="mx-auto rounded-lg border p-2 bg-white" />}
                <div className="text-xs text-muted-foreground mt-2">Scan to re-verify</div>
                <a href={`/verify/${c.certificate_number}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline break-all">/verify/{c.certificate_number}</a>
              </div>
            </div>

            <div className="border-t bg-muted/40 p-6 text-xs text-muted-foreground rounded-b-xl">
              <strong>Disclaimer:</strong> This verification report is generated based on certificate records provided by the participating university. VerifyCert is not the issuing institution.
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}

const Section = ({ title, children }: any) => (
  <div>
    <h3 className="text-xs uppercase tracking-wider text-muted-foreground font-semibold mb-3">{title}</h3>
    <div className="grid sm:grid-cols-2 gap-4">{children}</div>
  </div>
);
const Field = ({ label, value }: any) => (
  <div><div className="text-xs text-muted-foreground">{label}</div><div className="font-medium text-sm">{value ?? "—"}</div></div>
);
