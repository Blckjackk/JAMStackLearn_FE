import { useState, type FormEvent } from "react"

import { saveSessionUser } from "@/lib/authSession"
import { loginUser } from "@/services/userService"
import type { LoginUserInput } from "@/types"

const initialForm: LoginUserInput = {
  email: "",
  password: "",
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Unexpected error"
}

export function LoginForm() {
  const [form, setForm] = useState<LoginUserInput>(initialForm)
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage(null)

    try {
      if (!form.email.trim() || !form.password.trim()) {
        throw new Error("Email dan password wajib diisi.")
      }

      const user = await loginUser({
        email: form.email.trim(),
        password: form.password,
      })

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

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-2">
          <label className="text-sm text-slate-600">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                email: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 ring-sky-300 outline-none focus:ring"
            placeholder="nama@email.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm text-slate-600">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={(event) =>
              setForm((previous) => ({
                ...previous,
                password: event.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 ring-sky-300 outline-none focus:ring"
            placeholder="Password"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-sky-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Memproses..." : "Login"}
        </button>
      </form>

      {message && <p className="mt-4 text-sm text-slate-600">{message}</p>}
    </section>
  )
}
