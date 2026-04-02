import { useCallback, useEffect, useState } from "react"

import { getSessionUser } from "@/lib/authSession"
import { createProject, getProjects } from "@/services/projectService"
import { getUser } from "@/services/userService"
import type { CreateProjectInput, Project, User } from "@/types"

const initialProjectForm: CreateProjectInput = {
  name: "",
  description: "",
}

function formatDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return "Unknown"
  }

  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Unexpected error"
}

export function UserProjectDashboard() {
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  const [projects, setProjects] = useState<Project[]>([])
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)

  const [globalError, setGlobalError] = useState<string | null>(null)
  const [projectMessage, setProjectMessage] = useState<string | null>(null)
  const [projectForm, setProjectForm] =
    useState<CreateProjectInput>(initialProjectForm)

  const refreshProjects = useCallback(async (userId: number) => {
    setLoadingProjects(true)
    setGlobalError(null)

    try {
      const response = await getProjects(userId)
      setProjects(response)
    } catch (error) {
      setProjects([])
      setGlobalError(`Gagal memuat project: ${toErrorMessage(error)}`)
    } finally {
      setLoadingProjects(false)
    }
  }, [])

  useEffect(() => {
    let isActive = true

    async function verifySession() {
      const sessionUser = getSessionUser()
      if (!sessionUser) {
        window.location.href = "/login"
        return
      }

      try {
        const freshUser = await getUser(sessionUser.id)
        if (!isActive) {
          return
        }

        setAuthenticatedUser({
          ...freshUser,
          userCode: sessionUser.userCode || freshUser.userCode || "",
          role: sessionUser.role || freshUser.role || "Developer",
        })
      } catch (error) {
        if (!isActive) {
          return
        }

        setAuthenticatedUser(sessionUser)
        setGlobalError(
          `Sesi lokal ditemukan, tapi backend tidak bisa diverifikasi: ${toErrorMessage(error)}`
        )
      } finally {
        if (isActive) {
          setCheckingSession(false)
        }
      }
    }

    void verifySession()

    return () => {
      isActive = false
    }
  }, [])

  useEffect(() => {
    if (!authenticatedUser) {
      return
    }

    void refreshProjects(authenticatedUser.id)
  }, [authenticatedUser, refreshProjects])

  async function handleCreateProject(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreatingProject(true)
    setProjectMessage(null)

    try {
      if (!authenticatedUser) {
        throw new Error("Session user tidak ditemukan.")
      }

      if (!projectForm.name.trim()) {
        throw new Error("Project name is required.")
      }

      const created = await createProject(authenticatedUser.id, {
        name: projectForm.name.trim(),
        description: projectForm.description?.trim() || undefined,
      })

      setProjectForm(initialProjectForm)
      setProjectMessage(`Project ${created.name} berhasil dibuat.`)
      await refreshProjects(authenticatedUser.id)
    } catch (error) {
      setProjectMessage(`Gagal membuat project: ${toErrorMessage(error)}`)
    } finally {
      setCreatingProject(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-10">
        <p className="text-sm text-slate-600">Checking session...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_12%_10%,rgba(20,184,166,0.18),transparent_30%),radial-gradient(circle_at_80%_10%,rgba(56,189,248,0.16),transparent_28%),linear-gradient(180deg,#f8fafc_0%,#ecfeff_52%,#f8fafc_100%)]">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 lg:px-10 lg:py-14">
        <section className="rounded-3xl border border-slate-300/60 bg-white/85 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.24em] text-teal-700 uppercase">
                Ruang Kerja Pribadi
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Halo, {authenticatedUser?.username}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Kelola project dan undangan kamu di sini.
              </p>
              <p className="mt-1 text-sm text-slate-600">
                User code kamu: {authenticatedUser?.userCode || "-"}
              </p>
            </div>
            <a
              href="/invites"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Lihat undangan
            </a>
          </div>
        </section>

        {globalError && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {globalError}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-2">
          <article className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm">
            <p className="text-xs tracking-wider text-slate-500 uppercase">
              Project
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {projects.length}
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm">
            <p className="text-xs tracking-wider text-slate-500 uppercase">
              Aksi
            </p>
            <p className="mt-2 text-lg font-semibold text-slate-900">
              Pilih project untuk buka task
            </p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleCreateProject}
            className="space-y-4 rounded-3xl border border-slate-300/60 bg-white p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold text-slate-900">
              Buat project
            </h2>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Nama project</label>
              <input
                value={projectForm.name}
                onChange={(event) =>
                  setProjectForm((previous) => ({
                    ...previous,
                    name: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 ring-teal-300 outline-none focus:ring"
                placeholder="Website revamp"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Deskripsi</label>
              <textarea
                value={projectForm.description}
                onChange={(event) =>
                  setProjectForm((previous) => ({
                    ...previous,
                    description: event.target.value,
                  }))
                }
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 ring-teal-300 outline-none focus:ring"
                placeholder="Scope dan tujuan"
              />
            </div>
            <button
              type="submit"
              disabled={creatingProject}
              className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingProject ? "Membuat project..." : "Buat project"}
            </button>
            {projectMessage && (
              <p className="text-sm text-slate-600">{projectMessage}</p>
            )}
          </form>
          <div className="space-y-6">
            <article className="rounded-3xl border border-slate-300/60 bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-slate-900">
                Undangan masuk project
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                Kelola undangan masuk di halaman khusus agar lebih rapi.
              </p>
              <a
                href="/invites"
                className="mt-4 inline-flex items-center justify-center rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Buka halaman undangan
              </a>
            </article>
          </div>

          <article className="rounded-3xl border border-slate-300/60 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">
                Daftar Project
              </h3>
              <button
                type="button"
                onClick={() =>
                  authenticatedUser &&
                  void refreshProjects(authenticatedUser.id)
                }
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
              >
                {loadingProjects ? "Memuat..." : "Muat ulang"}
              </button>
            </div>
            <div className="max-h-96 overflow-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Project</th>
                    <th className="px-3 py-2">Created</th>
                    <th className="px-3 py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3 text-slate-500" colSpan={3}>
                        {loadingProjects
                          ? "Loading projects..."
                          : "Belum ada project."}
                      </td>
                    </tr>
                  ) : (
                    projects.map((project) => (
                      <tr
                        key={project.id}
                        className="border-t border-slate-200 odd:bg-white even:bg-slate-50/40"
                      >
                        <td className="px-3 py-2">
                          <p className="font-medium text-slate-900">
                            {project.name}
                          </p>
                          <p className="text-xs text-slate-600">
                            {project.description || "Belum ada deskripsi"}
                          </p>
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {formatDate(project.createdAt)}
                        </td>
                        <td className="px-3 py-2">
                          <a
                            href={`/tasks?projectId=${project.id}`}
                            className="inline-flex rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-100"
                          >
                            Lihat task
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>
        </section>
      </main>
    </div>
  )
}
