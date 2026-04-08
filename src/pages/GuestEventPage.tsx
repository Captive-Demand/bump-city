import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Gift, Calendar, Sparkles, Users, Check, Loader2, MapPin, Clock, Palette, Package, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import bumpCityLogo from "@/assets/bump-city-logo-hz.png";

interface EventData {
  id: string;
  honoree_name: string | null;
  event_date: string | null;
  due_date: string | null;
  theme: string | null;
  city: string | null;
  invite_time_range: string | null;
}

interface RegistryItem {
  id: string;
  name: string;
  category: string;
  price: number | null;
  emoji: string | null;
  claimed: boolean;
  claimed_by: string | null;
  image_url: string | null;
  external_url: string | null;
  source: string | null;
}

const GuestEventPage = () => {
  const { eventId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [event, setEvent] = useState<EventData | null>(null);
  const [registryItems, setRegistryItems] = useState<RegistryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Prediction form
  const [predName, setPredName] = useState("");
  const [predDate, setPredDate] = useState("");
  const [predGender, setPredGender] = useState("");
  const [predWeight, setPredWeight] = useState("");
  const [predBabyName, setPredBabyName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [predicted, setPredicted] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!eventId) return;
      const [{ data: eventData }, { data: items }] = await Promise.all([
        supabase.from("events").select("id, honoree_name, event_date, due_date, theme, city, invite_time_range").eq("id", eventId).maybeSingle(),
        supabase.from("registry_items").select("id, name, category, price, emoji, claimed, claimed_by, image_url").eq("event_id", eventId).order("created_at"),
      ]);
      setEvent(eventData as EventData | null);
      setRegistryItems((items as RegistryItem[]) || []);
      setLoading(false);
    };
    load();
  }, [eventId]);

  const claimItem = async (itemId: string) => {
    if (!user) return;
    const displayName = user.user_metadata?.display_name || user.email || "A guest";
    const { error } = await supabase
      .from("registry_items")
      .update({ claimed: true, claimed_by: displayName })
      .eq("id", itemId);
    if (error) { toast.error("Failed to claim item"); return; }
    toast.success("Item claimed! 🎁");
    setRegistryItems((prev) => prev.map((i) => i.id === itemId ? { ...i, claimed: true, claimed_by: displayName } : i));
  };

  const submitPrediction = async () => {
    if (!eventId || !predName.trim()) return;
    setSubmitting(true);
    const { error } = await supabase.from("predictions").insert({
      event_id: eventId,
      guest_name: predName.trim(),
      predicted_date: predDate || null,
      predicted_gender: predGender || null,
      predicted_weight: predWeight || null,
      predicted_name: predBabyName || null,
    });
    setSubmitting(false);
    if (error) { toast.error("Failed to submit prediction"); return; }
    toast.success("Prediction submitted! 🎉");
    setPredicted(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/15 to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/15 to-background">
        <div className="px-6 pt-10 text-center">
          <img src={bumpCityLogo} alt="Bump City" className="h-8 mx-auto mb-8" />
          <h1 className="text-2xl font-bold mb-2">Event Not Found</h1>
          <Button onClick={() => navigate("/")}>Go Home</Button>
        </div>
      </div>
    );
  }

  const daysUntil = event.due_date
    ? Math.max(0, Math.ceil((new Date(event.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/15 via-primary/5 to-background">
      {/* Header with logo on gradient */}
      <div className="px-6 pt-8 pb-6 max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <img src={bumpCityLogo} alt="Bump City" className="h-7" />
          <Badge variant="secondary" className="text-[10px]">Guest View</Badge>
        </div>

        <h1 className="text-2xl font-bold">
          {event.honoree_name ? `${event.honoree_name}'s Baby Shower` : "Baby Shower"}
        </h1>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2">
          {event.event_date && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              {new Date(event.event_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </p>
          )}
          {event.invite_time_range && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {event.invite_time_range}
            </p>
          )}
          {event.city && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {event.city}
            </p>
          )}
          {event.theme && (
            <p className="text-sm text-muted-foreground flex items-center gap-1.5">
              <Palette className="h-3.5 w-3.5" />
              {event.theme}
            </p>
          )}
        </div>

        {daysUntil !== null && (
          <div className="mt-4 bg-primary/10 rounded-xl p-3 text-center">
            <p className="text-2xl font-bold text-primary">{daysUntil}</p>
            <p className="text-xs text-muted-foreground">days until baby arrives</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-6 pb-8 max-w-4xl mx-auto">
        <Tabs defaultValue="registry" className="mt-2">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="registry"><Gift className="h-3.5 w-3.5 mr-1" /> Registry</TabsTrigger>
            <TabsTrigger value="predictions"><Sparkles className="h-3.5 w-3.5 mr-1" /> Predict</TabsTrigger>
            <TabsTrigger value="details"><Users className="h-3.5 w-3.5 mr-1" /> Details</TabsTrigger>
          </TabsList>

          <TabsContent value="registry" className="mt-4 space-y-3">
            {registryItems.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No registry items yet</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {registryItems.map((item) => (
                  <Card key={item.id} className="border-none">
                    <CardContent className="p-4 flex items-center gap-3">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.name} className="h-10 w-10 rounded-md object-cover shrink-0" />
                      ) : (
                        <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">{item.category}{item.price ? ` · $${item.price}` : ""}</p>
                        {item.claimed && (
                          <p className="text-xs text-primary mt-0.5">Claimed by {item.claimed_by}</p>
                        )}
                      </div>
                      {!item.claimed ? (
                        <Button size="sm" variant="outline" className="shrink-0" onClick={() => claimItem(item.id)}>
                          Claim
                        </Button>
                      ) : (
                        <Check className="h-5 w-5 text-primary shrink-0" />
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="predictions" className="mt-4">
            {predicted ? (
              <Card className="border-none">
                <CardContent className="p-6 text-center">
                  <Sparkles className="h-10 w-10 text-primary mx-auto mb-3" />
                  <h3 className="text-lg font-bold mb-1">Prediction Submitted!</h3>
                  <p className="text-sm text-muted-foreground">Your predictions have been recorded. Good luck! 🍀</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-none">
                <CardContent className="p-6 space-y-4">
                  <h3 className="font-bold text-lg">Make Your Predictions</h3>
                  <div className="space-y-1.5">
                    <Label>Your Name *</Label>
                    <Input placeholder="e.g. Emma" value={predName} onChange={(e) => setPredName(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Predicted Birth Date</Label>
                    <Input type="date" value={predDate} onChange={(e) => setPredDate(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Gender Guess</Label>
                    <div className="flex gap-2">
                      {["Boy", "Girl", "Surprise"].map((g) => (
                        <Button key={g} variant={predGender === g ? "default" : "outline"} size="sm" onClick={() => setPredGender(g)}>
                          {g}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Predicted Weight (lbs)</Label>
                    <Input placeholder="e.g. 7.5" value={predWeight} onChange={(e) => setPredWeight(e.target.value)} />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Baby Name Guess</Label>
                    <Input placeholder="e.g. Oliver" value={predBabyName} onChange={(e) => setPredBabyName(e.target.value)} />
                  </div>
                  <Button className="w-full" onClick={submitPrediction} disabled={submitting || !predName.trim()}>
                    {submitting ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Submitting...</> : "Submit Predictions"}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="details" className="mt-4">
            <Card className="border-none">
              <CardContent className="p-6 space-y-3">
                <h3 className="font-bold text-lg">Event Details</h3>
                {event.honoree_name && (
                  <div><p className="text-xs text-muted-foreground">Honoree</p><p className="font-medium">{event.honoree_name}</p></div>
                )}
                {event.event_date && (
                  <div><p className="text-xs text-muted-foreground">Date</p><p className="font-medium">{new Date(event.event_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</p></div>
                )}
                {event.invite_time_range && (
                  <div><p className="text-xs text-muted-foreground">Time</p><p className="font-medium">{event.invite_time_range}</p></div>
                )}
                {event.city && (
                  <div><p className="text-xs text-muted-foreground">Location</p><p className="font-medium">{event.city}</p></div>
                )}
                {event.theme && (
                  <div><p className="text-xs text-muted-foreground">Theme</p><p className="font-medium">{event.theme}</p></div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default GuestEventPage;