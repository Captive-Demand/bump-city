import { templateConfigs, templates } from "./InviteTemplates";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

const sampleData = {
  title: "Baby Shower",
  eventDate: new Date("2026-06-15"),
  location: "Garden Venue",
  message: "Join us to celebrate!",
};

const InviteTemplatePicker = ({ selected, onSelect }: Props) => (
  <div className="space-y-3">
    <p className="text-sm font-semibold tracking-wide">Choose a Style</p>
    <div className="grid grid-cols-4 gap-3">
      {templateConfigs.map((t) => {
        const Template = templates[t.id];
        return (
          <button
            key={t.id}
            onClick={() => onSelect(t.id)}
            className={cn(
              "relative rounded-xl text-center transition-all border-2 group overflow-hidden",
              selected === t.id
                ? "border-primary ring-2 ring-primary/30 shadow-md"
                : "border-transparent hover:border-muted-foreground/20 hover:shadow-sm"
            )}
          >
            {/* Scaled-down live template preview */}
            <div className="w-full aspect-[3/4] overflow-hidden rounded-lg relative">
              <div
                className="origin-top-left pointer-events-none"
                style={{
                  width: 400,
                  transform: "scale(0.25)",
                  transformOrigin: "top left",
                }}
              >
                <Template {...sampleData} />
              </div>
            </div>

            <span className="text-[10px] font-semibold leading-tight block py-1.5 tracking-wide text-muted-foreground">
              {t.name}
            </span>

            {selected === t.id && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md z-10">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
            )}
          </button>
        );
      })}
    </div>
  </div>
);

export default InviteTemplatePicker;
