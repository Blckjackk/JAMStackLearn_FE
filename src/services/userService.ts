import type { CreateUserInput, LoginUserInput, User } from "@/types"
import { apiFetch } from "./api"

type FirebaseLoginResponse = {
  success: boolean
  message: string
  user?: {
    id: number
    firebaseUid: string
    email: string
    name: string
    userCode: string
  }
}

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

export async function loginUser(payload: LoginUserInput): Promise<User> {
  return apiFetch<User>("user/login", {
    method: "POST",
    body: payload,
  })
}

export async function loginWithFirebase(token: string): Promise<User> {
  const response = await apiFetch<FirebaseLoginResponse>("auth/firebase", {
    method: "POST",
    body: { token },
  })

  if (!response.success || !response.user) {
    throw new Error(response.message || "Firebase login failed.")
  }

  return {
    id: response.user.id,
    username: response.user.name || response.user.email.split("@")[0],
    email: response.user.email,
    userCode: response.user.userCode,
  }
}
