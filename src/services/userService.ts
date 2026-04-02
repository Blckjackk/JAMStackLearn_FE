import type {
  CreateUserInput,
  LoginUserInput,
  UpdateUserProfileInput,
  User,
} from "@/types"
import { apiFetch } from "./api"

type FirebaseLoginResponse = {
  success: boolean
  message?: string
  user?: {
    id: number
    firebaseUid?: string
    email: string
    name?: string
    userCode?: string
    role?: string
    phoneNumber?: string
    isOtpVerified?: boolean
  }
}

type FirebaseLoginPayload = FirebaseLoginResponse | User

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

export async function updateUserProfile(
  userId: number,
  payload: UpdateUserProfileInput
): Promise<User> {
  return apiFetch<User>("user/profile", {
    method: "PUT",
    headers: {
      "X-User-Id": String(userId),
    },
    body: payload,
  })
}

export async function loginWithFirebase(token: string): Promise<User> {
  const response = await apiFetch<FirebaseLoginPayload>("auth/firebase", {
    method: "POST",
    body: { token },
  })

  if ("success" in response) {
    if (!response.success || !response.user) {
      throw new Error(response.message || "Firebase login failed.")
    }

    return {
      id: response.user.id,
      username: response.user.name || response.user.email.split("@")[0],
      email: response.user.email,
      userCode: response.user.userCode || "",
      role: response.user.role || "Developer",
      phoneNumber: response.user.phoneNumber || "",
      isOtpVerified: response.user.isOtpVerified ?? false,
    }
  }

  return {
    id: response.id,
    username: response.username,
    email: response.email,
    userCode: response.userCode || "",
    role: response.role || "Developer",
    phoneNumber: response.phoneNumber || "",
    isOtpVerified: response.isOtpVerified ?? false,
  }
}
