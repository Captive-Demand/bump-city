import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, ShoppingBag } from "lucide-react";
import { MobileLayout } from "@/components/layout/MobileLayout";

const categories = ["All", "Essentials", "Nursery", "Clothing", "Toys", "Feeding"];

const registryItems = [
  { id: 1, name: "Baby Stroller", category: "Essentials", price: 299, claimed: true, claimedBy: "Emma", emoji: "🍼" },
  { id: 2, name: "Crib Bedding Set", category: "Nursery", price: 89, claimed: false, claimedBy: null, emoji: "🛏️" },
  { id: 3, name: "Onesie Pack (6)", category: "Clothing", price: 35, claimed: true, claimedBy: "Lisa", emoji: "👶" },
  { id: 4, name: "Diaper Bag", category: "Essentials", price: 65, claimed: false, claimedBy: null, emoji: "👜" },
  { id: 5, name: "Stuffed Giraffe", category: "Toys", price: 25, claimed: false, claimedBy: null, emoji: "🦒" },
  { id: 6, name: "Bottle Warmer", category: "Feeding", price: 45, claimed: true, claimedBy: "Jake", emoji: "🍶" },
  { id: 7, name: "Mobile for Crib", category: "Nursery", price: 40, claimed: false, claimedBy: null, emoji: "🌙" },
  { id: 8, name: "Swaddle Blankets", category: "Clothing", price: 28, claimed: false, claimedBy: null, emoji: "🧸" },
  { id: 9, name: "High Chair", category: "Feeding", price: 120, claimed: false, claimedBy: null, emoji: "🪑" },
  { id: 10, name: "Baby Monitor", category: "Essentials", price: 150, claimed: true, claimedBy: "Mom", emoji: "📱" },
  { id: 11, name: "Play Mat", category: "Toys", price: 55, claimed: false, claimedBy: null, emoji: "🎨" },
  { id: 12, name: "Rocking Chair", category: "Nursery", price: 200, claimed: false, claimedBy: null, emoji: "🪑" },
];

const RegistryPage = () => {
  const [activeCategory, setActiveCategory] = useState("All");

  const filtered = activeCategory === "All"
    ? registryItems
    : registryItems.filter((item) => item.category === activeCategory);

  const claimedCount = registryItems.filter((i) => i.claimed).length;

  return (
    <MobileLayout>
      <div className="px-6 pt-12 pb-6">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-bold">Gift Registry</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          {claimedCount} of {registryItems.length} items claimed
        </p>

        {/* Progress */}
        <div className="mt-4 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${(claimedCount / registryItems.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Category Filter */}
      <div className="px-6 flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
              activeCategory === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Items */}
      <div className="px-6 space-y-3 pb-6">
        {filtered.map((item) => (
          <Card key={item.id} className={`border-none ${item.claimed ? "opacity-70" : ""}`}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="text-2xl bg-muted w-12 h-12 rounded-xl flex items-center justify-center">
                {item.emoji}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${item.claimed ? "line-through" : ""}`}>
                  {item.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-muted-foreground">${item.price}</span>
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    {item.category}
                  </Badge>
                </div>
              </div>
              {item.claimed ? (
                <div className="flex items-center gap-1 text-primary">
                  <Check className="h-4 w-4" />
                  <span className="text-[10px] font-medium">{item.claimedBy}</span>
                </div>
              ) : (
                <Button size="sm" className="rounded-full text-xs h-8">
                  Claim
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </MobileLayout>
  );
};

export default RegistryPage;
