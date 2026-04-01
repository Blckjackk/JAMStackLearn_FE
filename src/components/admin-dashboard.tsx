import { useEffect, useState } from "react"

import { getSessionUser } from "@/lib/authSession"
import { getAdminDashboard } from "@/services/adminService"
import type { AdminDashboard } from "@/types/admin"

type State = {
  data: AdminDashboard | null
  loading: boolean
  error: string | null
}

export function AdminDashboard() {
  const [state, setState] = useState<State>({
    data: null,
    loading: true,
    error: null,
  })

  useEffect(() => {
    const sessionUser = getSessionUser()
    if (!sessionUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ data: null, loading: false, error: "Session user tidak ditemukan." })
      return
    }

    if (sessionUser.role.toLowerCase() !== "admin") {
      setState({ data: null, loading: false, error: "Halaman ini khusus admin." })
      return
    }

    let isActive = true
    setState({ data: null, loading: true, error: null })

    getAdminDashboard(sessionUser.id)
      .then((data) => {
        if (!isActive) {
          return
        }
        setState({ data, loading: false, error: null })
      })
      .catch((err) => {
        if (!isActive) {
          return
        }
        const message = err instanceof Error ? err.message : "Gagal memuat dashboard admin."
        setState({ data: null, loading: false, error: message })
      })

    return () => {
      isActive = false
    }
  }, [])

  if (state.loading) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <p className="text-sm text-slate-600">Memuat dashboard admin...</p>
      </div>
    )
  }

  if (state.error) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
        {state.error}
      </div>
    )
  }

  if (!state.data) {
    return null
  }

  return (
    <div className="grid gap-6">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
          Admin Overview
        </p>
        <h2 className="mt-2 font-serif text-2xl font-semibold text-slate-900">
          Kontrol workspace hari ini.
        </h2>
        <p className="mt-3 text-sm text-slate-600">
          Ringkasan total user, project, task, dan undangan.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Users</p>
          <div className="mt-2 text-3xl font-semibold text-slate-900">
            {state.data.usersCount}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Projects</p>
          <div className="mt-2 text-3xl font-semibold text-slate-900">
            {state.data.projectsCount}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Tasks</p>
          <div className="mt-2 text-3xl font-semibold text-slate-900">
            {state.data.tasksCount}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Invites</p>
          <div className="mt-2 text-3xl font-semibold text-slate-900">
            {state.data.invitesCount}
          </div>
        </div>
      </div>
    </div>
  )
}
