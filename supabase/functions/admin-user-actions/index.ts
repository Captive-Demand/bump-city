import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user: caller } } = await anonClient.auth.getUser(authHeader.replace("Bearer ", ""));
    if (!caller) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    // Check admin role
    const { data: hasRole } = await supabase.rpc("has_role", { _user_id: caller.id, _role: "admin" });
    if (!hasRole) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });

    const { action, userId } = await req.json();

    if (action === "get_email") {
      const { data: { user }, error } = await supabase.auth.admin.getUserById(userId);
      if (error || !user) return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: corsHeaders });
      return new Response(JSON.stringify({ email: user.email }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (action === "reset_password") {
      const { data: { user }, error: userErr } = await supabase.auth.admin.getUserById(userId);
      if (userErr || !user?.email) return new Response(JSON.stringify({ error: "User not found" }), { status: 404, headers: corsHeaders });

      // Generate password reset link
      const { error } = await supabase.auth.admin.generateLink({ type: "recovery", email: user.email });
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });

      return new Response(JSON.stringify({ success: true, email: user.email }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: corsHeaders });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
