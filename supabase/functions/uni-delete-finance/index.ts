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
    const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", caller.id);
    const isUniAdmin = (roles ?? []).some((r) => r.role === "university_admin");
    if (!isUniAdmin) return json({ error: "Forbidden" }, 403);

    const { data: callerProfile } = await admin
      .from("users_profile").select("university_id").eq("user_id", caller.id).maybeSingle();
    const universityId = callerProfile?.university_id;
    if (!universityId) return json({ error: "No university" }, 400);

    const { user_id } = await req.json();
    if (!user_id) return json({ error: "Missing user_id" }, 400);

    // Verify target belongs to same university
    const { data: target } = await admin
      .from("users_profile").select("university_id").eq("user_id", user_id).maybeSingle();
    if (!target || target.university_id !== universityId) return json({ error: "Forbidden" }, 403);

    const { data: targetRoles } = await admin.from("user_roles").select("role").eq("user_id", user_id);
    const isFinance = (targetRoles ?? []).some((r) => r.role === "finance_admin");
    if (!isFinance) return json({ error: "Not a finance admin" }, 400);

    await admin.from("user_roles").delete().eq("user_id", user_id);
    await admin.from("users_profile").delete().eq("user_id", user_id);
    await admin.auth.admin.deleteUser(user_id);

    return json({ ok: true });
  } catch (e) {
    return json({ error: (e as Error).message }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), {
    status, headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
