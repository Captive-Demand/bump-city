import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Baby, Gift, Heart, Users, ArrowRight, Sparkles } from "lucide-react";
import bumpCityIcon from "@/assets/bump-city-icon.png";

type EventType = "shower" | "registry";
type UserRole = "expectant-parent" | "planner";

const StepDots = ({ current, total }: { current: number; total: number }) => (
  <div className="flex items-center gap-2 justify-center mb-8">
    {Array.from({ length: total }).map((_, i) => (
      <div
        key={i}
        className={cn(
          "h-2 rounded-full transition-all",
          i === current ? "w-8 bg-primary" : i < current ? "w-2 bg-primary/60" : "w-2 bg-muted"
        )}
      />
    ))}
  </div>
);

const GetStartedPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isNew = searchParams.get("new") === "true";
  const [step, setStep] = useState(0);
  const [eventType, setEventType] = useState<EventType | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);

  const handleContinue = () => {
    if (step === 0 && eventType) {
      setStep(1);
    } else if (step === 1 && role) {
      const setupPath = eventType === "shower" ? "/setup/shower" : "/setup/registry";
      const redirect = isNew ? `${setupPath}?new=true` : setupPath;
      const params = new URLSearchParams({
        redirect,
        eventType,
        role,
      });
      if (isNew) {
        // Already logged in, go straight to setup
        navigate(redirect);
      } else {
        navigate(`/auth?${params.toString()}`);
      }
    }
  };

  return (
    <MobileLayout hideNav>
      <div className="px-6 pt-16 pb-8 flex flex-col items-center min-h-screen max-w-[500px] mx-auto w-full">
        <img src={bumpCityIcon} alt="Bump City" className="h-16 w-16 rounded-2xl mb-3" />
        <h1 className="text-2xl font-bold mb-1">
          {step === 0 ? "Welcome to Bump City" : "Tell us about you"}
        </h1>
        <p className="text-sm text-muted-foreground mb-6 text-center">
          {step === 0
            ? "What are you planning today?"
            : "What's your role in the celebration?"}
        </p>

        <StepDots current={step} total={2} />

        {step === 0 && (
          <div className="w-full space-y-3">
            <Card
              className={cn(
                "cursor-pointer transition-all border-2",
                eventType === "shower"
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:border-primary/30"
              )}
              onClick={() => setEventType("shower")}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Baby className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Baby Shower</h3>
                  <p className="text-sm text-muted-foreground">
                    Plan the perfect shower with guests, gifts & games
                  </p>
                </div>
                <Sparkles className={cn("h-5 w-5 transition-colors", eventType === "shower" ? "text-primary" : "text-muted")} />
              </CardContent>
            </Card>

            <Card
              className={cn(
                "cursor-pointer transition-all border-2",
                eventType === "registry"
                  ? "border-primary bg-primary/5"
                  : "border-transparent hover:border-primary/30"
              )}
              onClick={() => setEventType("registry")}
            >
              <CardContent className="p-5 flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-accent/50 flex items-center justify-center shrink-0">
                  <Gift className="h-6 w-6 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">Gift Registry</h3>
                  <p className="text-sm text-muted-foreground">
                    Create & share a wishlist for your little one
                  </p>
                </div>
                <Sparkles className={cn("h-5 w-5 transition-colors", eventType === "registry" ? "text-primary" : "text-muted")} />
              </CardContent>
            </Card>
          </div>
        )}

        {step === 1 && (
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
        )}

        <div className="w-full mt-8 space-y-3">
          <Button
            className="w-full h-12 rounded-xl font-semibold text-base"
            disabled={step === 0 ? !eventType : !role}
            onClick={handleContinue}
          >
            {step === 1 ? "Create Account" : "Continue"}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          {step === 1 && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setStep(0)}
            >
              Back
            </Button>
          )}

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
