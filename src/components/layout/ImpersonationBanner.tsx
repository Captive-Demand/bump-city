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
    <div className="sticky top-0 z-50 flex items-center justify-between gap-2 bg-amber-500/95 text-amber-950 px-4 py-1.5 text-xs font-semibold shadow-md">
      <div className="flex items-center gap-1.5 min-w-0">
        <Eye className="h-3.5 w-3.5 flex-shrink-0" />
        <span className="truncate">Previewing as {LABELS[impersonatedRole] || impersonatedRole}</span>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 px-2 text-amber-950 hover:bg-amber-600/30 gap-1"
        onClick={() => setImpersonatedRole(null)}
      >
        <X className="h-3 w-3" /> Exit
      </Button>
    </div>
  );
};
