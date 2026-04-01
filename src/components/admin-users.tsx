import { useEffect, useState } from "react"

import { getSessionUser } from "@/lib/authSession"
import { getUsers } from "@/services/userService"
import type { User } from "@/types"

type State = {
  users: User[]
  loading: boolean
  error: string | null
}

export function AdminUsers() {
  const [state, setState] = useState<State>({
    users: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    const sessionUser = getSessionUser()
    if (!sessionUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ users: [], loading: false, error: "Session user tidak ditemukan." })
      return
    }

    if (sessionUser.role.toLowerCase() !== "admin") {
      setState({ users: [], loading: false, error: "Halaman ini khusus admin." })
      return
    }

    let isActive = true
    setState({ users: [], loading: true, error: null })

    getUsers()
      .then((users) => {
        if (!isActive) {
          return
        }
        setState({ users, loading: false, error: null })
      })
      .catch((err) => {
        if (!isActive) {
          return
        }
        const message = err instanceof Error ? err.message : "Gagal memuat user."
        setState({ users: [], loading: false, error: message })
      })

    return () => {
      isActive = false
    }
  }, [])

  if (state.loading) {
    return <p className="text-sm text-slate-600">Memuat data user...</p>
  }

  if (state.error) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
        {state.error}
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {state.users.map((user) => (
        <div
          key={user.id}
          className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 text-sm text-slate-700 shadow-sm"
        >
          <div>
            <div className="font-semibold text-slate-900">{user.username}</div>
            <div className="text-xs text-slate-500">{user.email}</div>
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
            {user.role}
          </div>
        </div>
      ))}
    </div>
  )
}
