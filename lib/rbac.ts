export type AppRole = "ADMIN" | "MANAGER" | "EMPLOYEE"
export type AppStatus = "ACTIVE" | "INACTIVE"

export type Permission =
  | "dashboard.view"
  | "employees.read"
  | "employees.manage"
  | "points.view"
  | "points.allocate"
  | "points.adjust"
  | "recognition.view"
  | "peer.send"
  | "rewards.view"
  | "rewards.manage"
  | "rewards.redeem"
  | "redemptions.view"
  | "redemptions.review"
  | "challenges.view"
  | "challenges.submit"
  | "challenges.review"
  | "challenges.manage"
  | "settings.view"
  | "settings.manage"

const rolePermissions: Record<AppRole, readonly Permission[]> = {
  EMPLOYEE: [
    "dashboard.view",
    "employees.read",
    "points.view",
    "recognition.view",
    "peer.send",
    "rewards.view",
    "rewards.redeem",
    "redemptions.view",
    "challenges.view",
    "challenges.submit",
  ],
  MANAGER: [
    "dashboard.view",
    "employees.read",
    "employees.manage",
    "points.view",
    "points.allocate",
    "recognition.view",
    "peer.send",
    "rewards.view",
    "redemptions.view",
    "redemptions.review",
    "challenges.view",
    "challenges.submit",
    "challenges.review",
  ],
  ADMIN: [
    "dashboard.view",
    "employees.read",
    "employees.manage",
    "points.view",
    "points.allocate",
    "points.adjust",
    "recognition.view",
    "peer.send",
    "rewards.view",
    "rewards.manage",
    "redemptions.view",
    "redemptions.review",
    "challenges.view",
    "challenges.submit",
    "challenges.review",
    "challenges.manage",
    "settings.view",
    "settings.manage",
  ],
}

export function normalizeRole(role: string | null | undefined): AppRole {
  if (role === "ADMIN" || role === "MANAGER" || role === "EMPLOYEE") {
    return role
  }

  return "EMPLOYEE"
}

export function normalizeStatus(status: string | null | undefined): AppStatus {
  return status === "INACTIVE" ? "INACTIVE" : "ACTIVE"
}

export function getRolePermissions(role: string | null | undefined): readonly Permission[] {
  return rolePermissions[normalizeRole(role)]
}

export function can(role: string | null | undefined, permission: Permission): boolean {
  return getRolePermissions(role).includes(permission)
}

export function canAny(
  role: string | null | undefined,
  permissions: readonly Permission[]
): boolean {
  return permissions.some((permission) => can(role, permission))
}
