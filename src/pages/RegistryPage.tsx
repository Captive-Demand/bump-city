import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Check, ShoppingBag, Plus } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { useActivityFeed } from "@/contexts/ActivityFeedContext";
import { useAuth } from "@/contexts/AuthContext";
import { useEvent } from "@/hooks/useEvent";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const categories = ["All", "Essentials", "Nursery", "Clothing", "Toys", "Feeding"];

interface RegistryItem {
  id: string;
  name: string;
  category: string;
  price: number;
  claimed: boolean;
  claimed_by: string | null;
  emoji: string;
  image_url: string | null;
}

const RegistryPage = () => {
  const [activeCategory, setActiveCategory] = useState("All");
  const [items, setItems] = useState<RegistryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const { addActivity } = useActivityFeed();
  const { user } = useAuth();
  const { event } = useEvent();

  // Add item form
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState("Essentials");
  const [newPrice, setNewPrice] = useState("");
  const [newEmoji, setNewEmoji] = useState("🎁");
  const [newImageUrl, setNewImageUrl] = useState("");

  // URL import
  const [urlOpen, setUrlOpen] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<{ title?: string; image?: string; price?: number } | null>(null);

  const fetchItems = async () => {
    if (!event) return;
    const { data } = await supabase
      .from("registry_items")
      .select("id, name, category, price, claimed, claimed_by, emoji, image_url")
      .eq("event_id", event.id)
      .order("created_at", { ascending: true });
    setItems((data as RegistryItem[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (event) fetchItems();
    else setLoading(false);
  }, [event]);

  const filtered = activeCategory === "All" ? items : items.filter((item) => item.category === activeCategory);
  const claimedCount = items.filter((i) => i.claimed).length;

  const handleClaim = async (id: string) => {
    const { error } = await supabase
      .from("registry_items")
      .update({ claimed: true, claimed_by: "You" })
      .eq("id", id);
    if (error) { toast.error("Failed to claim item"); return; }
    const item = items.find((i) => i.id === id);
    if (item) addActivity("gift-claimed", `You claimed "${item.name}"`);
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
    setNewName(""); setNewPrice(""); setNewEmoji("🎁"); setNewImageUrl(""); setAddOpen(false);
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
      emoji: "🔗",
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

  return (
    <MobileLayout>
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-bold">Gift Registry</h1>
          </div>
          <div className="flex gap-2">
            <Dialog open={urlOpen} onOpenChange={setUrlOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="rounded-full h-8 gap-1"><Link className="h-3.5 w-3.5" /> URL</Button>
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
                      {scrapedData.image && <img src={scrapedData.image} alt="" className="w-full h-32 object-cover rounded-lg" />}
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
                      <Button className="w-full" onClick={handleAddFromUrl} disabled={!newName.trim()}>Add to Registry</Button>
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
                  <Label>Image URL (optional)</Label>
                  <Input placeholder="https://example.com/image.jpg" value={newImageUrl} onChange={(e) => setNewImageUrl(e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Price ($)</Label>
                    <Input type="number" placeholder="0" value={newPrice} onChange={(e) => setNewPrice(e.target.value)} />
                  </div>
                  {!newImageUrl.trim() && (
                    <div className="space-y-1.5">
                      <Label>Emoji</Label>
                      <Input placeholder="🎁" value={newEmoji} onChange={(e) => setNewEmoji(e.target.value)} maxLength={4} />
                    </div>
                  )}
                </div>
                <Button className="w-full" onClick={handleAdd} disabled={!newName.trim()}>Add Item</Button>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">{claimedCount} of {items.length} items claimed</p>
        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-primary rounded-full transition-all" style={{ width: items.length ? `${(claimedCount / items.length) * 100}%` : "0%" }} />
        </div>
      </div>

      <div className="px-6 flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {filtered.length === 0 && (
          <p className="text-sm text-muted-foreground text-center col-span-full py-8">No items yet — tap "Add" to get started!</p>
        )}
        {filtered.map((item) => (
          <Card key={item.id} className={`border-none ${item.claimed ? "opacity-70" : ""}`}>
            <CardContent className="p-4 flex items-center gap-3">
              {item.image_url ? (
                <img src={item.image_url} alt={item.name} className="w-12 h-12 rounded-xl object-cover" />
              ) : (
                <div className="text-2xl bg-muted w-12 h-12 rounded-xl flex items-center justify-center">{item.emoji}</div>
              )}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${item.claimed ? "line-through" : ""}`}>{item.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">${item.price}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{item.category}</Badge>
                </div>
              </div>
              {item.claimed ? (
                <div className="flex items-center gap-1 text-primary">
                  <Check className="h-4 w-4" />
                  <span className="text-[10px] font-medium">{item.claimed_by}</span>
                </div>
              ) : (
                <Button size="sm" className="rounded-full text-xs h-8" onClick={() => handleClaim(item.id)}>Claim</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </MobileLayout>
  );
};

export default RegistryPage;
