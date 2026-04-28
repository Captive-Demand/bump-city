import { useRoleContext } from "@/contexts/RoleContext";

export type { EventRole, PlatformRole, ImpersonatedRole } from "@/contexts/RoleContext";

export const useEventRole = () => useRoleContext();
