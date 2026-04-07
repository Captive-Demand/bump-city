import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Read Shopify credentials from app_settings
    const { data: settings, error: settingsError } = await supabase
      .from("app_settings")
      .select("key, value")
      .in("key", ["shopify_store_domain", "shopify_storefront_token"]);

    if (settingsError) throw new Error("Failed to read settings");

    const settingsMap: Record<string, string> = {};
    (settings || []).forEach((s: any) => { settingsMap[s.key] = s.value; });

    const domain = settingsMap["shopify_store_domain"];
    const token = settingsMap["shopify_storefront_token"];

    if (!domain || !token) {
      return new Response(
        JSON.stringify({ error: "Shopify is not connected. Please configure it in Admin Settings." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Expect a GraphQL query in the request body
    const body = await req.json();
    if (!body.query) {
      return new Response(
        JSON.stringify({ error: "Missing 'query' field in request body" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Forward to Shopify Storefront API
    const shopifyUrl = `https://${domain}/api/2024-01/graphql.json`;
    const shopifyRes = await fetch(shopifyUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query: body.query, variables: body.variables || {} }),
    });

    const shopifyData = await shopifyRes.json();

    return new Response(JSON.stringify(shopifyData), {
      status: shopifyRes.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message || "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
