import type { CreateUserInput, User } from "@/types"
import { apiFetch } from "./api"

export async function getUsers(): Promise<User[]> {
  return apiFetch<User[]>("user")
}

export async function getUser(id: number): Promise<User> {
  return apiFetch<User>(`user/${id}`)
}

export async function createUser(payload: CreateUserInput): Promise<User> {
  return apiFetch<User>("user", {
    method: "POST",
    body: payload,
  })
}
