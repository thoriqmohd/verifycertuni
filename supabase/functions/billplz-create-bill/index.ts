import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BILLPLZ_API = "https://www.billplz.com/api/v3"; // production

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("BILLPLZ_API_KEY")!;
    const collectionId = Deno.env.get("BILLPLZ_COLLECTION_ID")!;
    if (!apiKey || !collectionId) throw new Error("Billplz credentials missing");

    const authHeader = req.headers.get("Authorization") ?? "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const body = await req.json();
    const { verification_request_id, amount, description, name, email, mobile, addons, return_url } = body;

    if (!verification_request_id || !amount || !email || !name) {
      return new Response(JSON.stringify({ error: "Missing fields" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const callbackUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/billplz-callback`;

    const form = new URLSearchParams();
    form.append("collection_id", collectionId);
    form.append("email", email);
    form.append("name", name);
    if (mobile) form.append("mobile", mobile);
    form.append("amount", String(Math.round(Number(amount) * 100))); // sen
    form.append("callback_url", callbackUrl);
    form.append("redirect_url", return_url);
    form.append("description", description ?? "Certificate verification");
    form.append("reference_1_label", "VR ID");
    form.append("reference_1", verification_request_id);
    if (addons) {
      form.append("reference_2_label", "Add-ons");
      form.append("reference_2", String(addons).slice(0, 120));
    }

    const auth = "Basic " + btoa(`${apiKey}:`);
    const res = await fetch(`${BILLPLZ_API}/bills`, {
      method: "POST",
      headers: { Authorization: auth, "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });

    const data = await res.json();
    if (!res.ok) {
      console.error("Billplz error", data);
      return new Response(JSON.stringify({ error: data?.error ?? "Billplz request failed", details: data }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ bill_id: data.id, payment_url: data.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error(e);
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
