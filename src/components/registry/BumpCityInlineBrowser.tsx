import { useState, useEffect, forwardRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { storefrontApiRequest } from "@/lib/shopify";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel";
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
        availableForSale
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
  availableForSale?: boolean;
  
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
    const [expanded, setExpanded] = useState(false);
    const PAGE_SIZE = 9;
    const PREVIEW_SIZE = 3;

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
          const composedQuery = ["available_for_sale:true", searchTerm].filter(Boolean).join(" ");
          const data = await storefrontApiRequest<{
            products: { edges: { node: ShopifyProduct }[] };
          }>(PRODUCTS_QUERY, { first: 100, query: composedQuery });
          if (cancelled) return;
          const edges = data?.data?.products?.edges || [];
          const live = edges
            .map((e: any) => e.node as ShopifyProduct)
            .filter((p) => p.availableForSale !== false);
          setProducts(live);
          setPage(0);
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
        <p className="text-[10px] text-muted-foreground">
          {expanded ? "9 per page — search to filter" : "Tap Show more for the full list"}
        </p>

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

        {!loading && !error && products.length > 0 && (() => {
          const totalPages = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
          const safePage = Math.min(page, totalPages - 1);
          const visible = expanded
            ? products.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)
            : products.slice(0, PREVIEW_SIZE);

          const renderCard = (p: ShopifyProduct, layout: "grid" | "row" = "grid") => {
            const isAdded = added.has(p.id);
            const isAdding = adding === p.id;
            const currentCat = overrides[p.id] || guessCategory(p.productType, categories);
            if (layout === "row") {
              return (
                <Card key={p.id} className="border-none rounded-2xl overflow-hidden">
                  <div className="flex items-center gap-3 p-2">
                    <div className="h-20 w-20 shrink-0 rounded-xl bg-muted overflow-hidden">
                      {p.featuredImage?.url ? (
                        <img src={p.featuredImage.url} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="h-6 w-6 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      {p.onlineStoreUrl ? (
                        <a href={p.onlineStoreUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-sm line-clamp-2 leading-tight hover:text-primary hover:underline block">
                          {p.title}
                        </a>
                      ) : (
                        <p className="font-semibold text-sm line-clamp-2 leading-tight">{p.title}</p>
                      )}
                      <p className="text-xs text-primary font-bold">
                        ${parseFloat(p.priceRange.minVariantPrice.amount).toFixed(2)}
                      </p>
                      <Select value={currentCat} onValueChange={(v) => setOverrides((o) => ({ ...o, [p.id]: v }))}>
                        <SelectTrigger className="h-7 text-[11px] rounded-lg">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {cats.map((c) => (
                            <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      size="sm"
                      className="rounded-full text-xs h-8 gap-1 shrink-0"
                      variant={isAdded ? "outline" : "default"}
                      onClick={() => addToRegistry(p)}
                      disabled={isAdding || isAdded}
                    >
                      {isAdding ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : isAdded ? (
                        <><Check className="h-3.5 w-3.5" /> Added</>
                      ) : (
                        <><Plus className="h-3.5 w-3.5" /> Add</>
                      )}
                    </Button>
                  </div>
                </Card>
              );
            }
            return (
              <Card key={p.id} className="border-none rounded-2xl overflow-hidden h-full">
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
                  {p.onlineStoreUrl ? (
                    <a
                      href={p.onlineStoreUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold text-sm line-clamp-2 leading-tight hover:text-primary hover:underline block"
                    >
                      {p.title}
                    </a>
                  ) : (
                    <p className="font-semibold text-sm line-clamp-2 leading-tight">{p.title}</p>
                  )}
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
          };

          return (
            <>
              {expanded ? (
                <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3">
                  {visible.map((p) => renderCard(p, "row"))}
                </div>
              ) : (
                <div className="space-y-2">
                  {visible.map((p) => renderCard(p, "row"))}
                </div>
              )}
              {!expanded && products.length > PREVIEW_SIZE && (
                <div className="flex justify-center pt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full h-8 text-xs"
                    onClick={() => setExpanded(true)}
                  >
                    Show more ({products.length} items)
                  </Button>
                </div>
              )}
              {expanded && (
                <div className="flex items-center justify-between pt-2 gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-full h-8 gap-1 text-xs"
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                    disabled={safePage === 0}
                  >
                    <ChevronLeft className="h-3.5 w-3.5" /> Prev
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Page {safePage + 1} of {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="rounded-full h-8 gap-1 text-xs"
                      onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                      disabled={safePage >= totalPages - 1}
                    >
                      Next <ChevronRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}
              {expanded && (
                <div className="flex justify-center pt-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="rounded-full h-7 text-[11px] text-muted-foreground"
                    onClick={() => { setExpanded(false); setPage(0); }}
                  >
                    Show less
                  </Button>
                </div>
              )}
            </>
          );
        })()}
      </div>
    );
  }
);

BumpCityInlineBrowser.displayName = "BumpCityInlineBrowser";

export default BumpCityInlineBrowser;
