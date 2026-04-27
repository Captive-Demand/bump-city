import { useRoleContext } from "@/contexts/RoleContext";

export type { EventRole, PlatformRole } from "@/contexts/RoleContext";

export const useEventRole = () => useRoleContext();
