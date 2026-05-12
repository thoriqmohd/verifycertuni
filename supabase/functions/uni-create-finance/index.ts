import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(url, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: userData } = await userClient.auth.getUser();
    const caller = userData?.user;
    if (!caller) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(url, serviceKey);

    // Verify caller is university_admin and get their university_id
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", caller.id);
    const isUniAdmin = (roles ?? []).some((r) => r.role === "university_admin");
    if (!isUniAdmin) return json({ error: "Forbidden" }, 403);

    const { data: callerProfile } = await admin
      .from("users_profile").select("university_id").eq("user_id", caller.id).maybeSingle();
    const universityId = callerProfile?.university_id;
    if (!universityId) return json({ error: "No university found for caller" }, 400);

    const body = await req.json();
    const { email, password, full_name } = body ?? {};
    if (!email || !password || !full_name) return json({ error: "Missing fields" }, 400);

    // Create auth user
    const { data: created, error: createErr } = await admin.auth.admin.createUser({
      email, password, email_confirm: true, user_metadata: { full_name },
    });
    if (createErr || !created.user) return json({ error: createErr?.message ?? "Failed to create user" }, 400);
    const newUserId = created.user.id;

    // Insert profile
    const { error: profErr } = await admin.from("users_profile").insert({
      user_id: newUserId, email, full_name, university_id: universityId, status: "active",
    });
    if (profErr) {
      await admin.auth.admin.deleteUser(newUserId);
      return json({ error: profErr.message }, 400);
    }

    // Insert finance_admin role
    const { error: roleErr } = await admin.from("user_roles").insert({
      user_id: newUserId, role: "finance_admin",
    });
    if (roleErr) {
      await admin.auth.admin.deleteUser(newUserId);
      return json({ error: roleErr.message }, 400);
    }

    return json({ ok: true, user_id: newUserId });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
