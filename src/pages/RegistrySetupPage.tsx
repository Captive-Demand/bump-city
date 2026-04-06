import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAppMode, type SetupData } from "@/contexts/AppModeContext";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon, ArrowLeft, ArrowRight, Gift, Sparkles } from "lucide-react";

const TOTAL_STEPS = 2;

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

const RegistrySetupPage = () => {
  const navigate = useNavigate();
  const { setMode, updateSetupData } = useAppMode();
  const [step, setStep] = useState(0);

  const [honoreeName, setHonoreeName] = useState("");
  const [dueDate, setDueDate] = useState<Date>();
  const [city, setCity] = useState("");
  const [registryName, setRegistryName] = useState("");
  const [giftPolicy, setGiftPolicy] = useState<"bring-gift" | "no-gifts" | "bring-book">("bring-gift");
  const [registryPrivate, setRegistryPrivate] = useState(false);

  useEffect(() => {
    if (honoreeName && !registryName) {
      setRegistryName(`${honoreeName}'s Baby Registry`);
    }
  }, [honoreeName, registryName]);

  const canNext = () => {
    if (step === 0) return honoreeName.trim().length > 0 && dueDate !== undefined;
    return true;
  };

  const handleFinish = () => {
    const data: Partial<SetupData> = {
      honoreeName: honoreeName.trim(),
      dueDate,
      city: city.trim(),
      registryName: registryName.trim() || `${honoreeName.trim()}'s Baby Registry`,
      giftPolicy,
      registryPrivate,
    };
    updateSetupData(data);
    setMode("registry");
    navigate("/registry");
  };

  return (
    <MobileLayout hideNav>
      <div className="px-6 pt-10 pb-8 min-h-screen flex flex-col max-w-[500px] mx-auto w-full">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="h-5 w-5 text-primary" />
          <span className="text-sm font-semibold text-primary">Registry Setup</span>
        </div>
        <StepDots current={step} total={TOTAL_STEPS} />

        <div className="flex-1">
          {step === 0 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold">About You</h2>
                <p className="text-sm text-muted-foreground mt-1">Let's personalize your registry.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="name">Your name(s) *</Label>
                <Input
                  id="name"
                  placeholder="e.g. Sarah & Mike"
                  value={honoreeName}
                  onChange={(e) => setHonoreeName(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Due date *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn("w-full justify-start text-left font-normal", !dueDate && "text-muted-foreground")}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={dueDate} onSelect={setDueDate} initialFocus className="p-3 pointer-events-auto" />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="city">City / Location</Label>
                <Input id="city" placeholder="e.g. Nashville, TN" value={city} onChange={(e) => setCity(e.target.value)} maxLength={100} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-2xl font-bold">Registry Preferences</h2>
                <p className="text-sm text-muted-foreground mt-1">Customize how your registry works.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="regname">Registry name</Label>
                <Input
                  id="regname"
                  placeholder="e.g. Baby Smith Registry"
                  value={registryName}
                  onChange={(e) => setRegistryName(e.target.value)}
                  maxLength={100}
                />
              </div>
              <div>
                <Label className="mb-2 block">Gift policy</Label>
                <RadioGroup value={giftPolicy} onValueChange={(v) => setGiftPolicy(v as typeof giftPolicy)} className="space-y-3">
                  {[
                    { value: "bring-gift", label: "Gifts welcome", desc: "Share your wishlist with guests" },
                    { value: "no-gifts", label: "No gifts please", desc: "Presence over presents" },
                    { value: "bring-book", label: "Bring a book instead", desc: "Build baby's first library" },
                  ].map((opt) => (
                    <Label
                      key={opt.value}
                      htmlFor={`reg-${opt.value}`}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                        giftPolicy === opt.value ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <RadioGroupItem value={opt.value} id={`reg-${opt.value}`} />
                      <div>
                        <p className="font-semibold text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
              <div>
                <Label className="mb-2 block">Sharing</Label>
                <RadioGroup
                  value={registryPrivate ? "private" : "public"}
                  onValueChange={(v) => setRegistryPrivate(v === "private")}
                  className="space-y-3"
                >
                  {[
                    { value: "public", label: "Public", desc: "Anyone with the link can view" },
                    { value: "private", label: "Private", desc: "Only invited guests can view" },
                  ].map((opt) => (
                    <Label
                      key={opt.value}
                      htmlFor={`share-${opt.value}`}
                      className={cn(
                        "flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all",
                        (opt.value === "private") === registryPrivate ? "border-primary bg-primary/5" : "border-border"
                      )}
                    >
                      <RadioGroupItem value={opt.value} id={`share-${opt.value}`} />
                      <div>
                        <p className="font-semibold text-sm">{opt.label}</p>
                        <p className="text-xs text-muted-foreground">{opt.desc}</p>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 pt-6">
          {step > 0 && (
            <Button variant="outline" className="flex-1" onClick={() => setStep(step - 1)}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
          {step < TOTAL_STEPS - 1 ? (
            <Button className="flex-1" disabled={!canNext()} onClick={() => setStep(step + 1)}>
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button className="flex-1" onClick={handleFinish}>
              <Sparkles className="h-4 w-4 mr-1" /> Let's go!
            </Button>
          )}
        </div>
      </div>
    </MobileLayout>
  );
};

export default RegistrySetupPage;
