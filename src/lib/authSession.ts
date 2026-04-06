import type { User } from "@/types"

const SESSION_KEY = "astro-app-auth-user"
const PENDING_USER_KEY = "astro-app-pending-user"

function canUseStorage(): boolean {
  return (
    typeof window !== "undefined" && typeof window.localStorage !== "undefined"
  )
}

export function getSessionUser(): User | null {
  if (!canUseStorage()) {
    return null
  }

  const raw = window.localStorage.getItem(SESSION_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as User
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.id !== "number" ||
      typeof parsed.username !== "string" ||
      typeof parsed.email !== "string"
    ) {
      return null
    }

    return {
      ...parsed,
      userCode: typeof parsed.userCode === "string" ? parsed.userCode : "",
      role: typeof parsed.role === "string" ? parsed.role : "Developer",
      phoneNumber: typeof parsed.phoneNumber === "string" ? parsed.phoneNumber : "",
      isOtpVerified: typeof parsed.isOtpVerified === "boolean" ? parsed.isOtpVerified : false,
    }
  } catch {
    return null
  }
}

export function saveSessionUser(user: User): void {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(SESSION_KEY, JSON.stringify(user))
}

export function clearSessionUser(): void {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.removeItem(SESSION_KEY)
}

export function getPendingSessionUser(): User | null {
  if (!canUseStorage()) {
    return null
  }

  const raw = window.localStorage.getItem(PENDING_USER_KEY)
  if (!raw) {
    return null
  }

  try {
    const parsed = JSON.parse(raw) as User
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.id !== "number" ||
      typeof parsed.username !== "string" ||
      typeof parsed.email !== "string"
    ) {
      return null
    }

    return {
      ...parsed,
      userCode: typeof parsed.userCode === "string" ? parsed.userCode : "",
      role: typeof parsed.role === "string" ? parsed.role : "Developer",
      phoneNumber: typeof parsed.phoneNumber === "string" ? parsed.phoneNumber : "",
      isOtpVerified: typeof parsed.isOtpVerified === "boolean" ? parsed.isOtpVerified : false,
    }
  } catch {
    return null
  }
}

export function savePendingSessionUser(user: User): void {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.setItem(PENDING_USER_KEY, JSON.stringify(user))
}

export function clearPendingSessionUser(): void {
  if (!canUseStorage()) {
    return
  }

  window.localStorage.removeItem(PENDING_USER_KEY)
}
