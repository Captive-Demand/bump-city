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

const SCALE = 0.22;
const TEMPLATE_W = 380;

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
              "relative rounded-xl text-center transition-all border-2 group",
              selected === t.id
                ? "border-primary ring-2 ring-primary/30 shadow-md"
                : "border-transparent hover:border-muted-foreground/20 hover:shadow-sm"
            )}
          >
            {/* Clipped container with fixed aspect ratio */}
            <div
              className="w-full overflow-hidden rounded-lg relative"
              style={{ aspectRatio: "3/4" }}
            >
              <div
                className="absolute top-0 left-0 pointer-events-none"
                style={{
                  width: TEMPLATE_W,
                  transformOrigin: "top left",
                  transform: `scale(${SCALE})`,
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
