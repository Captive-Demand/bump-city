import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Check, ShoppingBag, Plus, Upload, Package, Trash2, Pencil, Globe, Sparkles, Store, ExternalLink, Heart } from "lucide-react";
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
import ShopifyBrowser from "@/components/registry/ShopifyBrowser";

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
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSource, setActiveSource] = useState<string>("all");
  const [showMine, setShowMine] = useState(false);
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [blurb, setBlurb] = useState<string>(DEFAULT_BLURB);
  const [shopifyOpen, setShopifyOpen] = useState(false);
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

  const hero = [
    { icon: Store, title: "Bump City Boutique", desc: "Curated from our local store", className: "bg-primary/10 text-primary" },
    { icon: Heart, title: "Local Services", desc: "Night nurses, doulas, massage", className: "bg-mint text-mint-foreground" },
    { icon: Globe, title: "Anywhere on the Web", desc: "Paste any product URL", className: "bg-lavender text-lavender-foreground" },
  ];

  const handleShopifyClick = () => {
    setShopifyOpen(true);
  };

  return (
    <MobileLayout>
      <div className="px-6 pt-12 pb-2">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Gift Registry</h1>
          </div>
          <div className="flex gap-2">
            <Dialog open={urlOpen} onOpenChange={setUrlOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="rounded-full h-8 gap-1"><LinkIcon className="h-3.5 w-3.5" /> URL</Button>
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
            <Dialog open={addOpen} onOpenChange={setAddOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="rounded-full h-8 gap-1"><Plus className="h-3.5 w-3.5" /> Add</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader><DialogTitle>Add Registry Item</DialogTitle></DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label>Item name</Label>
                    <Input placeholder="e.g. Baby Stroller" value={newName} onChange={(e) => setNewName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Category</Label>
                    <Select value={newCategory} onValueChange={setNewCategory}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.filter((c) => c !== "All").map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Image (optional)</Label>
                    {imagePreview && (
                      <img src={imagePreview} alt="Preview" className="w-32 h-32 object-contain rounded-lg mx-auto bg-muted" />
                    )}
                    <div className="flex gap-2">
                      <Input placeholder="https://..." value={newImageUrl} onChange={(e) => { setNewImageUrl(e.target.value); setImagePreview(e.target.value); }} className="flex-1" />
                      <label className="cursor-pointer inline-flex items-center justify-center rounded-md border border-input bg-background h-9 w-9 hover:bg-accent hover:text-accent-foreground transition-colors">
                        <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                        <Upload className="h-3.5 w-3.5" />
                      </label>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Price ($)</Label>
                    <Input type="number" placeholder="0" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
                  </div>
                  <Button className="w-full rounded-xl" onClick={handleAdd} disabled={!newName.trim()}>Add Item</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <p className="text-xs text-muted-foreground italic">{blurb}</p>
      </div>

      {/* Hero pills */}
      <div className="px-6 pt-4 pb-2 grid grid-cols-3 gap-2">
        {hero.map((h) => (
          <button
            key={h.title}
            className="text-left bg-card rounded-2xl p-3 hover:shadow-md transition-all border border-border/40"
            onClick={() => {
              if (h.title === "Bump City Boutique") handleShopifyClick();
              else if (h.title === "Anywhere on the Web") setUrlOpen(true);
              else setAddOpen(true);
            }}
          >
            <div className={`h-8 w-8 rounded-xl ${h.className} flex items-center justify-center mb-1.5`}>
              <h.icon className="h-4 w-4" />
            </div>
            <p className="font-semibold text-[11px] leading-tight">{h.title}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight hidden md:block">{h.desc}</p>
          </button>
        ))}
      </div>

      {/* Browse Bump City CTA bar (full button) */}
      <div className="px-6 pt-3">
        <Button
          className="w-full rounded-xl h-11 font-semibold gap-2"
          onClick={handleShopifyClick}
        >
          <Store className="h-4 w-4" /> Browse Bump City Store
        </Button>
      </div>

      {/* Progress bar */}
      <div className="px-6 pt-5">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Registry Progress</p>
          <p className="text-xs font-semibold text-primary">{claimedCount} of {items.length} claimed</p>
        </div>
        <div className="h-3 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--mint)))` }}
          />
        </div>
      </div>

      {/* Source filter */}
      <div className="px-6 pt-5 flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {sources.map((s) => (
          <button
            key={s.id}
            onClick={() => setActiveSource(s.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${activeSource === s.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
          >
            <s.icon className="h-3 w-3" />
            {s.label}
          </button>
        ))}
        <button
          onClick={() => setShowMine(!showMine)}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ml-auto ${showMine ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}
        >
          <Heart className="h-3 w-3" />
          I'm Bringing
        </button>
      </div>

      {/* Category filter */}
      <div className="px-6 pt-2 flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-all ${activeCategory === cat ? "bg-foreground text-background" : "bg-transparent text-muted-foreground hover:text-foreground"}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {items.length === 0 && (
        <div className="px-6 pb-6">
          <Card className="border-none">
            <CardContent className="p-8 text-center">
              <div className="bg-primary/10 h-16 w-16 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-base mb-1">Your registry is just getting started</h3>
              <p className="text-xs text-muted-foreground mb-4">
                Add items from Bump City Boutique, paste a URL from anywhere, or include a local service.
              </p>
              <div className="flex flex-col gap-2 max-w-xs mx-auto">
                <Button className="rounded-xl h-11 font-semibold gap-2" onClick={handleShopifyClick}>
                  <Store className="h-4 w-4" /> Browse Bump City Store
                </Button>
                <Button variant="outline" className="rounded-xl h-11 font-semibold gap-2" onClick={() => setUrlOpen(true)}>
                  <Globe className="h-4 w-4" /> Add from URL
                </Button>
                <Button variant="outline" className="rounded-xl h-11 font-semibold gap-2" onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4" /> Add Local Service
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Item grid */}
      {items.length > 0 && (
        <div className="px-6 pb-6 grid grid-cols-2 gap-3">
          {filtered.length === 0 && (
            <p className="text-sm text-muted-foreground text-center col-span-full py-8">No items match this filter.</p>
          )}
          {filtered.map((item) => {
            const badge = sourceBadge(item.source);
            const claimedByMe = item.claimed && item.claimed_by === displayName;
            return (
              <Card key={item.id} className={`border-none rounded-2xl overflow-hidden hover:-translate-y-0.5 hover:shadow-md transition-all ${item.claimed ? "opacity-90" : ""}`}>
                <div className="relative aspect-square bg-muted">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-10 w-10 text-muted-foreground" />
                    </div>
                  )}
                  <Badge className={`absolute top-2 right-2 text-[9px] font-bold tracking-wide border-none ${badge.className}`}>
                    {badge.label}
                  </Badge>
                  {item.external_url && (
                    <a
                      href={item.external_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="absolute top-2 left-2 bg-background/80 backdrop-blur rounded-full p-1.5 hover:bg-background transition-colors"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
                <CardContent className="p-3 space-y-2">
                  <div>
                    <p className={`font-semibold text-sm leading-tight line-clamp-2 ${item.claimed ? "line-through text-muted-foreground" : ""}`}>{item.name}</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-muted-foreground">${item.price}</span>
                      <Badge variant="secondary" className="text-[9px] leading-none px-1.5 py-0.5">{item.category}</Badge>
                    </div>
                  </div>

                  {item.claimed && item.claimed_by && (
                    <div className="flex items-center gap-1.5 bg-mint/30 rounded-lg px-2 py-1">
                      <div className="h-5 w-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[9px] font-bold shrink-0">
                        {item.claimed_by.charAt(0).toUpperCase()}
                      </div>
                      <p className="text-[10px] truncate">
                        Claimed by <span className="font-semibold">{claimedByMe ? "you" : item.claimed_by}</span>
                      </p>
                    </div>
                  )}

                  <div className="flex items-center gap-1">
                    {item.claimed ? (
                      <Button size="sm" variant="outline" className="rounded-full text-xs h-8 gap-1 flex-1" onClick={() => handleUnclaim(item.id)} disabled={!claimedByMe && item.claimed_by !== displayName}>
                        <Check className="h-3.5 w-3.5" /> Claimed
                      </Button>
                    ) : (
                      <Button size="sm" className="rounded-full text-xs h-8 flex-1" onClick={() => handleClaim(item.id)}>Claim</Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-primary" onClick={() => openEdit(item)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Shopify Browser Sheet */}
      <Sheet open={shopifyOpen} onOpenChange={setShopifyOpen}>
        <SheetContent side="bottom" className="h-[92vh] overflow-y-auto rounded-t-3xl">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" /> Bump City Boutique
            </SheetTitle>
          </SheetHeader>
          <div className="mt-4 pb-8">
            {event && user && (
              <ShopifyBrowser eventId={event.id} userId={user.id} onAdded={fetchItems} />
            )}
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
