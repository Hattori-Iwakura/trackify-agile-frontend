/** Khớp `ProjectRole` Prisma / Nest — dùng để ẩn nút khớp RBAC BE */

export type ProjectRoleStr = "OWNER" | "ADMIN" | "MEMBER" | "VIEWER";

export function getMyProjectRole(
  members: { userId: string; role: string }[],
  myUserId: string
): ProjectRoleStr | "" {
  const r = members.find((m) => m.userId === myUserId)?.role;
  if (r === "OWNER" || r === "ADMIN" || r === "MEMBER" || r === "VIEWER") return r;
  return "";
}

export function isOwnerOrAdmin(role: string | undefined): boolean {
  return role === "OWNER" || role === "ADMIN";
}

export function isOwner(role: string | undefined): boolean {
  return role === "OWNER";
}

/** DELETE issue — BE: ADMIN | OWNER */
export function canDeleteIssue(role: string | undefined): boolean {
  return isOwnerOrAdmin(role);
}

/** PATCH project, DELETE project — BE: OWNER */
export function canManageProjectDanger(role: string | undefined): boolean {
  return isOwner(role);
}

/** Thành viên: thêm / đổi role / xóa — BE: ADMIN | OWNER */
export function canManageMembers(role: string | undefined): boolean {
  return isOwnerOrAdmin(role);
}

/** Sprint: create/update/delete/start/complete — BE: ADMIN | OWNER */
export function canManageSprints(role: string | undefined): boolean {
  return isOwnerOrAdmin(role);
}

/** Tạo/sửa label project — BE: MEMBER+ (không VIEWER) */
export function canCreateOrEditLabel(role: string | undefined): boolean {
  return role === "OWNER" || role === "ADMIN" || role === "MEMBER";
}

/** Xóa label — BE: ADMIN | OWNER */
export function canDeleteLabel(role: string | undefined): boolean {
  return isOwnerOrAdmin(role);
}
