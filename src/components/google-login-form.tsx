import { useState } from "react"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"

import { savePendingSessionUser, saveSessionUser } from "@/lib/authSession"
import { auth } from "@/lib/firebase"
import { loginWithFirebase } from "@/services/userService"

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Unexpected error"
}

export function GoogleLoginForm() {
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

      // Jika sudah verifikasi OTP, langsung ke dashboard
      if (user.isOtpVerified) {
        saveSessionUser(user)
        setMessage(`Login berhasil. Selamat datang, ${user.username}.`)
        window.location.href = "/dashboard"
        return
      }

      // Jika belum verifikasi OTP, simpan ke pending dan redirect ke verify-otp
      savePendingSessionUser(user)
      setMessage("Redirecting to OTP verification...")
      window.location.href = "/verify-otp"
    } catch (error) {
      setMessage(`Login gagal: ${toErrorMessage(error)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8">
      <div className="grid w-full max-w-6xl gap-0 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl md:grid-cols-2">
        {/* Left Side - Image */}
        <div className="hidden md:relative md:flex md:items-center md:justify-center md:bg-gradient-to-br md:from-slate-50 md:to-slate-100">
          <img
            src="/auth-hero.jpg"
            alt="Login illustration"
            className="h-full w-full object-cover"
            loading="lazy"
            decoding="async"
          />
          {/* Fallback gradient overlay jika image belum load */}
          <div className="absolute inset-0 bg-gradient-to-br from-sky-400/20 to-emerald-400/20 mix-blend-multiply" />
        </div>

        {/* Right Side - Form */}
        <div className="flex items-center justify-center bg-white/95 p-6 backdrop-blur-sm sm:p-8 md:p-10">
          <div className="w-full max-w-sm">
            <div className="mb-8 space-y-2">
              <p className="text-xs font-semibold tracking-[0.24em] text-sky-600 uppercase">
                User Login
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Masuk ke Workspace
              </h1>
              <p className="pt-2 text-sm leading-6 text-slate-600">
                Setelah login, kamu hanya akan melihat project dan task milik
                akunmu.
              </p>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={() => void handleGoogleLogin()}
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition duration-200 hover:bg-slate-50 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                {loading ? "Memproses..." : "Continue with Google"}
              </button>

              <p className="text-center text-xs text-slate-500">
                Login menggunakan Google akan membuat akun baru jika belum ada.
              </p>
            </div>

            {message && (
              <div
                className={`mt-4 rounded-xl p-4 text-sm font-medium ${
                  message.includes("gagal")
                    ? "border border-red-200 bg-red-50 text-red-700"
                    : "border border-blue-200 bg-blue-50 text-blue-700"
                }`}
              >
                {message}
              </div>
            )}

            <p className="mt-8 text-center text-xs text-slate-600">
              Belum punya akun?{" "}
              <a
                href="#"
                className="font-semibold text-sky-600 hover:text-sky-700"
              >
                Hubungi admin
              </a>
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
