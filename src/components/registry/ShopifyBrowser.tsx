import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Loader2, Plus, ExternalLink, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

const PRODUCTS_QUERY = `query Products($first: Int!, $query: String) {
  products(first: $first, query: $query) {
    edges {
      node {
        id
        handle
        title
        productType
        descriptionHtml
        featuredImage { url altText }
        images(first: 6) { edges { node { url altText } } }
        priceRange { minVariantPrice { amount currencyCode } }
        onlineStoreUrl
      }
    }
  }
}`;

interface ShopifyProduct {
  id: string;
  handle: string;
  title: string;
  productType: string;
  descriptionHtml?: string;
  featuredImage?: { url: string; altText?: string };
  images?: { edges: { node: { url: string; altText?: string } }[] };
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  onlineStoreUrl?: string;
}

interface Props {
  eventId: string;
  userId: string;
  onAdded?: () => void;
}

export const ShopifyBrowser = ({ eventId, userId, onAdded }: Props) => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState<ShopifyProduct | null>(null);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(() => setSearchTerm(search), 400);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error: fnErr } = await supabase.functions.invoke("shopify-proxy", {
          body: { query: PRODUCTS_QUERY, variables: { first: 24, query: searchTerm || null } },
        });
        if (fnErr) throw new Error(fnErr.message);
        if (data?.error) throw new Error(data.error);
        if (cancelled) return;
        const edges = data?.data?.products?.edges || [];
        setProducts(edges.map((e: any) => e.node));
      } catch (err: any) {
        if (!cancelled) setError(err.message || "Failed to load products");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchTerm]);

  const addToRegistry = async (p: ShopifyProduct) => {
    setAdding(true);
    const price = parseFloat(p.priceRange.minVariantPrice.amount) || 0;
    const { error } = await supabase.from("registry_items").insert({
      event_id: eventId,
      user_id: userId,
      name: p.title,
      category: p.productType || "Essentials",
      price,
      emoji: null,
      image_url: p.featuredImage?.url || null,
      external_url: p.onlineStoreUrl || null,
      source: "shopify",
    });
    setAdding(false);
    if (error) {
      toast.error("Failed to add to registry");
      return;
    }
    toast.success(`Added "${p.title}" to your registry!`);
    setSelected(null);
    onAdded?.();
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search Bump City Boutique..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 rounded-full bg-muted border-none"
        />
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      )}

      {error && !loading && (
        <Card className="border-none">
          <CardContent className="p-6 text-center space-y-2">
            <ShoppingBag className="h-8 w-8 text-muted-foreground mx-auto" />
            <p className="text-sm font-semibold">Couldn't load Bump City Store</p>
            <p className="text-xs text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No products found.</p>
      )}

      {!loading && !error && products.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {products.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelected(p)}
              className="text-left bg-card rounded-2xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="aspect-square bg-muted">
                {p.featuredImage?.url ? (
                  <img src={p.featuredImage.url} alt={p.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm line-clamp-2">{p.title}</p>
                <p className="text-xs text-primary font-bold mt-1">
                  ${parseFloat(p.priceRange.minVariantPrice.amount).toFixed(2)}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <DialogContent className="max-w-md">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="pr-6">{selected.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                {selected.featuredImage?.url && (
                  <img
                    src={selected.featuredImage.url}
                    alt={selected.title}
                    className="w-full aspect-square object-cover rounded-xl bg-muted"
                  />
                )}
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    {selected.productType || "Bump City"}
                  </Badge>
                  <p className="text-lg font-bold text-primary">
                    ${parseFloat(selected.priceRange.minVariantPrice.amount).toFixed(2)}
                  </p>
                </div>
                {selected.descriptionHtml && (
                  <div
                    className="text-sm text-muted-foreground prose prose-sm max-h-32 overflow-y-auto"
                    dangerouslySetInnerHTML={{ __html: selected.descriptionHtml }}
                  />
                )}
                <div className="flex gap-2">
                  <Button
                    className="flex-1 rounded-xl"
                    onClick={() => addToRegistry(selected)}
                    disabled={adding}
                  >
                    {adding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" /> Add to Registry
                      </>
                    )}
                  </Button>
                  {selected.onlineStoreUrl && (
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-xl"
                      onClick={() => window.open(selected.onlineStoreUrl, "_blank")}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopifyBrowser;
