import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { PartyPopper, Loader2 } from "lucide-react";
import { toast } from "sonner";
import bumpCityIcon from "@/assets/bump-city-icon.png";

const JoinEventPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const code = searchParams.get("code") || "";
  const [loading, setLoading] = useState(false);
  const [eventInfo, setEventInfo] = useState<{ id: string; honoree_name: string | null; event_date: string | null; theme: string | null } | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkCode = async () => {
      if (!code) { setChecking(false); return; }
      const { data } = await supabase
        .from("invite_codes")
        .select("event_id, events(id, honoree_name, event_date, theme)")
        .eq("code", code)
        .maybeSingle();
      if (data?.events) {
        const evt = data.events as any;
        setEventInfo({ id: evt.id, honoree_name: evt.honoree_name, event_date: evt.event_date, theme: evt.theme });
      }
      setChecking(false);
    };
    checkCode();
  }, [code]);

  const handleJoin = async () => {
    if (!user || !code) return;
    setLoading(true);
    try {
      // Increment invite use and get event_id
      const { data: eventId, error: rpcError } = await supabase.rpc("increment_invite_use", { code_text: code });
      if (rpcError) throw rpcError;

      // Add user as event member
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
      <MobileLayout hideNav>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MobileLayout>
    );
  }

  if (!code || !eventInfo) {
    return (
      <MobileLayout hideNav>
        <div className="px-6 pt-16 pb-8 flex flex-col items-center text-center min-h-screen max-w-[500px] mx-auto">
          <img src={bumpCityIcon} alt="Bump City" className="h-16 w-16 rounded-2xl mb-4" />
          <h1 className="text-2xl font-bold mb-2">Invalid Invite</h1>
          <p className="text-muted-foreground text-sm mb-6">This invite link is expired or invalid.</p>
          <Button onClick={() => navigate("/auth")}>Go to Login</Button>
        </div>
      </MobileLayout>
    );
  }

  return (
    <MobileLayout hideNav>
      <div className="px-6 pt-16 pb-8 flex flex-col items-center text-center min-h-screen max-w-[500px] mx-auto">
        <img src={bumpCityIcon} alt="Bump City" className="h-20 w-20 rounded-2xl mb-4" />
        <h1 className="text-2xl font-bold mb-1">You're Invited!</h1>
        <p className="text-muted-foreground text-sm mb-6">You've been invited to a baby shower on Bump City</p>

        <Card className="w-full border-none mb-6">
          <CardContent className="p-6 text-center space-y-3">
            <PartyPopper className="h-10 w-10 text-primary mx-auto" />
            {eventInfo.honoree_name && (
              <h2 className="text-xl font-bold">{eventInfo.honoree_name}'s Baby Shower</h2>
            )}
            {eventInfo.event_date && (
              <p className="text-sm text-muted-foreground">
                {new Date(eventInfo.event_date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </p>
            )}
            {eventInfo.theme && (
              <p className="text-sm text-muted-foreground">Theme: {eventInfo.theme}</p>
            )}
          </CardContent>
        </Card>

        {user ? (
          <Button className="w-full" onClick={handleJoin} disabled={loading}>
            {loading ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Joining...</> : "Join Baby Shower"}
          </Button>
        ) : (
          <div className="w-full space-y-3">
            <p className="text-sm text-muted-foreground">Create an account or sign in to join</p>
            <Button className="w-full" onClick={() => navigate(`/auth?redirect=/join?code=${code}`)}>
              Sign Up / Sign In
            </Button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

export default JoinEventPage;
