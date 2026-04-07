import { templateConfigs } from "./InviteTemplates";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

const InviteTemplatePicker = ({ selected, onSelect }: Props) => (
  <div className="space-y-3">
    <p className="text-sm font-semibold tracking-wide">Choose a Style</p>
    <div className="grid grid-cols-4 gap-3">
      {templateConfigs.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={cn(
            "relative rounded-xl p-1.5 text-center transition-all border-2 group",
            selected === t.id
              ? "border-primary ring-2 ring-primary/30 shadow-md"
              : "border-transparent hover:border-muted-foreground/20 hover:shadow-sm"
          )}
        >
          {/* Mini template preview */}
          <div
            className="w-full aspect-[3/4] rounded-lg flex flex-col items-center justify-center overflow-hidden relative"
            style={{
              background: t.thumbBg,
              boxShadow: `inset 0 2px 8px rgba(0,0,0,0.06), 0 1px 3px rgba(0,0,0,0.05)`,
              border: `1px solid ${t.thumbAccent}22`,
            }}
          >
            {/* Top decorative accent */}
            <div className="absolute top-1.5 left-1.5 right-1.5 h-px" style={{ background: `${t.thumbAccent}33` }} />

            {/* Mini invite layout */}
            <div className="space-y-1 px-2 py-1">
              <div className="h-0.5 w-5 mx-auto rounded-full opacity-50" style={{ background: t.thumbAccent }} />
              <div className="h-1.5 w-8 mx-auto rounded-sm font-bold" style={{ background: t.thumbAccent, opacity: 0.7 }} />
              <div className="h-px w-6 mx-auto" style={{ background: `${t.thumbAccent}44` }} />
              <div className="space-y-0.5">
                <div className="h-0.5 w-7 mx-auto rounded-full" style={{ background: `${t.thumbText}33` }} />
                <div className="h-0.5 w-5 mx-auto rounded-full" style={{ background: `${t.thumbText}22` }} />
              </div>
              <div className="h-1.5 w-5 mx-auto rounded-sm mt-1" style={{ background: t.thumbAccent, opacity: 0.5 }} />
            </div>

            {/* Bottom decorative accent */}
            <div className="absolute bottom-1.5 left-1.5 right-1.5 h-px" style={{ background: `${t.thumbAccent}22` }} />
          </div>

          <span
            className="text-[10px] font-semibold leading-tight block mt-1.5 tracking-wide"
            style={{ color: t.thumbText }}
          >
            {t.name}
          </span>

          {selected === t.id && (
            <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-md">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
        </button>
      ))}
    </div>
  </div>
);

export default InviteTemplatePicker;
