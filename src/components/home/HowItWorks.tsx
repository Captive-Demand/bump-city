import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
} from "@/components/ui/carousel";
import { X, type LucideIcon } from "lucide-react";

export interface HowItWorksStep {
  number: number;
  title: string;
  description: string;
  icon: LucideIcon;
}

interface HowItWorksProps {
  title?: string;
  steps: HowItWorksStep[];
  storageKey: string;
}

export const HowItWorks = ({ title = "How it works", steps, storageKey }: HowItWorksProps) => {
  const [dismissed, setDismissed] = useState(true);
  const [api, setApi] = useState<any>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(storageKey) === "1");
    } catch {
      setDismissed(false);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!api) return;
    const onSelect = () => setSelectedIndex(api.selectedScrollSnap());
    onSelect();
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    return () => {
      api.off?.("select", onSelect);
    };
  }, [api]);

  const dismiss = () => {
    try { localStorage.setItem(storageKey, "1"); } catch {}
    setDismissed(true);
  };

  if (dismissed) return null;

  const renderCard = (step: HowItWorksStep) => {
    const Icon = step.icon;
    return (
      <div className="h-full bg-background/70 backdrop-blur rounded-2xl p-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center ring-1 ring-primary/15">
            <Icon className="h-4 w-4" strokeWidth={2.25} />
          </span>
          <span className="text-[10px] font-bold text-primary tracking-wider">STEP {step.number}</span>
        </div>
        <p className="text-sm font-semibold leading-tight">{step.title}</p>
        <p className="text-xs text-muted-foreground leading-snug">{step.description}</p>
      </div>
    );
  };

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

        {/* Mobile + tablet: carousel */}
        <div className="lg:hidden">
          <Carousel
            setApi={setApi}
            opts={{ align: "start", loop: false }}
            className="w-full"
          >
            <CarouselContent className="-ml-2">
              {steps.map((step) => (
                <CarouselItem key={step.number} className="pl-2 basis-[85%] sm:basis-1/2">
                  {renderCard(step)}
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
          <div className="flex justify-center gap-1.5 mt-3">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => api?.scrollTo(i)}
                aria-label={`Go to step ${i + 1}`}
                className={`h-1.5 rounded-full transition-all ${
                  i === selectedIndex ? "w-5 bg-primary" : "w-1.5 bg-primary/30"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop: grid */}
        <div className="hidden lg:grid grid-cols-3 gap-2">
          {steps.map((step) => (
            <div key={step.number}>{renderCard(step)}</div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
