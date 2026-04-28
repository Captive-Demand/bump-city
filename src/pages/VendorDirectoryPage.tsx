import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Search, ExternalLink, Phone, Copy, Tag, ChevronLeft, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

// Categories derived dynamically from data

interface Vendor {
  id: string;
  name: string;
  category: string;
  description: string | null;
  city: string;
  phone: string | null;
  website: string | null;
  discount_code: string | null;
}

const VendorDirectoryPage = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const navigate = useNavigate();

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("vendors").select("*").order("name");
      setVendors((data as Vendor[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const vendorCategories = ["All", ...Array.from(new Set(vendors.map((v) => v.category))).sort()];

  const filtered = vendors.filter((v) => {
    if (activeCategory !== "All" && v.category !== activeCategory) return false;
    return v.name.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <MobileLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div></MobileLayout>;

  return (
    <MobileLayout>
      <div className="px-6 pt-8 pb-4">
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-1 text-sm text-muted-foreground mb-4 hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Home
        </button>
        <div className="flex items-center gap-2 mb-1"><MapPin className="h-5 w-5 text-primary" /><h1 className="text-2xl font-bold">Local Vendors</h1></div>
        <p className="text-sm text-muted-foreground">Nashville's best baby shower vendors 🎵</p>
      </div>

      <div className="px-6 flex flex-wrap gap-2 pb-3">
        {vendorCategories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{cat}</button>
        ))}
      </div>

      <div className="px-6 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search vendors..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 rounded-full bg-muted border-none" />
        </div>
      </div>

      <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.length === 0 && <p className="text-sm text-muted-foreground text-center col-span-full py-8">No vendors found. Check back soon!</p>}
        {filtered.map((vendor) => (
          <Card key={vendor.id} className="border-none">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-bold text-sm">{vendor.name}</h3>
                  <Badge variant="secondary" className="text-[10px] mt-1">{vendor.category}</Badge>
                </div>
                <span className="text-xs text-muted-foreground">📍 {vendor.city}</span>
              </div>
              {vendor.description && <p className="text-xs text-muted-foreground mt-2">{vendor.description}</p>}
              {vendor.discount_code && (
                <button
                  onClick={() => { navigator.clipboard.writeText(vendor.discount_code!); toast.success(`Copied "${vendor.discount_code}"`); }}
                  className="mt-2 w-full flex items-center justify-between gap-2 rounded-lg border-2 border-dashed border-primary/40 bg-primary/5 px-3 py-2 hover:bg-primary/10 transition-colors"
                >
                  <span className="flex items-center gap-1.5 text-xs">
                    <Tag className="h-3 w-3 text-primary" />
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="font-mono font-bold text-primary">{vendor.discount_code}</span>
                  </span>
                  <Copy className="h-3 w-3 text-muted-foreground" />
                </button>
              )}
              <div className="flex gap-2 mt-3">
                {vendor.phone && <Button size="sm" variant="outline" className="rounded-full text-xs h-7 gap-1"><Phone className="h-3 w-3" /> Call</Button>}
                {vendor.website && <Button size="sm" variant="outline" className="rounded-full text-xs h-7 gap-1" onClick={() => window.open(vendor.website!, "_blank")}><ExternalLink className="h-3 w-3" /> Website</Button>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </MobileLayout>
  );
};

export default VendorDirectoryPage;
