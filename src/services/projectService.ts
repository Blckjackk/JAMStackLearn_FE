import type { CreateProjectInput, Project } from "@/types"
import { apiFetch } from "./api"

export async function getProjects(userId: number): Promise<Project[]> {
  return apiFetch<Project[]>(`project/user/${userId}`)
}

export async function getProject(id: number): Promise<Project> {
  return apiFetch<Project>(`project/${id}`)
}

export async function createProject(
  actorUserId: number,
  payload: CreateProjectInput
): Promise<Project> {
  return apiFetch<Project>("project", {
    method: "POST",
    headers: {
      "X-User-Id": actorUserId.toString(),
    },
    body: payload,
  })
}
