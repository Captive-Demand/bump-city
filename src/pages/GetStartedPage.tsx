import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Heart, Users, ArrowRight } from "lucide-react";
import bumpCityIcon from "@/assets/bump-city-icon.png";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useActiveEvent } from "@/contexts/ActiveEventContext";
import { toast } from "sonner";

type UserRole = "expectant-parent" | "planner";

const GetStartedPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew = searchParams.get("new") === "true";
  const [role, setRole] = useState<UserRole | null>(null);
  const { user } = useAuth();
  const { refetch } = useActiveEvent();
  const [skipping, setSkipping] = useState(false);

  const handleContinue = () => {
    if (!role) return;
    const setupPath = "/setup/shower";
    const redirect = isNew ? `${setupPath}?new=true` : setupPath;
    if (isNew) {
      navigate(redirect);
    } else {
      const params = new URLSearchParams({ redirect, eventType: "shower", role });
      navigate(`/auth?${params.toString()}`);
    }
  };

  const handleSkip = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    setSkipping(true);
    try {
      const { data: existing } = await supabase
        .from("events")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);
      if (!existing || existing.length === 0) {
        const { error } = await supabase.from("events").insert({
          user_id: user.id,
          event_type: "shower",
          honoree_name: "My Shower",
        });
        if (error) throw error;
      }
      await refetch();
      navigate("/", { replace: true });
    } catch (e: any) {
      toast.error(e?.message || "Couldn't skip onboarding");
      setSkipping(false);
    }
  };

  return (
    <MobileLayout hideNav>
      <div className="px-6 pt-16 pb-8 flex flex-col items-center min-h-screen max-w-[500px] mx-auto w-full">
        <img src={bumpCityIcon} alt="Bump City" className="h-16 w-16 rounded-2xl mb-3" />
        <h1 className="text-2xl font-bold mb-1 text-center">Let's plan your baby shower</h1>
        <p className="text-sm text-muted-foreground mb-8 text-center">
          We'll handle invites, registry, predictions, and everything in between.
        </p>

        <div className="w-full space-y-3">
          <Card
            className={cn(
              "cursor-pointer transition-all border-2",
              role === "expectant-parent"
                ? "border-primary bg-primary/5"
                : "border-transparent hover:border-primary/30"
            )}
            onClick={() => setRole("expectant-parent")}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Heart className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Expectant Parent</h3>
                <p className="text-sm text-muted-foreground">
                  I'm the one expecting — it's my celebration!
                </p>
              </div>
            </CardContent>
          </Card>

          <Card
            className={cn(
              "cursor-pointer transition-all border-2",
              role === "planner"
                ? "border-primary bg-primary/5"
                : "border-transparent hover:border-primary/30"
            )}
            onClick={() => setRole("planner")}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-accent/50 flex items-center justify-center shrink-0">
                <Users className="h-6 w-6 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Planner / Co-Host</h3>
                <p className="text-sm text-muted-foreground">
                  I'm helping plan or host the event
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full mt-8 space-y-3">
          <Button
            className="w-full h-12 rounded-xl font-semibold text-base"
            disabled={!role}
            onClick={handleContinue}
          >
            {isNew ? "Continue" : "Create Account"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <p className="text-center text-xs text-muted-foreground pt-2">
            Already have an account?{" "}
            <button
              className="text-primary hover:underline font-medium"
              onClick={() => navigate("/auth")}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </MobileLayout>
  );
};

export default GetStartedPage;
