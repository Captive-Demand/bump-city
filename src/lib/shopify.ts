// Native Lovable Shopify integration — direct Storefront API calls.
// Token is a public Storefront Access Token; safe for browser use.

export const SHOPIFY_API_VERSION = "2025-07";
export const SHOPIFY_STORE_PERMANENT_DOMAIN = "tiff-marie-maternity-store.myshopify.com";
export const SHOPIFY_STOREFRONT_TOKEN = "bd7a9168cd9687b9e56dceef5810289c";
export const SHOPIFY_STOREFRONT_URL = `https://${SHOPIFY_STORE_PERMANENT_DOMAIN}/api/${SHOPIFY_API_VERSION}/graphql.json`;

export async function storefrontApiRequest<T = any>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<{ data?: T; errors?: { message: string }[] }> {
  const res = await fetch(SHOPIFY_STOREFRONT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (res.status === 402) {
    throw new Error("Shopify billing required to access Storefront API.");
  }
  if (!res.ok) {
    throw new Error(`Shopify API error: ${res.status}`);
  }
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e: any) => e.message).join(", "));
  }
  return json;
}
