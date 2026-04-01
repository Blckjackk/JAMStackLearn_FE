import { useEffect, useMemo, useRef, useState } from "react"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth"

import { saveSessionUser } from "@/lib/authSession"
import { auth } from "@/lib/firebase"
import { loginWithFirebase } from "@/services/userService"
import { sendOtp, verifyOtp } from "@/services/otpService"

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Unexpected error"
}

export function LoginForm() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [otpStep, setOtpStep] = useState<"phone" | "code">("phone")
  const [phoneInput, setPhoneInput] = useState("")
  const [otpDigits, setOtpDigits] = useState<string[]>(
    Array.from({ length: 6 }, () => "")
  )
  const [otpMessage, setOtpMessage] = useState<string | null>(null)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [resendSeconds, setResendSeconds] = useState(0)
  const inputRefs = useRef<Array<HTMLInputElement | null>>([])

  const normalizedPhone = useMemo(() => {
    const digits = phoneInput.replace(/\D/g, "")
    const withoutCountry = digits.startsWith("62") ? digits.slice(2) : digits
    const trimmed = withoutCountry.replace(/^0+/, "")
    return trimmed.length ? `+62${trimmed}` : ""
  }, [phoneInput])

  const isPhoneValid = useMemo(() => {
    const digits = normalizedPhone.replace(/\D/g, "")
    return digits.length >= 10 && digits.length <= 15
  }, [normalizedPhone])

  useEffect(() => {
    if (resendSeconds <= 0) {
      return
    }

    const timer = window.setInterval(() => {
      setResendSeconds((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => window.clearInterval(timer)
  }, [resendSeconds])

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

  async function handleSendOtp() {
    if (!isPhoneValid) {
      setOtpMessage("Nomor HP belum valid.")
      return
    }

    setOtpMessage(null)
    setSendingOtp(true)

    try {
      await sendOtp(normalizedPhone)
      setOtpStep("code")
      setOtpDigits(Array.from({ length: 6 }, () => ""))
      setResendSeconds(60)
      inputRefs.current[0]?.focus()
    } catch (error) {
      setOtpMessage(`Gagal kirim OTP: ${toErrorMessage(error)}`)
    } finally {
      setSendingOtp(false)
    }
  }

  async function handleVerifyOtp() {
    const code = otpDigits.join("")
    if (code.length < 6) {
      setOtpMessage("Lengkapi 6 digit OTP dulu.")
      return
    }

    setOtpMessage(null)
    setVerifyingOtp(true)

    try {
      await verifyOtp(normalizedPhone, code)
      setOtpMessage("OTP valid. Silakan lanjutkan.")
    } catch (error) {
      setOtpMessage(`OTP gagal: ${toErrorMessage(error)}`)
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

      <div className="mt-8">
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-slate-200" />
          <span className="text-[0.7rem] font-semibold tracking-[0.3em] text-slate-400 uppercase">
            OTP WhatsApp
          </span>
          <span className="h-px flex-1 bg-slate-200" />
        </div>
        <div className="mt-5 space-y-4">
          {otpStep === "phone" ? (
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-500 uppercase">
                Nomor WhatsApp
              </label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2">
                <span className="text-sm font-semibold text-slate-700">
                  +62
                </span>
                <input
                  value={phoneInput}
                  onChange={(event) => setPhoneInput(event.target.value)}
                  inputMode="numeric"
                  placeholder="81234567890"
                  className="w-full bg-transparent text-sm text-slate-900 outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => void handleSendOtp()}
                disabled={sendingOtp}
                className="flex w-full items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendingOtp ? "Mengirim OTP..." : "Kirim OTP"}
              </button>
            </div>
          ) : (
            <div className="space-y-4" onPaste={handlePaste}>
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>Kode dikirim ke {normalizedPhone}</span>
                <button
                  type="button"
                  onClick={() => void handleSendOtp()}
                  disabled={resendSeconds > 0 || sendingOtp}
                  className="font-semibold text-slate-700 disabled:cursor-not-allowed disabled:text-slate-400"
                >
                  {resendSeconds > 0 ? `Resend ${resendSeconds}s` : "Resend"}
                </button>
              </div>
              <div className="flex justify-between gap-2">
                {otpDigits.map((digit, index) => (
                  <input
                    key={`otp-${index}`}
                    ref={(el) => {
                      inputRefs.current[index] = el
                    }}
                    value={digit}
                    onChange={(event) =>
                      handleDigitChange(index, event.target.value)
                    }
                    onKeyDown={(event) => handleDigitKeyDown(index, event)}
                    inputMode="numeric"
                    maxLength={1}
                    className="h-11 w-11 rounded-xl border border-slate-300 text-center text-lg font-semibold text-slate-900 outline-none focus:border-slate-700"
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() => void handleVerifyOtp()}
                disabled={verifyingOtp}
                className="flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {verifyingOtp ? "Memverifikasi..." : "Verifikasi OTP"}
              </button>
              <button
                type="button"
                onClick={() => setOtpStep("phone")}
                className="w-full text-xs font-semibold text-slate-500"
              >
                Ganti nomor
              </button>
            </div>
          )}
        </div>
      </div>

      {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
      {otpMessage && (
        <p className="mt-3 text-sm text-slate-600">{otpMessage}</p>
      )}
    </section>
  )
}
