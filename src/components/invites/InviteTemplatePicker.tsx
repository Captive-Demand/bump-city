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

const PREVIEW_WIDTH = 132;
const PREVIEW_SCALE = 0.34;
const TEMPLATE_WIDTH = 380;

const InviteTemplatePicker = ({ selected, onSelect }: Props) => (
  <div className="space-y-3">
    <p className="text-sm font-semibold tracking-wide">Choose a Style</p>
    <div className="grid grid-cols-[repeat(auto-fit,minmax(132px,132px))] justify-start gap-4">
      {templateConfigs.map((template) => {
        const TemplatePreview = templates[template.id];
        const isSelected = selected === template.id;

        return (
          <div
            key={template.id}
            role="button"
            tabIndex={0}
            onClick={() => onSelect(template.id)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(template.id);
              }
            }}
            className={cn(
              "relative w-[132px] cursor-pointer rounded-2xl text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
              isSelected ? "scale-[1.01]" : "hover:-translate-y-0.5"
            )}
          >
            <div
              className={cn(
                "relative overflow-hidden rounded-[22px] border bg-card shadow-sm transition-all",
                isSelected
                  ? "border-primary shadow-[0_12px_30px_hsl(var(--primary)/0.18)]"
                  : "border-border hover:border-primary/30"
              )}
              style={{ aspectRatio: "5 / 7" }}
            >
              <div
                aria-hidden="true"
                className="absolute left-0 top-0 origin-top-left select-none pointer-events-none"
                style={{
                  width: TEMPLATE_WIDTH,
                  transform: `scale(${PREVIEW_SCALE})`,
                  transformOrigin: "top left",
                }}
              >
                <TemplatePreview {...sampleData} />
              </div>

              {isSelected && (
                <div className="absolute right-1.5 top-1.5 z-10 flex h-5 w-5 items-center justify-center rounded-full bg-primary shadow-sm">
                  <Check className="h-3 w-3 text-primary-foreground" />
                </div>
              )}
            </div>

            <span className="mt-2 block text-[11px] font-medium leading-tight text-foreground/80">
              {template.name}
            </span>
          </div>
        );
      })}
    </div>
  </div>
);

export default InviteTemplatePicker;
