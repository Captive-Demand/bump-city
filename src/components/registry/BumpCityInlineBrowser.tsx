import { useState, useEffect, forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { storefrontApiRequest } from "@/lib/shopify";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Loader2, Plus, ShoppingBag, Check, Store, ChevronLeft, ChevronRight } from "lucide-react";
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
  featuredImage?: { url: string; altText?: string };
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  onlineStoreUrl?: string;
}

interface Props {
  eventId: string;
  userId: string;
  categories: string[];
  onAdded?: () => void;
}

const guessCategory = (productType: string, categories: string[]): string => {
  const t = (productType || "").toLowerCase();
  if (t.includes("nursery") || t.includes("crib") || t.includes("bedding")) return "Nursery";
  if (t.includes("cloth") || t.includes("apparel") || t.includes("onesie")) return "Clothing";
  if (t.includes("toy") || t.includes("play")) return "Toys";
  if (t.includes("feed") || t.includes("bottle") || t.includes("nursing")) return "Feeding";
  return categories.find((c) => c !== "All") || "Essentials";
};

export const BumpCityInlineBrowser = forwardRef<HTMLDivElement, Props>(
  ({ eventId, userId, categories, onAdded }, ref) => {
    const [products, setProducts] = useState<ShopifyProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [adding, setAdding] = useState<string | null>(null);
    const [added, setAdded] = useState<Set<string>>(new Set());
    const [overrides, setOverrides] = useState<Record<string, string>>({});
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 9;

    const cats = categories.filter((c) => c !== "All");

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
          const data = await storefrontApiRequest<{
            products: { edges: { node: ShopifyProduct }[] };
          }>(PRODUCTS_QUERY, { first: 60, query: searchTerm || null });
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
      setAdding(p.id);
      const price = parseFloat(p.priceRange.minVariantPrice.amount) || 0;
      const category = overrides[p.id] || guessCategory(p.productType, categories);
      const { error } = await supabase.from("registry_items").insert({
        event_id: eventId,
        user_id: userId,
        name: p.title,
        category,
        price,
        emoji: null,
        image_url: p.featuredImage?.url || null,
        external_url: p.onlineStoreUrl || null,
        source: "shopify",
      });
      setAdding(null);
      if (error) {
        toast.error("Failed to add to registry");
        return;
      }
      toast.success(`Added "${p.title}"`);
      setAdded((prev) => new Set(prev).add(p.id));
      onAdded?.();
    };

    return (
      <div ref={ref} className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search Bump City..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-full bg-background"
          />
        </div>
        <p className="text-[10px] text-muted-foreground">Showing top 24 — search to find more</p>

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
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {products.map((p) => {
              const isAdded = added.has(p.id);
              const isAdding = adding === p.id;
              const currentCat = overrides[p.id] || guessCategory(p.productType, categories);
              return (
                <Card key={p.id} className="border-none rounded-2xl overflow-hidden">
                  <div className="aspect-square bg-muted">
                    {p.featuredImage?.url ? (
                      <img
                        src={p.featuredImage.url}
                        alt={p.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-3 space-y-2">
                    <p className="font-semibold text-sm line-clamp-2 leading-tight">{p.title}</p>
                    <p className="text-xs text-primary font-bold">
                      ${parseFloat(p.priceRange.minVariantPrice.amount).toFixed(2)}
                    </p>
                    <Select
                      value={currentCat}
                      onValueChange={(v) => setOverrides((o) => ({ ...o, [p.id]: v }))}
                    >
                      <SelectTrigger className="h-8 text-xs rounded-lg">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {cats.map((c) => (
                          <SelectItem key={c} value={c} className="text-xs">
                            {c}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      size="sm"
                      className="w-full rounded-full text-xs h-8 gap-1"
                      variant={isAdded ? "outline" : "default"}
                      onClick={() => addToRegistry(p)}
                      disabled={isAdding || isAdded}
                    >
                      {isAdding ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isAdded ? (
                        <>
                          <Check className="h-3.5 w-3.5" /> Added
                        </>
                      ) : (
                        <>
                          <Plus className="h-3.5 w-3.5" /> Add
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    );
  }
);

BumpCityInlineBrowser.displayName = "BumpCityInlineBrowser";

export default BumpCityInlineBrowser;
