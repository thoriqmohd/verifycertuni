// Provisions (idempotently) the 4 demo accounts and returns credentials.
// Frontend then signs in with email/password.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Role = "super_admin" | "university_admin" | "employer" | "finance_admin";

const DEMO: Record<Role, { email: string; password: string; full_name: string; university_id?: string; company_id?: string }> = {
  super_admin:      { email: "superadmin@verifycert.demo",  password: "Demo1234!", full_name: "Aminah Yusof (Super Admin)" },
  university_admin: { email: "uniadmin@verifycert.demo",    password: "Demo1234!", full_name: "Dr. Ahmad Zulkifli (UTM Admin)", university_id: "11111111-1111-1111-1111-111111111111" },
  employer:         { email: "employer@verifycert.demo",    password: "Demo1234!", full_name: "Lim Wei Jian (TalentVerify)",   company_id: "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa" },
  finance_admin:    { email: "finance@verifycert.demo",     password: "Demo1234!", full_name: "Rajan Pillai (Finance)" },
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { role } = await req.json();
    if (!role || !(role in DEMO)) return new Response(JSON.stringify({ error: "invalid role" }), { status: 400, headers: { ...corsHeaders, "content-type": "application/json" } });

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const cfg = DEMO[role as Role];

    // Try create user (idempotent)
    let userId: string | null = null;
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email: cfg.email,
      password: cfg.password,
      email_confirm: true,
      user_metadata: { full_name: cfg.full_name },
    });
    if (created?.user) {
      userId = created.user.id;
    } else {
      // Already exists - look it up
      const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
      const found = list?.users.find((u) => u.email === cfg.email);
      if (!found) throw createErr ?? new Error("could not provision user");
      userId = found.id;
      // Reset password to known value so demo always works
      await admin.auth.admin.updateUserById(userId, { password: cfg.password });
    }

    // Upsert profile
    await admin.from("users_profile").upsert({
      user_id: userId,
      full_name: cfg.full_name,
      email: cfg.email,
      university_id: cfg.university_id ?? null,
      company_id: cfg.company_id ?? null,
      status: "active",
    }, { onConflict: "user_id" });

    // Ensure role
    await admin.from("user_roles").upsert({ user_id: userId, role }, { onConflict: "user_id,role" });

    return new Response(JSON.stringify({ email: cfg.email, password: cfg.password }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e?.message ?? e) }), { status: 500, headers: { ...corsHeaders, "content-type": "application/json" } });
  }
});
