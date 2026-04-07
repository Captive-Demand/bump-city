import { useActiveEvent } from "@/contexts/ActiveEventContext";

export type { EventData } from "@/contexts/ActiveEventContext";

export const useEvent = () => {
  const { activeEvent, loading, refetch } = useActiveEvent();
  return { event: activeEvent, loading, refetch };
};
