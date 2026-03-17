import type {
  CreateTaskInput,
  TaskItem,
  TaskTag,
  UpdateTaskInput,
} from "@/types"
import { apiFetch } from "./api"

export async function getAvailableTags(): Promise<TaskTag[]> {
  return apiFetch<TaskTag[]>("tag")
}

export async function getTasksByProject(
  projectId: number
): Promise<TaskItem[]> {
  return apiFetch<TaskItem[]>(`task/project/${projectId}`)
}

export async function createTask(payload: CreateTaskInput): Promise<TaskItem> {
  return apiFetch<TaskItem>("task", {
    method: "POST",
    body: payload,
  })
}

export async function updateTask(
  taskId: number,
  payload: UpdateTaskInput
): Promise<void> {
  return apiFetch<void>(`task/${taskId}`, {
    method: "PUT",
    body: payload,
  })
}
