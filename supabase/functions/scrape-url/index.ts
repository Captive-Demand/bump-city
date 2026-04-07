const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    let { url } = await req.json();
    if (!url || typeof url !== "string") {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    url = url.trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
      if (!["http:", "https:"].includes(parsedUrl.protocol)) throw new Error();
    } catch {
      return new Response(JSON.stringify({ error: "Invalid URL" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
    });
    const html = await response.text();

    // Helper: extract OG meta
    const getMeta = (property: string, attr = "property"): string | null => {
      const patterns = [
        new RegExp(`<meta[^>]+${attr}=["']${property}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+${attr}=["']${property}["']`, "i"),
      ];
      for (const p of patterns) {
        const m = html.match(p);
        if (m) return m[1];
      }
      return null;
    };

    // --- Extract from JSON-LD (most reliable) ---
    let jsonLdTitle: string | null = null;
    let jsonLdImage: string | null = null;
    let jsonLdPrice: number | null = null;

    const jsonLdMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    for (const m of jsonLdMatches) {
      try {
        const data = JSON.parse(m[1]);
        const product = data["@type"] === "Product" ? data : data["@graph"]?.find?.((x: any) => x["@type"] === "Product");
        if (product) {
          jsonLdTitle = product.name || null;
          // Image can be string or array
          const img = product.image;
          jsonLdImage = Array.isArray(img) ? img[0] : (typeof img === "string" ? img : null);
          // Price from offers
          const offers = product.offers;
          const offer = Array.isArray(offers) ? offers[0] : offers;
          if (offer?.price) jsonLdPrice = parseFloat(offer.price);
          break;
        }
      } catch { /* ignore parse errors */ }
    }

    // --- Title ---
    const title = jsonLdTitle || getMeta("og:title") || html.match(/<title>([^<]+)<\/title>/i)?.[1]?.trim() || null;

    // --- Image ---
    let image = jsonLdImage || getMeta("og:image") || getMeta("twitter:image", "name") || null;
    if (!image) {
      // Amazon-specific patterns
      const amazonImg =
        html.match(/"hiRes"\s*:\s*"([^"]+)"/i) ||
        html.match(/"large"\s*:\s*"([^"]+)"/i) ||
        html.match(/data-old-hires=["']([^"']+)["']/i) ||
        html.match(/<img[^>]+id=["']landingImage["'][^>]+src=["']([^"']+)["']/i) ||
        html.match(/<img[^>]+id=["']imgBlkFront["'][^>]+src=["']([^"']+)["']/i);
      if (amazonImg) image = amazonImg[1];
    }
    if (!image) {
      // Generic: first reasonably-sized product image
      const genericImg =
        html.match(/<img[^>]+class=["'][^"']*product[^"']*["'][^>]+src=["']([^"']+)["']/i) ||
        html.match(/<img[^>]+src=["'](https:\/\/[^"']+\.(?:jpg|jpeg|png|webp)[^"']*)["']/i);
      if (genericImg) image = genericImg[1];
    }
    // Make relative URLs absolute
    if (image && !image.startsWith("http")) {
      image = new URL(image, url).toString();
    }

    // --- Price ---
    let price = jsonLdPrice;
    if (!price) {
      const priceMatch =
        html.match(/"price"\s*:\s*"?([\d.]+)/i) ||
        html.match(/"priceAmount"\s*:\s*"?([\d.]+)/i) ||
        html.match(/class="[^"]*a-price-whole[^"]*"[^>]*>([\d,]+)/i) ||
        html.match(/\$(\d+\.?\d{0,2})/);
      if (priceMatch) price = parseFloat(priceMatch[1].replace(",", ""));
    }

    const description = getMeta("og:description") || getMeta("description", "name") || null;

    console.log("Scraped:", { title: title?.slice(0, 60), image: image?.slice(0, 80), price });

    return new Response(
      JSON.stringify({ title, image, description, price, url }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Scrape error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to scrape URL" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
