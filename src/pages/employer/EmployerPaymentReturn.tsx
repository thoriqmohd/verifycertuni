import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";

export default function EmployerPaymentReturn() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const nav = useNavigate();
  const [status, setStatus] = useState<"checking" | "paid" | "pending" | "failed">("checking");
  const billplzPaid = params.get("billplz[paid]") === "true";

  useEffect(() => {
    let attempts = 0;
    const poll = async () => {
      attempts++;
      const { data } = await supabase
        .from("verification_requests")
        .select("payment_status")
        .eq("id", id!)
        .maybeSingle();
      if (data?.payment_status === "paid") {
        setStatus("paid");
        setTimeout(() => nav(`/employer/report/${id}`), 1200);
        return;
      }
      if (!billplzPaid && attempts > 1) { setStatus("failed"); return; }
      if (attempts >= 12) { setStatus("pending"); return; }
      setTimeout(poll, 1500);
    };
    poll();
  }, [id, nav, billplzPaid]);

  return (
    <AppLayout title="Payment status">
      <div className="max-w-md mx-auto">
        <Card>
          <CardContent className="py-10 text-center space-y-4">
            {status === "checking" && (<><Loader2 className="h-10 w-10 mx-auto animate-spin text-primary" /><p>Confirming your payment with Billplz…</p></>)}
            {status === "paid" && (<><CheckCircle2 className="h-12 w-12 mx-auto text-green-600" /><p className="font-medium">Payment received. Redirecting to your report…</p></>)}
            {status === "pending" && (<><Clock className="h-12 w-12 mx-auto text-amber-500" /><p>We haven't received confirmation yet. It will appear in your history once Billplz notifies us.</p><Button onClick={() => nav("/employer/history")}>Go to history</Button></>)}
            {status === "failed" && (<><XCircle className="h-12 w-12 mx-auto text-destructive" /><p>Payment was not completed.</p><Button onClick={() => nav(`/employer/payment/${id}`)}>Try again</Button></>)}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
