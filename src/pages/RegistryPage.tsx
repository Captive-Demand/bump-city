import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

import { Check, ShoppingBag, Plus, Upload, Package, Trash2, Pencil, Globe, Sparkles, Store, ExternalLink, Heart, ChevronDown, ChevronLeft, Share2, Settings, Gift, Link2 } from "lucide-react";
import registryBagHero from "@/assets/registry-bag-hero.jpg";
import { useNavigate } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useActivityFeed } from "@/contexts/ActivityFeedContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvent";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link as LinkIcon } from "lucide-react";
import BumpCityInlineBrowser from "@/components/registry/BumpCityInlineBrowser";

const categories = ["All", "Essentials", "Nursery", "Clothing", "Toys", "Feeding", "Services"];
const sources = [
  { id: "all", label: "All", icon: Sparkles },
  { id: "shopify", label: "Bump City", icon: Store },
  { id: "local", label: "Local", icon: Heart },
  { id: "web", label: "Web", icon: Globe },
] as const;

const DEFAULT_BLURB = "Curated by Bump City. Built for real life. Add anything from anywhere.";

interface RegistryItem {
  id: string;
  name: string;
  category: string;
  price: number;
  claimed: boolean;
  claimed_by: string | null;
  emoji: string;
  image_url: string | null;
  external_url: string | null;
  source: string | null;
}

const matchSource = (item: RegistryItem, filter: string) => {
  if (filter === "all") return true;
  const s = (item.source || "manual").toLowerCase();
  if (filter === "shopify") return s === "shopify";
  if (filter === "local") return s === "local" || item.category === "Services";
  if (filter === "web") return s === "url-import" || s === "web" || s === "manual";
  return true;
};

const sourceBadge = (source: string | null) => {
  const s = (source || "manual").toLowerCase();
  if (s === "shopify") return { label: "BUMP CITY", className: "bg-primary/15 text-primary" };
  if (s === "local") return { label: "LOCAL", className: "bg-mint text-mint-foreground" };
  if (s === "url-import" || s === "web") return { label: "WEB", className: "bg-lavender text-lavender-foreground" };
  return { label: "MANUAL", className: "bg-muted text-muted-foreground" };
};

const RegistryPage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSource, setActiveSource] = useState<string>("all");
  const [showMine, setShowMine] = useState(false);
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [blurb, setBlurb] = useState<string>(DEFAULT_BLURB);
  const [expandedStep, setExpandedStep] = useState<"local" | "web" | null>(null);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const step2Ref = useRef<HTMLDivElement | null>(null);
  const step3Ref = useRef<HTMLDivElement | null>(null);
  const yourRegistryRef = useRef<HTMLDivElement | null>(null);
  const { addActivity } = useActivityFeed();
  const { user } = useAuth();
  const { event } = useEvent();
  const displayName = user?.user_metadata?.display_name || user?.email || "You";

  // Add item form
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Essentials");
  const [newPrice, setNewPrice] = useState("");
  const [newEmoji] = useState("🎁");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Edit item form
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<RegistryItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("Essentials");
  const [editPrice, setEditPrice] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editUploading, setEditUploading] = useState(false);

  // URL import
  const [urlOpen, setUrlOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<{ title?: string; image?: string; price?: number } | null>(null);

  const openEdit = (item: RegistryItem) => {
    setEditItem(item);
    setEditName(item.name);
    setEditCategory(item.category);
    setEditPrice(String(item.price || ""));
    setEditImageUrl(item.image_url || "");
    setEditImagePreview(item.image_url || null);
    setEditOpen(true);
  };

  const handleEditImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !event || !user) return;
    setEditUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/registry/${event.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("uploads").getPublicUrl(path);
      setEditImageUrl(publicUrl);
      setEditImagePreview(publicUrl);
      toast.success("Image uploaded!");
    } catch {
      toast.error("Failed to upload image");
    }
    setEditUploading(false);
  };

  const handleEdit = async () => {
    if (!editItem || !editName.trim()) return;
    const { error } = await supabase.from("registry_items").update({
      name: editName.trim(),
      category: editCategory,
      price: parseFloat(editPrice) || 0,
      emoji: editImageUrl.trim() ? null : "🎁",
      image_url: editImageUrl.trim() || null,
    }).eq("id", editItem.id);
    if (error) { toast.error("Failed to update item"); return; }
    toast.success("Item updated");
    addActivity("registry-added", `Updated "${editName.trim()}" in registry`);
    setEditOpen(false);
    setEditItem(null);
    fetchItems();
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !event || !user) return;
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/registry/${event.id}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("uploads").upload(path, file);
      if (error) throw error;
      const { data: { publicUrl } } = supabase.storage.from("uploads").getPublicUrl(path);
      setNewImageUrl(publicUrl);
      setImagePreview(publicUrl);
      toast.success("Image uploaded!");
    } catch {
      toast.error("Failed to upload image");
    }
    setUploading(false);
  };

  const fetchItems = async () => {
    if (!event) return;
    const { data } = await supabase
      .from("registry_items")
      .select("id, name, category, price, claimed, claimed_by, emoji, image_url, external_url, source")
      .eq("event_id", event.id)
      .order("created_at", { ascending: true });
    setItems((data as RegistryItem[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (event) fetchItems();
    else setLoading(false);
  }, [event]);

  // Load registry intro blurb
  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .eq("key", "registry_intro_blurb");
      const blurbValue = data?.[0]?.value;
      if (blurbValue) setBlurb(blurbValue);
    })();
  }, []);

  const filtered = items.filter((item) => {
    if (showMine && (!item.claimed || item.claimed_by !== displayName)) return false;
    if (activeCategory !== "All" && item.category !== activeCategory) return false;
    if (!matchSource(item, activeSource)) return false;
    return true;
  });
  const claimedCount = items.filter((i) => i.claimed).length;
  const pct = items.length ? Math.round((claimedCount / items.length) * 100) : 0;

  const handleClaim = async (id: string) => {
    const { error } = await supabase
      .from("registry_items")
      .update({ claimed: true, claimed_by: displayName })
      .eq("id", id);
    if (error) { toast.error("Failed to claim item"); return; }
    const item = items.find((i) => i.id === id);
    if (item) addActivity("gift-claimed", `You claimed "${item.name}"`);
    fetchItems();
  };

  const handleUnclaim = async (id: string) => {
    const { error } = await supabase
      .from("registry_items")
      .update({ claimed: false, claimed_by: null })
      .eq("id", id);
    if (error) { toast.error("Failed to unclaim item"); return; }
    const item = items.find((i) => i.id === id);
    if (item) addActivity("gift-claimed", `Unclaimed "${item.name}"`);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    const item = items.find((i) => i.id === id);
    const { error } = await supabase.from("registry_items").delete().eq("id", id);
    if (error) { toast.error("Failed to delete item"); return; }
    if (item) addActivity("registry-added", `Removed "${item.name}" from registry`);
    toast.success("Item removed");
    fetchItems();
  };

  const handleAdd = async () => {
    if (!event || !user || !newName.trim()) return;
    const { error } = await supabase.from("registry_items").insert({
      event_id: event.id,
      user_id: user.id,
      name: newName.trim(),
      category: newCategory,
      price: parseFloat(newPrice) || 0,
      emoji: newImageUrl.trim() ? null : (newEmoji || "🎁"),
      image_url: newImageUrl.trim() || null,
    });
    if (error) { toast.error("Failed to add item"); return; }
    addActivity("registry-added", `Added "${newName.trim()}" to registry`);
    setNewName(""); setNewPrice(""); setNewImageUrl(""); setImagePreview(null); setAddOpen(false);
    fetchItems();
  };

  const handleScrape = async () => {
    if (!importUrl.trim()) return;
    setScraping(true);
    setScrapedData(null);
    try {
      const { data, error } = await supabase.functions.invoke("scrape-url", { body: { url: importUrl.trim() } });
      if (error) throw error;
      setScrapedData(data);
      setNewName(data.title || "");
      setNewPrice(data.price ? String(data.price) : "");
      toast.success("Product info loaded!");
    } catch {
      toast.error("Could not scrape that URL. Try adding manually.");
    }
    setScraping(false);
  };

  const handleAddFromUrl = async () => {
    if (!event || !user || !newName.trim()) return;
    const { error } = await supabase.from("registry_items").insert({
      event_id: event.id,
      user_id: user.id,
      name: newName.trim(),
      category: newCategory,
      price: parseFloat(newPrice) || 0,
      emoji: null,
      external_url: importUrl.trim() || null,
      image_url: scrapedData?.image || null,
      source: "url-import",
    });
    if (error) { toast.error("Failed to add item"); return; }
    addActivity("registry-added", `Added "${newName.trim()}" from URL`);
    setNewName(""); setNewPrice(""); setImportUrl(""); setScrapedData(null); setUrlOpen(false);
    fetchItems();
  };

  if (loading) {
    return (
      <MobileLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </MobileLayout>
    );
  }

  const shopifyAddedCount = items.filter((i) => (i.source || "").toLowerCase() === "shopify").length;

  const expandStep = (step: "local" | "web") => {
    setExpandedStep(step);
    if (step === "local" && newCategory === "Essentials") setNewCategory("Services");
    requestAnimationFrame(() => {
      const target = step === "local" ? step2Ref.current : step3Ref.current;
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const scrollToRegistry = () => {
    yourRegistryRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <MobileLayout>
      {/* === HEADER === */}
      <div className="px-5 pt-6 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => navigate(-1)}
            className="h-9 w-9 flex items-center justify-center -ml-2 rounded-full hover:bg-muted/60 transition-colors"
            aria-label="Back"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold tracking-tight truncate">Registry Hub</h1>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              if (navigator.share) {
                navigator.share({ title: "Our Registry", url: window.location.href }).catch(() => {});
              } else {
                navigator.clipboard.writeText(window.location.href);
                toast.success("Link copied");
              }
            }}
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
            aria-label="Share"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate("/shower")}
            className="h-10 w-10 flex items-center justify-center rounded-full hover:bg-muted/60 transition-colors"
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="border-b border-border/60 mx-5" />

      {/* === HERO: Add from anywhere === */}
      <div className="px-5 pt-5">
        <Card className="border-none rounded-3xl shadow-sm overflow-hidden bg-card">
          <CardContent className="p-5">
            <div className="flex items-stretch gap-4">
              <div className="flex-1 min-w-0 flex flex-col justify-between py-1">
                <div>
                  <h2 className="text-xl font-bold leading-tight mb-2">Add from anywhere</h2>
                  <p className="text-sm text-primary/80 leading-snug">
                    Spot something you love? Paste a link to add items from any store.
                  </p>
                </div>
                <Dialog open={urlOpen} onOpenChange={setUrlOpen}>
                  <DialogTrigger asChild>
                    <Button
                      className="mt-4 self-start rounded-full bg-primary/15 hover:bg-primary/25 text-primary font-semibold gap-2 h-10 px-4 shadow-none border-none"
                    >
                      <Link2 className="h-4 w-4" />
                      Add from Link
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Add from URL</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <Label>Product URL</Label>
                        <div className="flex gap-2">
                          <Input placeholder="https://..." value={importUrl} onChange={(e) => setImportUrl(e.target.value)} />
                          <Button onClick={handleScrape} disabled={!importUrl.trim() || scraping} size="sm">{scraping ? "..." : "Fetch"}</Button>
                        </div>
                      </div>
                      {scrapedData && (
                        <>
                          {scrapedData.image && <img src={scrapedData.image} alt="" className="w-32 h-32 object-contain rounded-lg mx-auto bg-muted" />}
                          <div className="space-y-1.5">
                            <Label>Item name</Label>
                            <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                              <Label>Price ($)</Label>
                              <Input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
                            </div>
                            <div className="space-y-1.5">
                              <Label>Category</Label>
                              <Select value={newCategory} onValueChange={setNewCategory}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>{categories.filter((c) => c !== "All").map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                              </Select>
                            </div>
                          </div>
                          <Button className="w-full rounded-xl" onClick={handleAddFromUrl} disabled={!newName.trim()}>Add to Registry</Button>
                        </>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="w-32 h-32 sm:w-36 sm:h-36 shrink-0 rounded-2xl overflow-hidden">
                <img
                  src={registryBagHero}
                  alt="Shopping bag"
                  className="w-full h-full object-cover"
                  width={768}
                  height={768}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* === CATEGORY PILLS === */}
      <div className="px-5 pt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-5 py-2.5 rounded-full text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card text-foreground border border-border/60"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* === ITEM LIST === */}
      <div className="px-5 pt-4 pb-32 space-y-3">
        {items.length === 0 && (
          <Card className="border-none rounded-2xl mt-2">
            <CardContent className="p-8 text-center">
              <div className="bg-primary/10 h-16 w-16 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-base mb-1">Your registry is just getting started</h3>
              <p className="text-xs text-muted-foreground">
                Tap the gift button below to add your first item
              </p>
            </CardContent>
          </Card>
        )}

        {items.length > 0 && filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-8">No items match this filter.</p>
        )}

        {filtered.map((item) => {
          const claimedByMe = item.claimed && item.claimed_by === displayName;
          return (
            <div
              key={item.id}
              className="flex items-center gap-4 py-1"
            >
              <div className="w-20 h-20 shrink-0 rounded-2xl bg-card overflow-hidden flex items-center justify-center shadow-sm">
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                ) : (
                  <Package className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <button
                onClick={() => openEdit(item)}
                className="flex-1 min-w-0 text-left"
              >
                <p className={`font-bold text-base leading-tight truncate ${item.claimed ? "line-through text-muted-foreground" : ""}`}>
                  {item.name}
                </p>
                <p className="text-sm text-primary/80 mt-0.5">
                  {item.category} • ${item.price}
                </p>
              </button>
              <div className="shrink-0">
                {item.claimed ? (
                  <button
                    onClick={() => handleUnclaim(item.id)}
                    disabled={!claimedByMe && item.claimed_by !== displayName}
                    className="px-3.5 py-1.5 rounded-full bg-mint/40 text-mint-foreground text-[11px] font-bold tracking-wider uppercase"
                  >
                    Purchased
                  </button>
                ) : (
                  <button
                    onClick={() => handleClaim(item.id)}
                    className="px-3.5 py-1.5 rounded-full bg-primary/15 text-primary text-[11px] font-bold tracking-wider uppercase"
                  >
                    Needed
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* === FLOATING ACTION BUTTON === */}
      <button
        onClick={() => setAddMenuOpen(true)}
        className="fixed bottom-24 right-5 z-30 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
        aria-label="Add gift"
      >
        <Gift className="h-6 w-6" />
      </button>

      {/* === ADD MENU SHEET === */}
      <Sheet open={addMenuOpen} onOpenChange={setAddMenuOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl p-0 max-h-[90vh] overflow-y-auto">
          <SheetHeader className="px-6 pt-6 pb-2">
            <SheetTitle>Add to Registry</SheetTitle>
          </SheetHeader>
          <div className="px-6 pb-8 space-y-3 pt-4">
            {/* Bump City */}
            <Card className="border-2 border-primary/30 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/5 to-transparent">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm shrink-0">
                    <Store className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-base leading-tight">Bump City picks</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Tiffany's curated picks — added in one tap</p>
                    {shopifyAddedCount > 0 && (
                      <p className="text-[11px] font-semibold text-primary mt-1">✓ {shopifyAddedCount} added</p>
                    )}
                  </div>
                </div>
                {event && user && (
                  <BumpCityInlineBrowser
                    eventId={event.id}
                    userId={user.id}
                    categories={categories}
                    onAdded={fetchItems}
                  />
                )}
              </CardContent>
            </Card>

            {/* Local */}
            <Card className="border border-border rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedStep(expandedStep === "local" ? null : "local")}
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-mint text-mint-foreground flex items-center justify-center shrink-0">
                  <Heart className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base leading-tight">Local service or shop</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Doulas, night nurses, neighborhood boutiques</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform ${expandedStep === "local" ? "rotate-180" : ""}`} />
              </button>
              {expandedStep === "local" && (
                <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Item name</Label>
                    <Input placeholder="e.g. Postpartum doula package" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Category</Label>
                      <Select value={newCategory} onValueChange={setNewCategory}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {categories.filter((c) => c !== "All").map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Price ($)</Label>
                      <Input type="number" placeholder="0" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Image (optional)</Label>
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="w-24 h-24 object-contain rounded-lg mx-auto bg-muted" />
                    )}
                    <div className="flex gap-2">
                      <Input placeholder="https://..." value={newImageUrl} onChange={(e) => { setNewImageUrl(e.target.value); setImagePreview(e.target.value); }} className="flex-1" />
                      <label className="cursor-pointer inline-flex items-center justify-center rounded-md border border-input bg-background h-9 w-9 hover:bg-accent transition-colors">
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <Upload className="h-3.5 w-3.5" />
                      </label>
                    </div>
                  </div>
                  <Button className="w-full rounded-xl" onClick={async () => { await handleAdd(); setAddMenuOpen(false); }} disabled={!newName.trim() || uploading}>
                    Add to Registry
                  </Button>
                </div>
              )}
            </Card>

            {/* Web */}
            <Card className="border border-border rounded-2xl overflow-hidden">
              <button
                onClick={() => setExpandedStep(expandedStep === "web" ? null : "web")}
                className="w-full flex items-start gap-3 p-4 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="h-8 w-8 rounded-full bg-lavender text-lavender-foreground flex items-center justify-center shrink-0">
                  <Globe className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-base leading-tight">Paste any product link</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Amazon, Target, anywhere — we'll grab the photo and price</p>
                </div>
                <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 mt-1 transition-transform ${expandedStep === "web" ? "rotate-180" : ""}`} />
              </button>
              {expandedStep === "web" && (
                <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Product URL</Label>
                    <div className="flex gap-2">
                      <Input placeholder="https://..." value={importUrl} onChange={(e) => setImportUrl(e.target.value)} />
                      <Button onClick={handleScrape} disabled={!importUrl.trim() || scraping} size="sm">{scraping ? "..." : "Fetch"}</Button>
                    </div>
                  </div>
                  {scrapedData && (
                    <>
                      {scrapedData.image && <img src={scrapedData.image} alt="" className="w-24 h-24 object-contain rounded-lg mx-auto bg-muted" />}
                      <div className="space-y-1.5">
                        <Label className="text-xs">Item name</Label>
                        <Input value={newName} onChange={(e) => setNewName(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                          <Label className="text-xs">Price ($)</Label>
                          <Input type="number" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-xs">Category</Label>
                          <Select value={newCategory} onValueChange={setNewCategory}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>{categories.filter((c) => c !== "All").map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button className="w-full rounded-xl" onClick={async () => { await handleAddFromUrl(); setAddMenuOpen(false); }} disabled={!newName.trim()}>Add to Registry</Button>
                    </>
                  )}
                </div>
              )}
            </Card>
          </div>
        </SheetContent>
      </Sheet>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Registry Item</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Item name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => c !== "All").map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Image (optional)</Label>
              {editImagePreview && (
                <img src={editImagePreview} alt="Preview" className="w-32 h-32 object-contain rounded-lg mx-auto bg-muted" />
              )}
              <div className="flex gap-2">
                <Input placeholder="https://..." value={editImageUrl} onChange={(e) => { setEditImageUrl(e.target.value); setEditImagePreview(e.target.value); }} className="flex-1" />
                <label className="cursor-pointer inline-flex items-center justify-center rounded-md border border-input bg-background h-9 w-9 hover:bg-accent hover:text-accent-foreground transition-colors">
                  <input type="file" accept="image/*" className="hidden" onChange={handleEditImageUpload} />
                  <Upload className="h-3.5 w-3.5" />
                </label>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Price ($)</Label>
              <Input type="number" placeholder="0" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} />
            </div>
            <Button className="w-full rounded-xl" onClick={handleEdit} disabled={!editName.trim()}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default RegistryPage;
