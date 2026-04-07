import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PartyPopper, Loader2, Calendar, MapPin, Clock, Palette } from "lucide-react";
import { toast } from "sonner";
import bumpCityLogo from "@/assets/bump-city-logo-hz.png";

const JoinEventPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code") || "";
  const [loading, setLoading] = useState(false);
  const [eventInfo, setEventInfo] = useState<{
    id: string;
    honoree_name: string | null;
    event_date: string | null;
    theme: string | null;
    city: string | null;
    invite_time_range: string | null;
  } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkCode = async () => {
      if (!code) { setChecking(false); return; }
      const { data } = await supabase
        .from("invite_codes")
        .select("event_id, events(id, honoree_name, event_date, theme, city, invite_time_range)")
        .eq("code", code)
        .maybeSingle();
      if (data?.events) {
        const evt = data.events as any;
        setEventInfo({
          id: evt.id,
          honoree_name: evt.honoree_name,
          event_date: evt.event_date,
          theme: evt.theme,
          city: evt.city,
          invite_time_range: evt.invite_time_range,
        });
      }
      setChecking(false);
    };
    checkCode();
  }, [code]);

  const handleJoin = async () => {
    if (!user || !code) return;
    setLoading(true);
    try {
      const { data: eventId, error: rpcError } = await supabase.rpc("increment_invite_use", { code_text: code });
      if (rpcError) throw rpcError;

      const { error: memberError } = await supabase
        .from("event_members")
        .upsert({ event_id: eventId, user_id: user.id, role: "guest" }, { onConflict: "event_id,user_id" });
      if (memberError) throw memberError;

      toast.success("You've joined the baby shower! 🎉");
      navigate(`/event/${eventId}`);
    } catch (err: any) {
      toast.error(err.message || "Failed to join event");
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/15 to-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!code || !eventInfo) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/15 to-background">
        <div className="px-6 pt-10 pb-8 flex flex-col items-center text-center max-w-[500px] mx-auto">
          <img src={bumpCityLogo} alt="Bump City" className="h-8 mb-12" />
          <h1 className="text-2xl font-bold mb-2">Invalid Invite</h1>
          <p className="text-muted-foreground text-sm mb-6">This invite link is expired or invalid.</p>
          <Button onClick={() => navigate("/auth")}>Go to Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/15 via-primary/5 to-background">
      <div className="px-6 pt-10 pb-8 flex flex-col items-center text-center max-w-[500px] mx-auto">
        <img src={bumpCityLogo} alt="Bump City" className="h-8 mb-12" />

        <PartyPopper className="h-12 w-12 text-primary mb-4" />
        <h1 className="text-2xl font-bold mb-1">You're Invited!</h1>
        <p className="text-muted-foreground text-sm mb-8">You've been invited to a baby shower on Bump City</p>

        <Card className="w-full border-none mb-8">
          <CardContent className="p-6 text-center space-y-4">
            {eventInfo.honoree_name && (
              <h2 className="text-xl font-bold">{eventInfo.honoree_name}'s Baby Shower</h2>
            )}

            <div className="space-y-2.5">
              {eventInfo.event_date && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 shrink-0" />
                  <span>{new Date(eventInfo.event_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
                </div>
              )}
              {eventInfo.invite_time_range && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 shrink-0" />
                  <span>{eventInfo.invite_time_range}</span>
                </div>
              )}
              {eventInfo.city && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span>{eventInfo.city}</span>
                </div>
              )}
              {eventInfo.theme && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Palette className="h-4 w-4 shrink-0" />
                  <span>Theme: {eventInfo.theme}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {user ? (
          <Button className="w-full" size="lg" onClick={handleJoin} disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Joining...</> : "Join Baby Shower"}
          </Button>
        ) : (
          <div className="w-full space-y-3">
            <p className="text-sm text-muted-foreground">Create an account or sign in to join</p>
            <Button className="w-full" size="lg" onClick={() => navigate(`/auth?redirect=/join?code=${code}`)}>
              Sign Up / Sign In
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default JoinEventPage;