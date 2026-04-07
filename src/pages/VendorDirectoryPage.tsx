import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Search, ExternalLink, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

// Categories are derived dynamically from vendor data

interface Vendor {
  id: string;
  name: string;
  category: string;
  description: string | null;
  city: string;
  phone: string | null;
  website: string | null;
}

const VendorDirectoryPage = () => {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.from("vendors").select("*").order("name");
      setVendors((data as Vendor[]) || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = vendors.filter((v) => {
    if (activeCategory !== "All" && v.category !== activeCategory) return false;
    return v.name.toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <MobileLayout><div className="flex items-center justify-center min-h-[60vh]"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div></MobileLayout>;

  return (
    <MobileLayout>
      <div className="px-6 pt-12 pb-4">
        <div className="flex items-center gap-2 mb-1"><MapPin className="h-5 w-5 text-primary" /><h1 className="text-2xl font-bold">Local Vendors</h1></div>
        <p className="text-sm text-muted-foreground">Nashville's best baby shower vendors 🎵</p>
      </div>

      <div className="px-6 flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
        {vendorCategories.map((cat) => (
          <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${activeCategory === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{cat}</button>
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
