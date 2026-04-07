import { templateConfigs } from "./InviteTemplates";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Props {
  selected: string;
  onSelect: (id: string) => void;
}

const InviteTemplatePicker = ({ selected, onSelect }: Props) => (
  <div className="space-y-2">
    <p className="text-sm font-medium">Choose a Style</p>
    <div className="grid grid-cols-4 gap-2">
      {templateConfigs.map((t) => (
        <button
          key={t.id}
          onClick={() => onSelect(t.id)}
          className={cn(
            "relative rounded-lg p-2 text-center transition-all border-2",
            selected === t.id
              ? "border-primary ring-2 ring-primary/30"
              : "border-transparent hover:border-muted-foreground/20"
          )}
        >
          {/* Mini thumbnail */}
          <div
            className="w-full aspect-[3/4] rounded-md mb-1.5 flex items-center justify-center"
            style={{ background: t.thumbBg, border: `1px solid ${t.thumbAccent}33` }}
          >
            <div className="space-y-0.5 px-1">
              <div className="h-1 w-6 mx-auto rounded-full" style={{ background: t.thumbAccent }} />
              <div className="h-0.5 w-8 mx-auto rounded-full" style={{ background: `${t.thumbText}44` }} />
              <div className="h-0.5 w-5 mx-auto rounded-full" style={{ background: `${t.thumbText}33` }} />
            </div>
          </div>
          <span className="text-[10px] font-medium leading-tight block" style={{ color: t.thumbText }}>
            {t.name}
          </span>
          {selected === t.id && (
            <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-primary-foreground" />
            </div>
          )}
        </button>
      ))}
    </div>
  </div>
);

export default InviteTemplatePicker;
