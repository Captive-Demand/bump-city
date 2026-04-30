import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { MobileLayout } from "@/components/layout/MobileLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  ArrowRight,
  CalendarIcon,
  Mail,
  Lock,
  User,
  Sparkles,
  Cake,
  Gift,
  Baby,
  Heart,
  Sprout,
  HandHeart,
  Star,
  CalendarDays,
  CalendarClock,
  GraduationCap,
  MapPin,
  Users,
  type LucideIcon,
} from "lucide-react";
import bumpCityIcon from "@/assets/bump-city-icon.png";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useActiveEvent } from "@/contexts/ActiveEventContext";
import { toast } from "sonner";
import type { Json } from "@/integrations/supabase/types";

type Path = "shower" | "registry";
type Role = "honoree" | "host";
type Journey = "pregnancy" | "adoption" | "surrogacy" | "trying";

interface WizardState {
  path: Path | null;
  role: Role | null;
  journey: Journey | null;
  dueDate: Date | undefined;
  multiples: boolean;
  firstTime: boolean | null;
  honoreeName: string;
  eventDate: Date | undefined;
  city: string;
  // Auth fields
  displayName: string;
  email: string;
  password: string;
}

/**
 * Step keys drive the wizard. We compute the visible list from path+role so the
 * registry-only flow naturally skips shower-specific screens, and honorees skip
 * the "who is this for?" question (we use their own displayName).
 */
type StepKey =
  | "path"
  | "role"
  | "journey"
  | "dueDate"
  | "firstTime"
  | "milestone"
  | "honoree"
  | "eventDate"
  | "city"
  | "auth";

const initialState: WizardState = {
  path: null,
  role: null,
  journey: null,
  dueDate: undefined,
  multiples: false,
  firstTime: null,
  honoreeName: "",
  eventDate: undefined,
  city: "",
  displayName: "",
  email: "",
  password: "",
};

const journeyOptions: {
  value: Journey;
  Icon: LucideIcon;
  label: string;
  sub: string;
}[] = [
  { value: "pregnancy", Icon: Sprout, label: "Pregnancy", sub: "Bun in the oven" },
  { value: "adoption", Icon: HandHeart, label: "Adoption", sub: "Growing through adoption" },
  { value: "surrogacy", Icon: Users, label: "Surrogacy", sub: "Working with a surrogate" },
  { value: "trying", Icon: Star, label: "Trying", sub: "On the journey" },
];

const GetStartedPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refetch } = useActiveEvent();

  const [state, setState] = useState<WizardState>(initialState);
  const [stepKey, setStepKey] = useState<StepKey>("path");
  const [submitting, setSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState<"signup" | "signin">("signup");

  // Pre-fill display name + email if the user is already authenticated (e.g.,
  // they came back to onboarding after signing in earlier).
  useEffect(() => {
    if (user) {
      setState((s) => ({
        ...s,
        displayName: s.displayName || user.user_metadata?.display_name || "",
        email: s.email || user.email || "",
      }));
    }
  }, [user]);

  // Compute step list dynamically from path + role so the wizard adapts to the
  // user's choices without dead-end screens.
  const steps = useMemo<StepKey[]>(() => {
    const s: StepKey[] = ["path", "role", "journey", "dueDate", "firstTime", "milestone"];
    // Only ask "who is this for?" if the user is hosting for someone else.
    if (state.role === "host") s.push("honoree");
    // Shower-only logistics
    if (state.path !== "registry") s.push("eventDate", "city");
    s.push("auth");
    return s;
  }, [state.path, state.role]);

  const currentIndex = steps.indexOf(stepKey);
  const totalSteps = steps.length;
  const progress = Math.round(((currentIndex + 1) / totalSteps) * 100);

  const update = <K extends keyof WizardState>(key: K, value: WizardState[K]) =>
    setState((s) => ({ ...s, [key]: value }));

  const goNext = () => {
    const next = steps[currentIndex + 1];
    if (next) setStepKey(next);
  };
  const goBack = () => {
    const prev = steps[currentIndex - 1];
    if (prev) setStepKey(prev);
  };

  // Each step decides if Next is enabled. Returning true = ready to advance.
  const canAdvance = (): boolean => {
    switch (stepKey) {
      case "path":
        return !!state.path;
      case "role":
        return !!state.role;
      case "journey":
        return !!state.journey;
      case "dueDate":
        return !!state.dueDate;
      case "firstTime":
        return state.firstTime !== null;
      case "milestone":
        return true;
      case "honoree":
        return state.honoreeName.trim().length > 0;
      case "eventDate":
        return true; // optional
      case "city":
        return true; // optional
      case "auth":
        return false; // auth step has its own submit
    }
  };

  const handleSignUp = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: state.email,
        password: state.password,
        options: {
          data: { display_name: state.displayName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) throw error;
      if (!data.session) {
        toast.success("Check your email to verify your account!");
        return;
      }
      await persistEventAndFinish(data.session.user.id);
    } catch (err) {
      const e = err as { message?: string };
      toast.error(e?.message || "Couldn't create your account");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSignIn = async () => {
    setSubmitting(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: state.email,
        password: state.password,
      });
      if (error) throw error;
      await persistEventAndFinish(data.user.id);
    } catch (err) {
      const e = err as { message?: string };
      toast.error(e?.message || "Couldn't sign you in");
    } finally {
      setSubmitting(false);
    }
  };

  const persistEventAndFinish = async (userId: string) => {
    // gift_preferences keeps gift-policy defaults; personalization fields
    // (role/journey/multiples/first_time_parent) live in real columns now.
    const prefs: Record<string, boolean> = {
      bring_gift: true,
      bring_to_event: true,
    };

    const isRegistryPath = state.path === "registry";
    // Honoree fallback: when the user IS the honoree we use their own name;
    // when they're hosting we use the explicit honoree field.
    const honoree =
      state.role === "host"
        ? state.honoreeName.trim() || "My"
        : state.displayName.trim() || "My";

    const { error } = await supabase.from("events").insert({
      user_id: userId,
      event_type: isRegistryPath ? "registry" : "shower",
      honoree_name: honoree,
      due_date: state.dueDate ? format(state.dueDate, "yyyy-MM-dd") : null,
      event_date: !isRegistryPath && state.eventDate ? format(state.eventDate, "yyyy-MM-dd") : null,
      city: state.city.trim() || null,
      gift_policy: "bring-gift",
      gift_preferences: prefs as Json,
      role: state.role,
      journey: state.journey,
      multiples: state.multiples,
      first_time_parent: state.firstTime,
    });

    if (error) {
      toast.error("Saved your account, but couldn't create the event. You can finish setup from the home page.");
    } else {
      toast.success(isRegistryPath ? "Your registry is ready!" : "Your shower is ready!");
    }

    await refetch();
    navigate("/", { replace: true });
  };

  // If the user backs out and changes path/role to one where their current
  // step no longer exists in the list, drop them on the milestone (mid-point).
  useEffect(() => {
    if (!steps.includes(stepKey)) {
      setStepKey("milestone");
    }
  }, [steps, stepKey]);

  const renderStep = () => {
    switch (stepKey) {
      case "path":
        return <PathStep value={state.path} onChange={(v) => update("path", v)} />;
      case "role":
        return <RoleStep value={state.role} onChange={(v) => update("role", v)} path={state.path} />;
      case "journey":
        return <JourneyStep value={state.journey} onChange={(v) => update("journey", v)} role={state.role} />;
      case "dueDate":
        return (
          <DueDateStep
            dueDate={state.dueDate}
            multiples={state.multiples}
            onDueDate={(d) => update("dueDate", d)}
            onMultiples={(v) => update("multiples", v)}
            path={state.path}
          />
        );
      case "firstTime":
        return (
          <FirstTimeStep
            value={state.firstTime}
            onChange={(v) => update("firstTime", v)}
            role={state.role}
          />
        );
      case "milestone":
        return <MilestoneStep dueDate={state.dueDate} path={state.path} firstTime={state.firstTime} />;
      case "honoree":
        return (
          <HonoreeStep
            name={state.honoreeName}
            onChange={(v) => update("honoreeName", v)}
            path={state.path}
          />
        );
      case "eventDate":
        return (
          <EventDateStep
            eventDate={state.eventDate}
            onChange={(d) => update("eventDate", d)}
          />
        );
      case "city":
        return <CityStep city={state.city} onChange={(v) => update("city", v)} />;
      case "auth":
        return (
          <AuthStep
            mode={authMode}
            setMode={setAuthMode}
            displayName={state.displayName}
            email={state.email}
            password={state.password}
            onChange={(field, v) => update(field, v)}
            onSubmit={authMode === "signup" ? handleSignUp : handleSignIn}
            submitting={submitting}
            path={state.path}
          />
        );
    }
  };

  return (
    <MobileLayout hideNav>
      <div className="px-6 pt-8 pb-8 flex flex-col min-h-screen max-w-[520px] mx-auto w-full">
        {/* Top bar — progress + back */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={goBack}
              disabled={currentIndex === 0}
              className="p-1 -ml-1 text-muted-foreground hover:text-foreground disabled:opacity-30"
              aria-label="Back"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <img src={bumpCityIcon} alt="Bump City" className="h-7 w-7 rounded-md" />
            <button
              onClick={() => navigate("/auth")}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              Sign in
            </button>
          </div>
          <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary via-mint to-lavender transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Step body — flex-1 fills space, content is centered-ish */}
        <div className="flex-1 flex flex-col">{renderStep()}</div>

        {/* Footer — Next/Back, except auth which has its own submit. */}
        {stepKey !== "auth" && (
          <div className="pt-4 flex gap-2">
            <Button
              className="flex-1 h-12 rounded-xl font-semibold"
              disabled={!canAdvance()}
              onClick={goNext}
            >
              Next
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </MobileLayout>
  );
};

// ─── Shared UI ───────────────────────────────────────────────────────────────

/**
 * Tinted circular icon container — used in step headers and on option cards
 * so icons feel intentional rather than dropped-in. Sizes:
 *   "lg" → header icon (h-14 / icon h-7)
 *   "md" → option-card icon (h-12 / icon h-6)
 */
const StepIcon = ({
  Icon,
  size = "lg",
  tone = "primary",
  className,
}: {
  Icon: LucideIcon;
  size?: "lg" | "md";
  tone?: "primary" | "muted";
  className?: string;
}) => {
  const wrap = size === "lg" ? "h-14 w-14" : "h-12 w-12";
  const inner = size === "lg" ? "h-7 w-7" : "h-6 w-6";
  const bg = tone === "muted" ? "bg-muted" : "bg-primary/10";
  const fg = tone === "muted" ? "text-foreground/70" : "text-primary";
  return (
    <div className={cn("rounded-2xl flex items-center justify-center", wrap, bg, className)}>
      <Icon className={cn(inner, fg)} strokeWidth={1.75} />
    </div>
  );
};

const StepHeader = ({
  icon,
  title,
  sub,
}: {
  icon?: LucideIcon;
  title: string;
  sub?: string;
}) => (
  <div className="text-center space-y-3 mb-6 flex flex-col items-center">
    {icon && <StepIcon Icon={icon} />}
    <h1 className="text-2xl font-bold leading-tight">{title}</h1>
    {sub && <p className="text-sm text-muted-foreground">{sub}</p>}
  </div>
);

const OptionCard = ({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) => (
  <Card
    className={cn(
      "cursor-pointer transition-all border-2",
      selected ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
    )}
    onClick={onClick}
  >
    <CardContent className="p-5">{children}</CardContent>
  </Card>
);

// ─── Step components ─────────────────────────────────────────────────────────

const PathStep = ({
  value,
  onChange,
}: {
  value: Path | null;
  onChange: (v: Path) => void;
}) => (
  <>
    <StepHeader
      icon={Sparkles}
      title="What would you like to set up?"
      sub="You can always add the other one later."
    />
    <div className="space-y-3">
      <OptionCard selected={value === "shower"} onClick={() => onChange("shower")}>
        <div className="flex items-center gap-4">
          <StepIcon Icon={Cake} size="md" />
          <div>
            <h3 className="font-bold">A baby shower</h3>
            <p className="text-sm text-muted-foreground">
              Invites, registry, predictions, and games — the whole celebration.
            </p>
          </div>
        </div>
      </OptionCard>
      <OptionCard selected={value === "registry"} onClick={() => onChange("registry")}>
        <div className="flex items-center gap-4">
          <StepIcon Icon={Gift} size="md" />
          <div>
            <h3 className="font-bold">A registry</h3>
            <p className="text-sm text-muted-foreground">
              Just a gift list to share with friends and family.
            </p>
          </div>
        </div>
      </OptionCard>
    </div>
  </>
);

const RoleStep = ({
  value,
  onChange,
  path,
}: {
  value: Role | null;
  onChange: (v: Role) => void;
  path: Path | null;
}) => {
  const isRegistry = path === "registry";
  return (
    <>
      <StepHeader
        icon={Users}
        title="Who is this for?"
        sub={
          isRegistry
            ? "We'll tailor the registry experience based on your role."
            : "We'll tailor the shower experience based on your role."
        }
      />
      <div className="space-y-3 max-w-sm mx-auto w-full">
        <OptionCard selected={value === "honoree"} onClick={() => onChange("honoree")}>
          <div className="flex items-center gap-4">
            <StepIcon Icon={Baby} size="md" />
            <div>
              <h3 className="font-bold">It's mine</h3>
              <p className="text-sm text-muted-foreground">
                I'm the parent-to-be — this {isRegistry ? "registry" : "shower"} is for me.
              </p>
            </div>
          </div>
        </OptionCard>
        <OptionCard selected={value === "host"} onClick={() => onChange("host")}>
          <div className="flex items-center gap-4">
            <StepIcon Icon={Heart} size="md" />
            <div>
              <h3 className="font-bold">I'm hosting / co-hosting</h3>
              <p className="text-sm text-muted-foreground">
                I'm planning this for a friend, family member, or partner.
              </p>
            </div>
          </div>
        </OptionCard>
      </div>
    </>
  );
};

const JourneyStep = ({
  value,
  onChange,
  role,
}: {
  value: Journey | null;
  onChange: (v: Journey) => void;
  role: Role | null;
}) => (
  <>
    <StepHeader
      icon={Sparkles}
      title="The road ahead is filled with adventure."
      sub={role === "host" ? "Where are they in their journey?" : "Where are you in your journey?"}
    />
    <div className="grid grid-cols-2 gap-3">
      {journeyOptions.map((opt) => (
        <OptionCard
          key={opt.value}
          selected={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          <div className="text-center space-y-2 flex flex-col items-center">
            <StepIcon Icon={opt.Icon} size="md" />
            <p className="font-bold text-sm">{opt.label}</p>
            <p className="text-[11px] text-muted-foreground leading-tight">{opt.sub}</p>
          </div>
        </OptionCard>
      ))}
    </div>
  </>
);

const DueDateStep = ({
  dueDate,
  multiples,
  onDueDate,
  onMultiples,
  path,
}: {
  dueDate: Date | undefined;
  multiples: boolean;
  onDueDate: (d: Date | undefined) => void;
  onMultiples: (v: boolean) => void;
  path: Path | null;
}) => (
  <>
    <StepHeader
      icon={CalendarDays}
      title="When is this babe arriving?"
      sub={path === "registry" ? "We'll use this to time tips and reminders." : "We'll use this to plan your shower."}
    />
    <div className="space-y-4 max-w-sm mx-auto w-full">
      <div className="space-y-1.5">
        <Label>Due date</Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal h-11 rounded-xl",
                !dueDate && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDate ? format(dueDate, "PPP") : "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dueDate}
              onSelect={onDueDate}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>
      <label className="flex items-center gap-2 cursor-pointer text-sm">
        <Checkbox
          checked={multiples}
          onCheckedChange={(v) => onMultiples(v === true)}
        />
        <span className="flex items-center gap-1.5">
          More than one is on the way
          <Users className="h-3.5 w-3.5 text-primary" />
        </span>
      </label>
    </div>
  </>
);

const FirstTimeStep = ({
  value,
  onChange,
  role,
}: {
  value: boolean | null;
  onChange: (v: boolean) => void;
  role: Role | null;
}) => (
  <>
    <StepHeader
      icon={Heart}
      title={role === "host" ? "Is this their first child?" : "Are you a first-time parent?"}
    />
    <div className="grid grid-cols-2 gap-3 max-w-sm mx-auto w-full">
      <OptionCard selected={value === true} onClick={() => onChange(true)}>
        <p className="text-center font-bold text-base">Yes</p>
      </OptionCard>
      <OptionCard selected={value === false} onClick={() => onChange(false)}>
        <p className="text-center font-bold text-base">No</p>
      </OptionCard>
    </div>
  </>
);

const MilestoneStep = ({
  dueDate,
  path,
  firstTime,
}: {
  dueDate: Date | undefined;
  path: Path | null;
  firstTime: boolean | null;
}) => {
  const kindergartenYear = dueDate ? dueDate.getFullYear() + 5 : null;
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4 py-8">
      <StepIcon Icon={GraduationCap} />
      {kindergartenYear ? (
        <>
          <h1 className="text-2xl font-bold leading-tight max-w-md">
            That means in {kindergartenYear}, they'll be headed off to kindergarten.
          </h1>
          <p className="text-sm text-muted-foreground">They grow up so fast!</p>
        </>
      ) : (
        <>
          <h1 className="text-2xl font-bold leading-tight max-w-md">
            Welcome to bump town
          </h1>
          <p className="text-sm text-muted-foreground">
            {firstTime
              ? "First-timer or fifth-timer, we'll make this fun."
              : "Glad to have you back. Let's make this one special."}
          </p>
        </>
      )}
      {path === "shower" && (
        <p className="text-xs text-muted-foreground pt-3">A few quick details about your shower next.</p>
      )}
    </div>
  );
};

const HonoreeStep = ({
  name,
  onChange,
  path,
}: {
  name: string;
  onChange: (v: string) => void;
  path: Path | null;
}) => (
  <>
    <StepHeader
      icon={User}
      title={path === "registry" ? "Who is the registry for?" : "Who is the shower for?"}
      sub={path === "registry"
        ? "The name we'll show on the registry page."
        : "The name we'll print on the invites and registry."}
    />
    <div className="space-y-1.5 max-w-sm mx-auto w-full">
      <Label htmlFor="honoree">Honoree name(s)</Label>
      <Input
        id="honoree"
        placeholder="e.g. Sarah & Mike"
        value={name}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 text-base rounded-xl"
        maxLength={100}
        autoFocus
      />
    </div>
  </>
);

const EventDateStep = ({
  eventDate,
  onChange,
}: {
  eventDate: Date | undefined;
  onChange: (d: Date | undefined) => void;
}) => (
  <>
    <StepHeader
      icon={CalendarClock}
      title="When's the shower?"
      sub="You can always change this later — leave blank if it's TBD."
    />
    <div className="max-w-sm mx-auto w-full">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal h-11 rounded-xl",
              !eventDate && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {eventDate ? format(eventDate, "PPP") : "Pick a date (optional)"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={eventDate}
            onSelect={onChange}
            initialFocus
            className="p-3 pointer-events-auto"
          />
        </PopoverContent>
      </Popover>
    </div>
  </>
);

const CityStep = ({
  city,
  onChange,
}: {
  city: string;
  onChange: (v: string) => void;
}) => (
  <>
    <StepHeader
      icon={MapPin}
      title="Where will it happen?"
      sub="Helps us recommend local vendors and venues."
    />
    <div className="space-y-1.5 max-w-sm mx-auto w-full">
      <Label htmlFor="city">City or neighborhood</Label>
      <Input
        id="city"
        placeholder="e.g. Nashville, TN"
        value={city}
        onChange={(e) => onChange(e.target.value)}
        className="h-12 text-base rounded-xl"
        maxLength={100}
        autoFocus
      />
      {city.toLowerCase().includes("nashville") && (
        <p className="text-xs text-primary font-medium pt-1 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Nashville unlocks local vendors & community events!
        </p>
      )}
    </div>
  </>
);

const AuthStep = ({
  mode,
  setMode,
  displayName,
  email,
  password,
  onChange,
  onSubmit,
  submitting,
  path,
}: {
  mode: "signup" | "signin";
  setMode: (m: "signup" | "signin") => void;
  displayName: string;
  email: string;
  password: string;
  onChange: <K extends keyof WizardState>(field: K, v: WizardState[K]) => void;
  onSubmit: () => void;
  submitting: boolean;
  path: Path | null;
}) => {
  const isSignUp = mode === "signup";
  const submitLabel = isSignUp
    ? path === "registry"
      ? "Save my registry"
      : "Save my shower"
    : "Sign in & continue";

  return (
    <>
      <StepHeader
        icon={Mail}
        title={isSignUp ? "Save your progress" : "Welcome back"}
        sub={
          isSignUp
            ? "Create a quick account to lock in your details."
            : "Sign in to keep going."
        }
      />
      <form
        className="space-y-4 max-w-sm mx-auto w-full"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
      >
        {isSignUp && (
          <div className="space-y-1.5">
            <Label htmlFor="displayName">Your name</Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="displayName"
                placeholder="First name"
                value={displayName}
                onChange={(e) => onChange("displayName", e.target.value)}
                className="pl-9 h-11 rounded-xl"
                required
              />
            </div>
          </div>
        )}
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => onChange("email", e.target.value)}
              className="pl-9 h-11 rounded-xl"
              required
              autoComplete="email"
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => onChange("password", e.target.value)}
              className="pl-9 h-11 rounded-xl"
              required
              minLength={6}
              autoComplete={isSignUp ? "new-password" : "current-password"}
            />
          </div>
        </div>

        <Button type="submit" className="w-full h-12 rounded-xl font-semibold" disabled={submitting}>
          <Sparkles className="h-4 w-4 mr-1" />
          {submitting ? "Saving…" : submitLabel}
        </Button>

        <p className="text-xs text-center text-muted-foreground pt-1">
          {isSignUp ? "Already have an account?" : "New to Bump City?"}{" "}
          <button
            type="button"
            onClick={() => setMode(isSignUp ? "signin" : "signup")}
            className="text-primary hover:underline font-medium"
          >
            {isSignUp ? "Sign in instead" : "Create one"}
          </button>
        </p>
      </form>
    </>
  );
};

export default GetStartedPage;
