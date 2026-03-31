import { useState } from "react"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"

import { saveSessionUser } from "@/lib/authSession"
import { auth } from "@/lib/firebase"
import { loginWithFirebase } from "@/services/userService"

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Unexpected error"
}

export function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleGoogleLogin() {
    setLoading(true)
    setMessage(null)

    try {
      const provider = new GoogleAuthProvider()
      const result = await signInWithPopup(auth, provider)
      const token = await result.user.getIdToken()

      const user = await loginWithFirebase(token)
      saveSessionUser(user)
      setMessage(`Login berhasil. Selamat datang, ${user.username}.`)
      window.location.href = "/dashboard"
    } catch (error) {
      setMessage(`Login gagal: ${toErrorMessage(error)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="mx-auto w-full max-w-md rounded-3xl border border-slate-300/60 bg-white/85 p-6 shadow-sm backdrop-blur sm:p-8">
      <p className="text-xs font-semibold tracking-[0.24em] text-sky-700 uppercase">
        User Login
      </p>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        Masuk ke Workspace Tugas
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Setelah login, kamu hanya akan melihat project dan task milik akunmu.
      </p>

      <div className="mt-6 space-y-4">
        <button
          type="button"
          onClick={() => void handleGoogleLogin()}
          disabled={loading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Login with Google"}
        </button>
        <p className="text-xs text-slate-500">
          Login menggunakan Google akan membuat akun baru jika belum ada.
        </p>
      </div>

      {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
    </section>
  )
}
