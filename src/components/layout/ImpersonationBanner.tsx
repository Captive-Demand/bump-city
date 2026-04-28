import { useEventRole } from "@/hooks/useEventRole";
import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const LABELS: Record<string, string> = {
  host: "Host",
  "co-host": "Co-Host",
  honoree: "Honoree (Expectant)",
  guest: "Guest",
  admin: "Admin",
};

export const ImpersonationBanner = () => {
  const { impersonatedRole, setImpersonatedRole, isImpersonating } = useEventRole();

  if (!isImpersonating || !impersonatedRole) return null;

  return (
    <div className="flex items-center justify-between gap-2 bg-amber-500 text-amber-950 px-4 py-2.5 text-sm font-bold shadow-md border-b-2 border-amber-600">
      <div className="flex items-center gap-2 min-w-0">
        <Eye className="h-4 w-4 flex-shrink-0" />
        <span className="truncate">Previewing as {LABELS[impersonatedRole] || impersonatedRole}</span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-3 text-amber-950 bg-amber-100/60 hover:bg-amber-50 gap-1 font-bold"
        onClick={() => setImpersonatedRole(null)}
      >
        <X className="h-3.5 w-3.5" /> Stop preview
      </Button>
    </div>
  );
};
