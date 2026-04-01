import { useEffect, useMemo, useState } from "react"

import { getSessionUser } from "@/lib/authSession"
import { getProjects } from "@/services/projectService"
import type { Project } from "@/types"

type SummaryState = {
  projects: Project[]
  loading: boolean
  error: string | null
}

function formatCount(value: number): string {
  return value === 1 ? "1 project" : `${value} projects`
}

export function ProfileSummary() {
  const [userName, setUserName] = useState("")
  const [userCode, setUserCode] = useState("")
  const [email, setEmail] = useState("")
  const [state, setState] = useState<SummaryState>({
    projects: [],
    loading: true,
    error: null,
  })

  useEffect(() => {
    const sessionUser = getSessionUser()
    if (!sessionUser) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({
        projects: [],
        loading: false,
        error: "Session user tidak ditemukan.",
      })
      return
    }

    setUserName(sessionUser.username)
    setUserCode(sessionUser.userCode)
    setEmail(sessionUser.email)

    let isActive = true
    setState((prev) => ({ ...prev, loading: true, error: null }))

    getProjects(sessionUser.id)
      .then((projects) => {
        if (!isActive) {
          return
        }
        setState({ projects, loading: false, error: null })
      })
      .catch((err) => {
        if (!isActive) {
          return
        }
        const message =
          err instanceof Error ? err.message : "Gagal memuat project."
        setState({ projects: [], loading: false, error: message })
      })

    return () => {
      isActive = false
    }
  }, [])

  const projectCount = useMemo(
    () => formatCount(state.projects.length),
    [state.projects.length]
  )
  const spotlight = state.projects.slice(0, 3)

  return (
    <div className="grid gap-4">
      <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200/80">
        <span className="font-semibold text-slate-100">
          {userName || "User"}
        </span>
        <span className="mx-2 text-slate-400">•</span>
        <span>{email || "email belum ada"}</span>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200/80">
          User code: <span className="text-slate-100">{userCode || "-"}</span>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200/80">
          {state.loading ? "Memuat project..." : projectCount}
        </div>
      </div>

      {state.error ? (
        <div className="rounded-2xl border border-rose-200/30 bg-rose-500/10 px-4 py-3 text-xs text-rose-100">
          {state.error}
        </div>
      ) : null}

      {!state.loading && spotlight.length > 0 ? (
        <div className="grid gap-2">
          <p className="text-xs font-semibold tracking-[0.28em] text-amber-200 uppercase">
            Project Terbaru
          </p>
          {spotlight.map((project) => (
            <a
              key={project.id}
              href={`/projects/${project.id}`}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 transition hover:-translate-y-0.5 hover:bg-white/10"
            >
              <div className="font-semibold">{project.name}</div>
              <div className="mt-1 text-xs text-slate-300/80">
                Role: {project.userRole || "member"}
              </div>
            </a>
          ))}
        </div>
      ) : null}

      {!state.loading && spotlight.length === 0 && !state.error ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-slate-200/80">
          Belum ada project aktif. Buat project pertama kamu di Dashboard.
        </div>
      ) : null}
    </div>
  )
}
