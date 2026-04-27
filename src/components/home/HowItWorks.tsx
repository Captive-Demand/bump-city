import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { X } from "lucide-react";

export interface HowItWorksStep {
  number: number;
  title: string;
  description: string;
  emoji: string;
}

interface HowItWorksProps {
  title?: string;
  steps: HowItWorksStep[];
  storageKey: string;
}

export const HowItWorks = ({ title = "How it works", steps, storageKey }: HowItWorksProps) => {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(storageKey) === "1");
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  const dismiss = () => {
    try { localStorage.setItem(storageKey, "1"); } catch {}
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <Card className="border-none bg-gradient-to-br from-primary/10 via-lavender/20 to-peach/15">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">{title}</h2>
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="p-1 rounded-full hover:bg-background/50 text-muted-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto -mx-1 px-1 pb-1 snap-x snap-mandatory">
          {steps.map((step) => (
            <div
              key={step.number}
              className="snap-start shrink-0 w-[72%] max-w-[240px] bg-background/70 backdrop-blur rounded-2xl p-3 flex flex-col gap-1.5"
            >
              <div className="flex items-center gap-2">
                <span className="text-xl">{step.emoji}</span>
                <span className="text-[10px] font-bold text-primary tracking-wider">STEP {step.number}</span>
              </div>
              <p className="text-sm font-semibold leading-tight">{step.title}</p>
              <p className="text-xs text-muted-foreground leading-snug">{step.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
