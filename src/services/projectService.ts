import type { CreateProjectInput, Project, ProjectInvite } from "@/types"
import { apiFetch } from "./api"

type CreateInviteInput = {
  userCode: string
  role: string
}

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

export async function createProjectInvite(
  projectId: number,
  actorUserId: number,
  payload: CreateInviteInput
): Promise<ProjectInvite> {
  return apiFetch<ProjectInvite>(`project/${projectId}/invites`, {
    method: "POST",
    headers: {
      "X-User-Id": actorUserId.toString(),
    },
    body: payload,
  })
}

export async function getPendingInvites(
  actorUserId: number
): Promise<ProjectInvite[]> {
  return apiFetch<ProjectInvite[]>("project/invites/pending", {
    headers: {
      "X-User-Id": actorUserId.toString(),
    },
  })
}

export async function acceptInvite(
  inviteId: number,
  actorUserId: number
): Promise<ProjectInvite> {
  return apiFetch<ProjectInvite>(`project/invites/${inviteId}/accept`, {
    method: "POST",
    headers: {
      "X-User-Id": actorUserId.toString(),
    },
  })
}

export async function rejectInvite(
  inviteId: number,
  actorUserId: number
): Promise<ProjectInvite> {
  return apiFetch<ProjectInvite>(`project/invites/${inviteId}/reject`, {
    method: "POST",
    headers: {
      "X-User-Id": actorUserId.toString(),
    },
  })
}
