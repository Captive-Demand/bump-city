import { cn } from "@/lib/utils";

interface PageLoaderProps {
  className?: string;
}

// Subtle, non-blocking loader for pages whose data is still loading. Renders
// inside the persistent AppShell so the nav/sidebar stay visible — no full
// content blank. Use for first-load gates only; for refetch states, prefer
// keeping prior data visible and showing inline skeletons.
export const PageLoader = ({ className }: PageLoaderProps) => (
  <div className={cn("px-6 py-8 space-y-4", className)} aria-busy="true" aria-label="Loading">
    <div className="h-8 w-2/3 rounded-md bg-muted/60 animate-pulse" />
    <div className="h-4 w-1/2 rounded-md bg-muted/50 animate-pulse" />
    <div className="space-y-3 pt-4">
      <div className="h-24 rounded-2xl bg-muted/50 animate-pulse" />
      <div className="h-24 rounded-2xl bg-muted/40 animate-pulse" />
      <div className="h-24 rounded-2xl bg-muted/30 animate-pulse" />
    </div>
  </div>
);

export default PageLoader;
