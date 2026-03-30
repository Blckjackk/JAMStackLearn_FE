import type { User } from "@/types"

const SESSION_KEY = "astro-app-auth-user"

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

    return parsed
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
