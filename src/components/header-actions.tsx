import { useState } from "react"

import { clearSessionUser, getSessionUser } from "@/lib/authSession"
import { auth } from "@/lib/firebase"
import { signOut } from "firebase/auth"

export function HeaderActions() {
  const [isSigningOut, setIsSigningOut] = useState(false)

  async function handleLogout() {
    if (isSigningOut) {
      return
    }

    setIsSigningOut(true)
    const sessionUser = getSessionUser()
    clearSessionUser()

    try {
      if (sessionUser) {
        await signOut(auth)
      }
    } catch {
      // Ignore Firebase logout errors and still redirect.
    } finally {
      window.location.href = "/login"
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={isSigningOut}
      className="rounded-full border border-slate-200 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isSigningOut ? "Keluar..." : "Keluar"}
    </button>
  )
}
