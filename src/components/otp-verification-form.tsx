import { useEffect, useRef, useState } from "react"

import { clearPendingSessionUser, getPendingSessionUser, saveSessionUser } from "@/lib/authSession"
import { sendOtp, verifyOtp } from "@/services/otpService"
import type { User } from "@/types"

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Unexpected error"
}

export function OtpVerificationForm() {
  const [pendingUser, setPendingUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone")
  const [phoneInput, setPhoneInput] = useState("")
  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array.from({ length: 6 }, () => "")
  )
  const [message, setMessage] = useState<string | null>(null)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [resendSeconds, setResendSeconds] = useState(0)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  // Load pending user from session
  useEffect(() => {
    const user = getPendingSessionUser()
    if (!user) {
      setMessage("Session expired. Silakan login ulang.")
      window.location.href = "/login"
      return
    }

    setPendingUser(user)
    setPhoneInput(user.phoneNumber || "")
    setLoading(false)
  }, [])

  // Resend timer
  useEffect(() => {
    if (resendSeconds <= 0) {
      return
    }

    const timer = window.setInterval(() => {
      setResendSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [resendSeconds])

  const normalizedPhone = phoneInput.replace(/\D/g, "")
    ? `+62${phoneInput.replace(/\D/g, "").replace(/^62/, "").replace(/^0+/, "")}`
    : ""

  const isPhoneValid = (() => {
    const digits = normalizedPhone.replace(/\D/g, "")
    return digits.length >= 10 && digits.length <= 15
  })()

  async function handleSendOtp() {
    if (!pendingUser) {
      setMessage("Session expired. Silakan login ulang.")
      window.location.href = "/login"
      return
    }

    if (!isPhoneValid) {
      setMessage("Nomor HP belum valid.")
      return
    }

    setMessage(null)
    setSendingOtp(true)

    try {
      await sendOtp(normalizedPhone)
      setOtpStep("code")
      setOtpDigits(Array.from({ length: 6 }, () => ""))
      setResendSeconds(60)
      inputRefs.current[0]?.focus()
      setMessage("OTP sudah dikirim via WhatsApp. Cek pesan Anda.")
    } catch (error) {
      setMessage(`Gagal kirim OTP: ${toErrorMessage(error)}`)
    } finally {
      setSendingOtp(false)
    }
  }

  async function handleVerifyOtp() {
    if (!pendingUser) {
      setMessage("Session expired. Silakan login ulang.")
      window.location.href = "/login"
      return
    }

    const code = otpDigits.join("")
    if (code.length < 6) {
      setMessage("Lengkapi 6 digit OTP dulu.")
      return
    }

    setMessage(null)
    setVerifyingOtp(true)

    try {
      const response = await verifyOtp(normalizedPhone, code, pendingUser.id)
      if (response.user) {
        // Verify berhasil, simpan user dan redirect ke dashboard
        saveSessionUser(response.user)
        clearPendingSessionUser()
        setMessage("OTP valid. Login berhasil!")
        window.location.href = "/dashboard"
        return
      }

      setMessage("OTP valid. Silakan lanjutkan.")
    } catch (error) {
      setMessage(`OTP gagal: ${toErrorMessage(error)}`)
    } finally {
      setVerifyingOtp(false)
    }
  }

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, "").slice(-1)
    setOtpDigits((prev) => {
      const next = [...prev]
      next[index] = digit
      return next
    })

    if (digit && index < inputRefs.current.length - 1) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  function handleDigitKeyDown(
    index: number,
    event: React.KeyboardEvent<HTMLInputElement>
  ) {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus()
    }
  }

  function handlePaste(event: React.ClipboardEvent<HTMLDivElement>) {
    const text = event.clipboardData.getData("text")
    const digits = text.replace(/\D/g, "").slice(0, 6).split("")
    if (digits.length === 0) {
      return
    }

    event.preventDefault()
    setOtpDigits((prev) => {
      const next = [...prev]
      digits.forEach((digit, idx) => {
        next[idx] = digit
      })
      return next
    })

    const nextIndex = Math.min(digits.length, inputRefs.current.length - 1)
    inputRefs.current[nextIndex]?.focus()
  }

  function handleBackToLogin() {
    clearPendingSessionUser()
    window.location.href = "/login"
  }

  if (loading) {
    return (
      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8">
        <div className="w-full max-w-6xl grid gap-0 md:grid-cols-2 rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-xl">
          <div className="hidden md:flex md:items-center md:justify-center md:bg-gradient-to-br md:from-slate-100 md:to-slate-200">
            <div className="text-center text-slate-600">
              <p className="text-sm font-medium">Loading...</p>
            </div>
          </div>
          <div className="flex items-center justify-center p-6 sm:p-8 md:p-10 bg-white/95 backdrop-blur-sm">
            <p className="text-sm text-slate-600">Memuat data...</p>
          </div>
        </div>
      </section>
    )
  }

  if (!pendingUser) {
    return (
      <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8">
        <div className="w-full max-w-6xl grid gap-0 md:grid-cols-2 rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-xl">
          <div className="hidden md:flex md:items-center md:justify-center md:bg-gradient-to-br md:from-red-50 md:to-red-100">
            <div className="text-center">
              <p className="text-red-600 font-semibold">Session Expired</p>
            </div>
          </div>
          <div className="flex items-center justify-center p-6 sm:p-8 md:p-10 bg-white/95 backdrop-blur-sm">
            <div className="w-full max-w-sm space-y-4">
              <p className="text-sm font-medium text-red-600">
                Session telah expired. Silakan login ulang.
              </p>
              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-sky-700 active:bg-sky-800"
              >
                Kembali ke Login
              </button>
            </div>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="flex min-h-screen items-center justify-center px-4 py-8 sm:px-8">
      <div className="w-full max-w-6xl grid gap-0 md:grid-cols-2 rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-xl">
        {/* Left Side - Image */}
        <div className="hidden md:flex md:items-center md:justify-center md:bg-gradient-to-br md:from-slate-50 md:to-slate-100 md:relative">
          <img
            src="/auth-hero.jpg"
            alt="OTP verification illustration"
            className="w-full h-full object-cover"
            loading="lazy"
            decoding="async"
          />
          {/* Fallback gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-sky-400/20 mix-blend-multiply" />
        </div>

        {/* Right Side - Form */}
        <div className="flex items-center justify-center p-6 sm:p-8 md:p-10 bg-white/95 backdrop-blur-sm">
          <div className="w-full max-w-sm">
            <div className="space-y-2 mb-8">
              <p className="text-xs font-semibold tracking-[0.24em] text-emerald-600 uppercase">
                OTP Verification
              </p>
              <h1 className="text-4xl font-bold tracking-tight text-slate-900">
                Verifikasi Akun
              </h1>
              <p className="text-sm leading-6 text-slate-600 pt-2">
                Masukkan nomor WhatsApp dan kode OTP untuk menyelesaikan verifikasi.
              </p>
            </div>

            {/* User Info Card */}
            <div className="mb-6 rounded-xl bg-gradient-to-r from-sky-50 to-emerald-50 p-4 border border-sky-200/50">
              <p className="text-sm font-bold text-slate-900">{pendingUser.username}</p>
              <p className="text-xs text-slate-600">{pendingUser.email}</p>
            </div>

            <div className="space-y-4">
              {otpStep === "phone" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase">
                      📱 Nomor WhatsApp
                    </label>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/20 transition">
                      <span className="text-sm font-semibold text-slate-600">
                        +62
                      </span>
                      <input
                        value={phoneInput}
                        onChange={(event) => setPhoneInput(event.target.value)}
                        inputMode="numeric"
                        placeholder="81234567890"
                        className="w-full bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
                      />
                    </div>
                    <p className="text-xs text-slate-500">
                      Gunakan nomor WhatsApp yang terdaftar
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleSendOtp()}
                    disabled={sendingOtp || !isPhoneValid}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-sky-700 active:bg-sky-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>{sendingOtp ? "Mengirim..." : "📨 Kirim OTP"}</span>
                  </button>
                </div>
              ) : null}

              {otpStep === "code" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-700 uppercase">
                      🔐 Kode OTP (6 Digit)
                    </label>
                    <p className="text-xs text-slate-500">Masukkan kode yang dikirim ke WhatsApp</p>
                  </div>
                  <div
                    className="flex justify-center gap-2 bg-slate-50 p-4 rounded-lg"
                    onPaste={(event) => handlePaste(event)}
                  >
                    {otpDigits.map((digit, index) => (
                      <input
                        key={index}
                        ref={(el) => {
                          if (el) inputRefs.current[index] = el
                        }}
                        type="text"
                        value={digit}
                        onChange={(event) => handleDigitChange(index, event.target.value)}
                        onKeyDown={(event) => handleDigitKeyDown(index, event)}
                        maxLength={1}
                        inputMode="numeric"
                        className="h-14 w-12 rounded-lg border-2 border-slate-300 bg-white text-center text-xl font-bold text-slate-900 outline-none transition duration-200 focus:border-sky-500 focus:ring-2 focus:ring-sky-500/20 hover:border-slate-400"
                      />
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => void handleVerifyOtp()}
                    disabled={verifyingOtp || otpDigits.join("").length < 6}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition duration-200 hover:bg-emerald-700 active:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <span>{verifyingOtp ? "Memverifikasi..." : "✓ Verifikasi OTP"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOtpStep("phone")
                      setOtpDigits(Array.from({ length: 6 }, () => ""))
                      setResendSeconds(0)
                    }}
                    disabled={resendSeconds > 0}
                    className="flex w-full items-center justify-center rounded-lg border-2 border-slate-300 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition duration-200 hover:bg-slate-50 active:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {resendSeconds > 0 ? `Kirim ulang dalam ${resendSeconds}s` : "🔄 Kirim Ulang OTP"}
                  </button>
                </div>
              ) : null}

              {message && (
                <div className={`rounded-lg p-4 text-sm font-medium border-l-4 ${
                  message.includes("expired") || message.includes("gagal") || message.includes("belum valid")
                    ? "bg-red-50 text-red-700 border-red-400"
                    : message.includes("dikirim")
                      ? "bg-blue-50 text-blue-700 border-blue-400"
                      : message.includes("valid") || message.includes("berhasil")
                        ? "bg-green-50 text-green-700 border-green-400"
                        : "bg-slate-50 text-slate-700 border-slate-400"
                }`}>
                  {message}
                </div>
              )}

              <button
                type="button"
                onClick={handleBackToLogin}
                className="w-full rounded-lg border-2 border-slate-300 bg-transparent px-4 py-3 text-sm font-semibold text-slate-700 transition duration-200 hover:bg-slate-50 active:bg-slate-100"
              >
                ← Kembali ke Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
