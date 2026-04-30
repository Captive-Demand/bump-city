import { templateConfigs, templates } from "./InviteTemplates";
import { cn } from "@/lib/utils";
import { Check, Upload } from "lucide-react";
import { useRef } from "react";

interface Props {
  selected: string;
  onSelect: (id: string) => void;
  onUploadCustom?: (file: File) => void;
}

const sampleData = {
  title: "Baby Shower",
  eventDate: new Date("2026-06-15"),
  location: "Garden Venue",
  message: "Join us to celebrate!",
};

const TEMPLATE_WIDTH = 380;

const InviteTemplatePicker = ({ selected, onSelect, onUploadCustom }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold tracking-wide">Choose a Style</p>
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
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
                "relative w-full cursor-pointer rounded-2xl text-center transition-all outline-none focus-visible:ring-2 focus-visible:ring-primary/30",
                isSelected ? "scale-[1.01]" : "hover:-translate-y-0.5"
              )}
            >
              <div
                className={cn(
                  "relative w-full overflow-hidden rounded-[22px] border bg-card shadow-sm transition-all",
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
                    transform: `scale(var(--preview-scale, 1))`,
                    transformOrigin: "top left",
                  }}
                  ref={(el) => {
                    if (!el) return;
                    const parent = el.parentElement;
                    if (!parent) return;
                    const apply = () => {
                      const w = parent.clientWidth;
                      el.style.setProperty("--preview-scale", String(w / TEMPLATE_WIDTH));
                    };
                    apply();
                    const ro = new ResizeObserver(apply);
                    ro.observe(parent);
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

      {onUploadCustom && (
        <>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            <Upload className="h-3 w-3" />
            Or upload your own design
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onUploadCustom(file);
              e.target.value = "";
            }}
          />
        </>
      )}
    </div>
  );
};

export default InviteTemplatePicker;
