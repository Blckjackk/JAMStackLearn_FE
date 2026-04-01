import { useEffect, useState } from "react"

import { getSessionUser, saveSessionUser } from "@/lib/authSession"
import { updateUserProfile } from "@/services/userService"

export function ProfileForm() {
  const [username, setUsername] = useState("")
  const [email, setEmail] = useState("")
  const [userId, setUserId] = useState<number | null>(null)
  const [status, setStatus] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    const sessionUser = getSessionUser()
    if (!sessionUser) {
      setError("Session user tidak ditemukan. Silakan login ulang.")
      return
    }

    setUserId(sessionUser.id)
    setUsername(sessionUser.username)
    setEmail(sessionUser.email)
  }, [])

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setStatus(null)

    if (!userId) {
      setError("Session user tidak ditemukan.")
      return
    }

    if (!username.trim()) {
      setError("Nama wajib diisi.")
      return
    }

    setIsSaving(true)
    try {
      const updated = await updateUserProfile(userId, {
        username: username.trim(),
      })

      saveSessionUser(updated)
      setStatus("Profil berhasil diperbarui.")
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Gagal update profile."
      setError(message)
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-4">
      <div className="grid gap-2">
        <label className="text-xs font-semibold tracking-[0.28em] text-slate-500 uppercase">
          Nama
        </label>
        <input
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          placeholder="Nama kamu"
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition outline-none focus:border-slate-400"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-xs font-semibold tracking-[0.28em] text-slate-500 uppercase">
          Email
        </label>
        <input
          value={email}
          readOnly
          className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500"
        />
      </div>
      {status ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs text-emerald-700">
          {status}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-xs text-rose-700">
          {error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={isSaving}
        className="inline-flex items-center justify-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isSaving ? "Menyimpan..." : "Simpan Profile"}
      </button>
    </form>
  )
}
