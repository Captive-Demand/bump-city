import { useState, useEffect, useMemo, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Check,
  ShoppingBag,
  Plus,
  Upload,
  Package,
  Trash2,
  Pencil,
  Globe,
  Store,
  ExternalLink,
  Heart,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  Search,
  Star,
  MoreVertical,
  X,
} from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { PageLoader } from "@/components/PageLoader";
import { useNavigate } from "react-router-dom";
import { useActivityFeed } from "@/contexts/ActivityFeedContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvent";
import { useEventRole } from "@/hooks/useEventRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import BumpCityInlineBrowser from "@/components/registry/BumpCityInlineBrowser";

const categories = ["All", "Essentials", "Nursery", "Clothing", "Toys", "Feeding", "Services"];

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
  priority: boolean;
}

const sourceBadge = (source: string | null) => {
  const s = (source || "manual").toLowerCase();
  if (s === "shopify") return { label: "BUMP CITY", className: "bg-primary text-primary-foreground" };
  if (s === "local") return { label: "LOCAL", className: "bg-mint text-mint-foreground" };
  if (s === "url-import" || s === "web") return { label: "WEB", className: "bg-lavender text-lavender-foreground" };
  return { label: "MANUAL", className: "bg-muted text-muted-foreground" };
};

type AddTab = "shop" | "local" | "manual" | "url";

const RegistryPage = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("All");
  const [showMine, setShowMine] = useState(false);
  const [search, setSearch] = useState("");
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [blurb, setBlurb] = useState<string>(DEFAULT_BLURB);
  const { addActivity } = useActivityFeed();
  const { user } = useAuth();
  const { event } = useEvent();
  const { isHost } = useEventRole();
  const displayName = user?.user_metadata?.display_name || user?.email || "You";

  // Add UI: hidden by default once the registry has items.
  const [addOpen, setAddOpen] = useState(true);
  const [addTab, setAddTab] = useState<AddTab>("shop");
  const addCardRef = useRef<HTMLDivElement | null>(null);

  // Local / Manual / URL inline form state
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Essentials");
  const [newPrice, setNewPrice] = useState("");
  const [newImageUrl, setNewImageUrl] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const [importUrl, setImportUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<{ title?: string; image?: string; price?: number } | null>(null);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editItem, setEditItem] = useState<RegistryItem | null>(null);
  const [editName, setEditName] = useState("");
  const [editCategory, setEditCategory] = useState("Essentials");
  const [editPrice, setEditPrice] = useState("");
  const [editImageUrl, setEditImageUrl] = useState("");
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);
  const [editUploading, setEditUploading] = useState(false);

  const resetAddForm = () => {
    setNewName("");
    setNewCategory(addTab === "local" ? "Services" : "Essentials");
    setNewPrice("");
    setNewImageUrl("");
    setImagePreview(null);
    setImportUrl("");
    setScrapedData(null);
  };

  const fetchItems = async () => {
    if (!event) return;
    // Note: `priority` was added in migration 20260428234214. Until that runs
    // the column may be missing on existing cloud DBs — we coalesce to false
    // and sort client-side so this still works.
    const { data } = await supabase
      .from("registry_items")
      .select("*")
      .eq("event_id", event.id)
      .order("created_at", { ascending: true });
    const rows = ((data as Partial<RegistryItem>[]) || []).map((r) => ({
      ...r,
      priority: !!r.priority,
    })) as RegistryItem[];
    rows.sort((a, b) => Number(b.priority) - Number(a.priority));
    setItems(rows);
    setLoading(false);
  };

  useEffect(() => {
    if (event) fetchItems();
    else setLoading(false);
  }, [event]);

  // Once items exist, default the add card to collapsed.
  useEffect(() => {
    if (items.length > 0) setAddOpen(false);
  }, [items.length === 0]);

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

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (showMine && (!item.claimed || item.claimed_by !== displayName)) return false;
      if (activeCategory !== "All" && item.category !== activeCategory) return false;
      if (q && !item.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, showMine, activeCategory, search, displayName]);

  const claimedCount = items.filter((i) => i.claimed).length;
  const totalPrice = items.reduce((sum, i) => sum + (i.price || 0), 0);
  const remainingPrice = items.filter((i) => !i.claimed).reduce((sum, i) => sum + (i.price || 0), 0);
  const pct = items.length ? Math.round((claimedCount / items.length) * 100) : 0;
  const filtersActive = !!(search || activeCategory !== "All" || showMine);

  const clearFilters = () => {
    setSearch("");
    setActiveCategory("All");
    setShowMine(false);
  };

  const handleClaim = async (id: string) => {
    const { error } = await supabase
      .from("registry_items")
      .update({ claimed: true, claimed_by: displayName })
      .eq("id", id);
    if (error) {
      toast.error("Failed to claim item");
      return;
    }
    const item = items.find((i) => i.id === id);
    if (item) addActivity("gift-claimed", `You claimed "${item.name}"`);
    fetchItems();
  };

  const handleUnclaim = async (id: string) => {
    const { error } = await supabase
      .from("registry_items")
      .update({ claimed: false, claimed_by: null })
      .eq("id", id);
    if (error) {
      toast.error("Failed to unclaim item");
      return;
    }
    const item = items.find((i) => i.id === id);
    if (item) addActivity("gift-claimed", `Unclaimed "${item.name}"`);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    const item = items.find((i) => i.id === id);
    const { error } = await supabase.from("registry_items").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete item");
      return;
    }
    if (item) addActivity("registry-added", `Removed "${item.name}" from registry`);
    toast.success("Item removed");
    fetchItems();
  };

  const handleTogglePriority = async (item: RegistryItem) => {
    const next = !item.priority;
    const { error } = await supabase
      .from("registry_items")
      .update({ priority: next })
      .eq("id", item.id);
    if (error) {
      // Most likely cause: priority column not yet applied to the cloud DB.
      const msg =
        error.message?.toLowerCase().includes("priority") || error.code === "42703"
          ? "Push to deploy the priority migration, then try again."
          : "Couldn't update priority";
      toast.error(msg);
      return;
    }
    setItems((prev) =>
      prev
        .map((i) => (i.id === item.id ? { ...i, priority: next } : i))
        .sort((a, b) => Number(b.priority) - Number(a.priority))
    );
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

  const handleAddManual = async (source: "manual" | "local" = "manual") => {
    if (!event || !user || !newName.trim()) return;
    const { error } = await supabase.from("registry_items").insert({
      event_id: event.id,
      user_id: user.id,
      name: newName.trim(),
      category: newCategory,
      price: parseFloat(newPrice) || 0,
      emoji: newImageUrl.trim() ? null : "🎁",
      image_url: newImageUrl.trim() || null,
      source,
    });
    if (error) {
      toast.error("Failed to add item");
      return;
    }
    addActivity("registry-added", `Added "${newName.trim()}" to registry`);
    toast.success("Added to registry");
    resetAddForm();
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
    if (error) {
      toast.error("Failed to add item");
      return;
    }
    addActivity("registry-added", `Added "${newName.trim()}" from URL`);
    toast.success("Added to registry");
    resetAddForm();
    fetchItems();
  };

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
    if (error) {
      toast.error("Failed to update item");
      return;
    }
    toast.success("Item updated");
    addActivity("registry-added", `Updated "${editName.trim()}" in registry`);
    setEditOpen(false);
    setEditItem(null);
    fetchItems();
  };

  const openAdd = () => {
    setAddOpen(true);
    requestAnimationFrame(() => addCardRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  if (loading) {
    return (
      <MobileLayout>
        <PageLoader />
      </MobileLayout>
    );
  }

  return (
    <MobileLayout>
      {/* Header */}
      <div className="px-6 pt-10 pb-2">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Home
        </button>
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Gift Registry</h1>
        </div>
        <p className="text-xs text-muted-foreground italic">
          {isHost ? blurb : "Tap any gift below to claim it for the parents-to-be."}
        </p>
      </div>

      {/* Progress card — top of page */}
      {items.length > 0 && (
        <div className="px-6 pt-4">
          <Card className="border-none">
            <CardContent className="p-4 space-y-2.5">
              <div className="flex items-baseline justify-between">
                <p className="text-sm font-bold">
                  {claimedCount} of {items.length} claimed
                </p>
                <p className="text-xs text-muted-foreground">
                  ${totalPrice.toFixed(0)} total · ${remainingPrice.toFixed(0)} remaining
                </p>
              </div>
              <div className="h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: `linear-gradient(90deg, hsl(var(--primary)), hsl(var(--mint)))`,
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add to Registry — host only, single card with 4 tabs */}
      {isHost && (
        <div ref={addCardRef} className="px-6 pt-4">
          <Card className="border border-border rounded-2xl overflow-hidden">
            <button
              onClick={() => setAddOpen((v) => !v)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left hover:bg-muted/30 transition-colors"
              aria-expanded={addOpen}
            >
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                <Plus className="h-4 w-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="font-bold text-base leading-tight">Add to your registry</h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Bump City picks, local services, paste a link, or add manually
                </p>
              </div>
              {addOpen ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
              )}
            </button>

            {addOpen && (
              <div className="border-t border-border/50">
                <Tabs value={addTab} onValueChange={(v) => setAddTab(v as AddTab)} className="w-full">
                  <TabsList className="w-full grid grid-cols-4 rounded-none bg-muted/30 h-auto p-1">
                    <TabsTrigger value="shop" className="text-xs gap-1.5 data-[state=active]:bg-background">
                      <Store className="h-3.5 w-3.5" /> Bump City
                    </TabsTrigger>
                    <TabsTrigger value="url" className="text-xs gap-1.5 data-[state=active]:bg-background">
                      <Globe className="h-3.5 w-3.5" /> Link
                    </TabsTrigger>
                    <TabsTrigger value="local" className="text-xs gap-1.5 data-[state=active]:bg-background">
                      <Heart className="h-3.5 w-3.5" /> Local
                    </TabsTrigger>
                    <TabsTrigger value="manual" className="text-xs gap-1.5 data-[state=active]:bg-background">
                      <Pencil className="h-3.5 w-3.5" /> Manual
                    </TabsTrigger>
                  </TabsList>

                  {/* Bump City */}
                  <TabsContent value="shop" className="p-4 m-0">
                    {event && user && (
                      <BumpCityInlineBrowser
                        eventId={event.id}
                        userId={user.id}
                        categories={categories}
                        onAdded={fetchItems}
                      />
                    )}
                  </TabsContent>

                  {/* Paste a link */}
                  <TabsContent value="url" className="p-4 m-0 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Amazon, Target, anywhere — we'll grab the photo and price.
                    </p>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Product URL</Label>
                      <div className="flex gap-2">
                        <Input
                          placeholder="https://..."
                          value={importUrl}
                          onChange={(e) => setImportUrl(e.target.value)}
                        />
                        <Button onClick={handleScrape} disabled={!importUrl.trim() || scraping} size="sm">
                          {scraping ? "..." : "Fetch"}
                        </Button>
                      </div>
                    </div>
                    {scrapedData && (
                      <>
                        {scrapedData.image && (
                          <img
                            src={scrapedData.image}
                            alt=""
                            className="w-24 h-24 object-contain rounded-lg mx-auto bg-muted"
                          />
                        )}
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
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {categories
                                  .filter((c) => c !== "All")
                                  .map((c) => (
                                    <SelectItem key={c} value={c}>
                                      {c}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <Button
                          className="w-full rounded-xl"
                          onClick={handleAddFromUrl}
                          disabled={!newName.trim()}
                        >
                          Add to registry
                        </Button>
                      </>
                    )}
                  </TabsContent>

                  {/* Local */}
                  <TabsContent value="local" className="p-4 m-0 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Doulas, night nurses, neighborhood boutiques.
                    </p>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Item name</Label>
                      <Input
                        placeholder="e.g. Postpartum doula package"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Category</Label>
                        <Select value={newCategory} onValueChange={setNewCategory}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories
                              .filter((c) => c !== "All")
                              .map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
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
                        <Input
                          placeholder="https://..."
                          value={newImageUrl}
                          onChange={(e) => {
                            setNewImageUrl(e.target.value);
                            setImagePreview(e.target.value);
                          }}
                          className="flex-1"
                        />
                        <label className="cursor-pointer inline-flex items-center justify-center rounded-md border border-input bg-background h-9 w-9 hover:bg-accent transition-colors">
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                          <Upload className="h-3.5 w-3.5" />
                        </label>
                      </div>
                    </div>
                    <Button
                      className="w-full rounded-xl"
                      onClick={() => handleAddManual("local")}
                      disabled={!newName.trim() || uploading}
                    >
                      Add to registry
                    </Button>
                  </TabsContent>

                  {/* Manual */}
                  <TabsContent value="manual" className="p-4 m-0 space-y-3">
                    <p className="text-xs text-muted-foreground">
                      Type in any item — perfect for handmade gifts or things without a link.
                    </p>
                    <div className="space-y-1.5">
                      <Label className="text-xs">Item name</Label>
                      <Input
                        placeholder="e.g. Baby Stroller"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Category</Label>
                        <Select value={newCategory} onValueChange={setNewCategory}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories
                              .filter((c) => c !== "All")
                              .map((c) => (
                                <SelectItem key={c} value={c}>
                                  {c}
                                </SelectItem>
                              ))}
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
                        <Input
                          placeholder="https://..."
                          value={newImageUrl}
                          onChange={(e) => {
                            setNewImageUrl(e.target.value);
                            setImagePreview(e.target.value);
                          }}
                          className="flex-1"
                        />
                        <label className="cursor-pointer inline-flex items-center justify-center rounded-md border border-input bg-background h-9 w-9 hover:bg-accent transition-colors">
                          <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                          <Upload className="h-3.5 w-3.5" />
                        </label>
                      </div>
                    </div>
                    <Button
                      className="w-full rounded-xl"
                      onClick={() => handleAddManual("manual")}
                      disabled={!newName.trim() || uploading}
                    >
                      Add to registry
                    </Button>
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Search + filters */}
      {items.length > 0 && (
        <>
          <div className="px-6 pt-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search registry…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-9 h-10 rounded-full"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          <div className="px-6 pt-3 pb-1 flex items-center gap-2 overflow-x-auto">
            <div className="flex flex-wrap gap-1.5 flex-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all ${
                    activeCategory === cat
                      ? "bg-foreground text-background"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowMine(!showMine)}
              className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 shrink-0 ${
                showMine ? "bg-primary text-primary-foreground" : "bg-muted/60 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Heart className="h-3 w-3" /> Mine
            </button>
          </div>
        </>
      )}

      {/* Empty state — no items at all */}
      {items.length === 0 && (
        <div className="px-6 py-6">
          <Card className="border-none">
            <CardContent className="p-8 text-center">
              <div className="bg-primary/10 h-16 w-16 rounded-2xl mx-auto mb-3 flex items-center justify-center">
                <ShoppingBag className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold text-base mb-1">Your registry is just getting started</h3>
              <p className="text-xs text-muted-foreground">
                {isHost
                  ? "Pick a Bump City favorite, paste a link, or add anything you love."
                  : "Check back soon — gifts are on the way."}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty filter state */}
      {items.length > 0 && filteredItems.length === 0 && (
        <div className="px-6 pt-6 pb-6">
          <Card className="border-none">
            <CardContent className="p-6 text-center space-y-3">
              <p className="text-sm text-muted-foreground">No items match these filters.</p>
              {filtersActive && (
                <Button size="sm" variant="outline" className="rounded-full gap-1" onClick={clearFilters}>
                  <X className="h-3.5 w-3.5" /> Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Item list */}
      {filteredItems.length > 0 && (
        <div className="px-6 pt-3 pb-6 space-y-3 md:space-y-0 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3">
          {filteredItems.map((item) => {
            const badge = sourceBadge(item.source);
            const claimedByMe = item.claimed && item.claimed_by === displayName;
            return (
              <Card
                key={item.id}
                className={`border-none rounded-2xl overflow-hidden hover:shadow-md transition-all md:h-full md:flex md:flex-col ${
                  item.claimed ? "opacity-90" : ""
                } ${item.priority ? "ring-2 ring-primary/40" : ""}`}
              >
                {/* Mobile: horizontal row layout */}
                <div className="flex items-center gap-3 p-2.5 md:hidden">
                  <div className="relative h-20 w-20 shrink-0 rounded-xl bg-white overflow-hidden">
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="w-full h-full object-contain p-1" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Package className="h-6 w-6 text-muted-foreground" />
                      </div>
                    )}
                    {item.external_url && (
                      <a
                        href={item.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute top-0.5 left-0.5 bg-background/80 backdrop-blur rounded-full p-0.5 hover:bg-background transition-colors"
                        aria-label="Open product link"
                      >
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-1.5">
                      {item.priority && (
                        <Star className="h-3.5 w-3.5 text-primary fill-primary shrink-0 mt-0.5" />
                      )}
                      <p
                        className={`font-bold text-sm leading-tight line-clamp-2 ${
                          item.claimed ? "line-through text-muted-foreground" : ""
                        }`}
                      >
                        {item.name}
                      </p>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <span>{item.category}</span>
                      {item.price > 0 && (
                        <>
                          <span className="mx-1">·</span>
                          <span className="font-semibold">${item.price}</span>
                        </>
                      )}
                    </p>
                    {item.claimed && item.claimed_by && (
                      <div className="flex items-center gap-1 mt-1">
                        <div className="h-3.5 w-3.5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[8px] font-bold shrink-0">
                          {item.claimed_by.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-[10px] truncate text-muted-foreground">
                          <span className="font-semibold">{claimedByMe ? "you" : item.claimed_by}</span>
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {item.claimed ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-full text-xs h-9 px-4 gap-1"
                        onClick={() => handleUnclaim(item.id)}
                        disabled={!claimedByMe && item.claimed_by !== displayName}
                      >
                        <Check className="h-3.5 w-3.5" /> Claimed
                      </Button>
                    ) : (
                      <Button size="sm" className="rounded-full text-xs h-9 px-4" onClick={() => handleClaim(item.id)}>
                        Claim
                      </Button>
                    )}
                    {isHost && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="sm" variant="ghost" className="h-7 w-7 p-0" aria-label="More actions">
                            <MoreVertical className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleTogglePriority(item)}>
                            <Star className={`h-4 w-4 mr-2 ${item.priority ? "fill-primary text-primary" : ""}`} />
                            {item.priority ? "Unmark must-have" : "Mark as must-have"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openEdit(item)}>
                            <Pencil className="h-4 w-4 mr-2" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(item.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" /> Remove
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {/* Desktop / tablet: grid card */}
                <div className="hidden md:flex md:flex-col md:flex-1">
                  {/* Hard square via padding-bottom: 100%. Tailwind's
                      aspect-square uses aspect-ratio CSS which flex layouts
                      can override; padding-percentage is computed off width
                      and is enforced strictly, so the box stays square no
                      matter what content sits below it. */}
                  <div className="relative w-full bg-white flex-none" style={{ paddingBottom: "100%" }}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} className="absolute inset-0 w-full h-full object-contain p-2" />
                    ) : (
                      <div className="absolute inset-0 w-full h-full flex items-center justify-center bg-muted">
                        <Package className="h-8 w-8 text-muted-foreground" />
                      </div>
                    )}
                    <Badge
                      className={`absolute top-1.5 right-1.5 text-[8px] font-bold tracking-wide border-none px-1.5 py-0.5 ${badge.className}`}
                    >
                      {badge.label}
                    </Badge>
                    {item.priority && (
                      <div className="absolute top-1.5 left-1.5 bg-primary text-primary-foreground rounded-full p-1 shadow-sm">
                        <Star className="h-3 w-3 fill-current" />
                      </div>
                    )}
                    {item.external_url && (
                      <a
                        href={item.external_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`absolute ${
                          item.priority ? "top-9 left-1.5" : "top-1.5 left-1.5"
                        } bg-background/80 backdrop-blur rounded-full p-1 hover:bg-background transition-colors`}
                        aria-label="Open product link"
                      >
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <CardContent className="p-2 gap-1.5 flex-1 flex flex-col">
                    <div>
                      <p className={`font-semibold text-xs leading-tight line-clamp-2 ${item.claimed ? "line-through text-muted-foreground" : ""}`}>
                        {item.name}
                      </p>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[11px] font-semibold text-foreground">${item.price}</span>
                        <span className="text-[9px] text-muted-foreground">{item.category}</span>
                      </div>
                    </div>

                    {item.claimed && item.claimed_by && (
                      <div className="flex items-center gap-1 bg-mint/30 rounded-md px-1.5 py-0.5">
                        <div className="h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[8px] font-bold shrink-0">
                          {item.claimed_by.charAt(0).toUpperCase()}
                        </div>
                        <p className="text-[9px] truncate">
                          <span className="font-semibold">{claimedByMe ? "you" : item.claimed_by}</span>
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-0.5 mt-auto">
                      {item.claimed ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-full text-[10px] h-7 gap-1 flex-1 px-2"
                          onClick={() => handleUnclaim(item.id)}
                          disabled={!claimedByMe && item.claimed_by !== displayName}
                        >
                          <Check className="h-3 w-3" /> Claimed
                        </Button>
                      ) : (
                        <Button size="sm" className="rounded-full text-[10px] h-7 flex-1 px-2" onClick={() => handleClaim(item.id)}>
                          Claim
                        </Button>
                      )}
                      {isHost && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0" aria-label="More actions">
                              <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleTogglePriority(item)}>
                              <Star className={`h-4 w-4 mr-2 ${item.priority ? "fill-primary text-primary" : ""}`} />
                              {item.priority ? "Unmark must-have" : "Mark as must-have"}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(item)}>
                              <Pencil className="h-4 w-4 mr-2" /> Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(item.id)}
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" /> Remove
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </CardContent>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Floating "Add another" trigger when host has items but card is collapsed */}
      {isHost && items.length > 0 && !addOpen && (
        <div className="px-6 pb-6">
          <Button variant="outline" className="w-full rounded-xl gap-2" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add another item
          </Button>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Registry Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Item name</Label>
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Category</Label>
              <Select value={editCategory} onValueChange={setEditCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.filter((c) => c !== "All").map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Image (optional)</Label>
              {editImagePreview && (
                <img src={editImagePreview} alt="Preview" className="w-32 h-32 object-contain rounded-lg mx-auto bg-muted" />
              )}
              <div className="flex gap-2">
                <Input
                  placeholder="https://..."
                  value={editImageUrl}
                  onChange={(e) => {
                    setEditImageUrl(e.target.value);
                    setEditImagePreview(e.target.value);
                  }}
                  className="flex-1"
                />
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
            <Button className="w-full rounded-xl" onClick={handleEdit} disabled={!editName.trim() || editUploading}>
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </MobileLayout>
  );
};

export default RegistryPage;
