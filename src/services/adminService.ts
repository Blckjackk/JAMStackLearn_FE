import type { AdminDashboard } from "@/types/admin"
import { apiFetch } from "./api"

export async function getAdminDashboard(userId: number): Promise<AdminDashboard> {
  return apiFetch<AdminDashboard>("admin/dashboard", {
    headers: {
      "X-User-Id": String(userId),
    },
  })
}
