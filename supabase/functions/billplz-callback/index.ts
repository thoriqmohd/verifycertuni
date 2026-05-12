import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

// Verify Billplz X-Signature for callback per spec:
// source string = sorted "key1value1|key2value2..." of all payload keys EXCEPT x_signature
async function hmacSha256Hex(key: string, msg: string): Promise<string> {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    "raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", cryptoKey, enc.encode(msg));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function buildSourceString(params: Record<string, string>): string {
  const keys = Object.keys(params).filter((k) => k !== "x_signature").sort();
  return keys.map((k) => `${k}${params[k]}`).join("|");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const xSig = Deno.env.get("BILLPLZ_X_SIGNATURE_KEY")!;

    const ct = req.headers.get("content-type") ?? "";
    let payload: Record<string, string> = {};
    if (ct.includes("application/x-www-form-urlencoded")) {
      const text = await req.text();
      new URLSearchParams(text).forEach((v, k) => (payload[k] = v));
    } else if (ct.includes("application/json")) {
      payload = await req.json();
    } else {
      const text = await req.text();
      try { payload = JSON.parse(text); } catch { new URLSearchParams(text).forEach((v, k) => (payload[k] = v)); }
    }

    console.log("Billplz callback payload", payload);

    const provided = payload["x_signature"];
    if (!provided) return new Response("missing signature", { status: 400, headers: corsHeaders });

    const expected = await hmacSha256Hex(xSig, buildSourceString(payload));
    if (expected !== provided) {
      console.error("Signature mismatch", { expected, provided });
      return new Response("invalid signature", { status: 403, headers: corsHeaders });
    }

    const paid = payload["paid"] === "true" || payload["state"] === "paid";
    const billId = payload["id"];
    const vrId = payload["reference_1"]; // verification_request_id
    const addons = payload["reference_2"] ?? "";
    const amountSen = Number(payload["amount"] ?? 0);
    const amount = amountSen / 100;

    if (!vrId) return new Response("missing reference", { status: 400, headers: corsHeaders });

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    if (!paid) {
      // record failed/pending transaction (optional)
      return new Response("ok", { headers: corsHeaders });
    }

    // Idempotency: skip if already inserted
    const { data: existing } = await supabase
      .from("transactions")
      .select("id")
      .eq("payment_reference", billId)
      .maybeSingle();
    if (existing) return new Response("already processed", { headers: corsHeaders });

    // Compute splits using current settings
    const { data: settings } = await supabase
      .from("payment_settings").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle();
    const fee = Number(settings?.verification_fee ?? 20);
    const gateway = 1;
    const platformRate = Number(settings?.platform_commission_rate ?? 40) / 100;
    const addOnsTotal = Math.max(0, amount - fee);
    const platform = Math.max(0, (fee - gateway) * platformRate);
    const uniShare = Math.max(0, fee - gateway - platform + addOnsTotal);

    const ref = `RPT-${new Date().toISOString().slice(0, 10).replace(/-/g, "")}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    await supabase.from("verification_requests").update({
      payment_status: "paid", status: "completed", report_reference_no: ref,
    }).eq("id", vrId);

    await supabase.from("transactions").insert({
      verification_request_id: vrId,
      amount, university_share: uniShare, platform_share: platform,
      gateway_fee: gateway, payment_gateway: "Billplz",
      payment_reference: billId,
      payment_status: "paid", paid_at: new Date().toISOString(),
    });

    return new Response("ok", { headers: corsHeaders });
  } catch (e) {
    console.error(e);
    return new Response((e as Error).message, { status: 500, headers: corsHeaders });
  }
});
