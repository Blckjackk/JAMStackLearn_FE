import { useCallback, useEffect, useState } from "react"

import { clearSessionUser, getSessionUser } from "@/lib/authSession"
import {
  acceptInvite,
  createProject,
  createProjectInvite,
  getPendingInvites,
  getProjects,
} from "@/services/projectService"
import type {
  CreateProjectInput,
  Project,
  ProjectInvite,
  User,
} from "@/types"

const initialProjectForm: CreateProjectInput = {
  name: "",
  description: "",
}

const roleOptions = [
  "Project Manager",
  "Frontend",
  "Backend",
  "QA",
  "DevOps",
  "Viewer",
]

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

  const [pendingInvites, setPendingInvites] = useState<ProjectInvite[]>([])
  const [loadingInvites, setLoadingInvites] = useState(false)
  const [inviteMessage, setInviteMessage] = useState<string | null>(null)
  const [inviteForm, setInviteForm] = useState({
    projectId: "",
    userCode: "",
    role: "Viewer",
  })

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
      setGlobalError(`Failed to load projects: ${toErrorMessage(error)}`)
    } finally {
      setLoadingProjects(false)
    }
  }, [])

  const refreshInvites = useCallback(async (userId: number) => {
    setLoadingInvites(true)
    setInviteMessage(null)

    try {
      const response = await getPendingInvites(userId)
      setPendingInvites(response)
    } catch (error) {
      setPendingInvites([])
      setInviteMessage(`Failed to load invites: ${toErrorMessage(error)}`)
    } finally {
      setLoadingInvites(false)
    }
  }, [])

  useEffect(() => {
    const sessionUser = getSessionUser()
    if (!sessionUser) {
      window.location.href = "/login"
      return
    }

    setAuthenticatedUser(sessionUser)
    setCheckingSession(false)
  }, [])

  useEffect(() => {
    if (!authenticatedUser) {
      return
    }

    void refreshProjects(authenticatedUser.id)
    void refreshInvites(authenticatedUser.id)
  }, [authenticatedUser, refreshProjects, refreshInvites])

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
      setProjectMessage(`Project ${created.name} created successfully.`)
      await refreshProjects(authenticatedUser.id)
    } catch (error) {
      setProjectMessage(`Create project failed: ${toErrorMessage(error)}`)
    } finally {
      setCreatingProject(false)
    }
  }

  async function handleInviteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setInviteMessage(null)

    try {
      if (!authenticatedUser) {
        throw new Error("Session user tidak ditemukan.")
      }

      const projectId = Number(inviteForm.projectId)
      if (!projectId) {
        throw new Error("Pilih project dulu.")
      }

      if (!inviteForm.userCode.trim()) {
        throw new Error("User code wajib diisi.")
      }

      await createProjectInvite(projectId, authenticatedUser.id, {
        userCode: inviteForm.userCode.trim(),
        role: inviteForm.role,
      })

      setInviteForm((previous) => ({
        ...previous,
        userCode: "",
      }))
      setInviteMessage("Invite berhasil dikirim.")
    } catch (error) {
      setInviteMessage(`Invite gagal: ${toErrorMessage(error)}`)
    }
  }

  async function handleAcceptInvite(inviteId: number) {
    if (!authenticatedUser) {
      return
    }

    try {
      await acceptInvite(inviteId, authenticatedUser.id)
      await refreshInvites(authenticatedUser.id)
      await refreshProjects(authenticatedUser.id)
    } catch (error) {
      setInviteMessage(`Accept invite gagal: ${toErrorMessage(error)}`)
    }
  }

  function handleLogout() {
    clearSessionUser()
    window.location.href = "/login"
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
                Personal Workspace
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Halo, {authenticatedUser?.username}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Ini halaman project kamu. Klik satu project untuk lihat tasknya.
              </p>
              <p className="mt-1 text-sm text-slate-600">
                User code kamu: {authenticatedUser?.userCode || "-"}
              </p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700"
            >
              Logout
            </button>
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
              Projects
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
              Create project
            </h2>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Project name</label>
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
              <label className="text-sm text-slate-600">Description</label>
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
              {creatingProject ? "Creating project..." : "Create project"}
            </button>
            {projectMessage && (
              <p className="text-sm text-slate-600">{projectMessage}</p>
            )}
          </form>

          <div className="space-y-6">
            <form
              onSubmit={handleInviteSubmit}
              className="space-y-4 rounded-3xl border border-slate-300/60 bg-white p-6 shadow-sm"
            >
              <h2 className="text-xl font-semibold text-slate-900">
                Invite member
              </h2>
              <div className="space-y-2">
                <label className="text-sm text-slate-600">Project</label>
                <select
                  value={inviteForm.projectId}
                  onChange={(event) =>
                    setInviteForm((previous) => ({
                      ...previous,
                      projectId: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  <option value="">Pilih project</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-600">User code</label>
                <input
                  value={inviteForm.userCode}
                  onChange={(event) =>
                    setInviteForm((previous) => ({
                      ...previous,
                      userCode: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                  placeholder="USR-ABC12345"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-600">Role</label>
                <select
                  value={inviteForm.role}
                  onChange={(event) =>
                    setInviteForm((previous) => ({
                      ...previous,
                      role: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                >
                  {roleOptions.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-600"
              >
                Kirim invite
              </button>
              {inviteMessage && (
                <p className="text-sm text-slate-600">{inviteMessage}</p>
              )}
            </form>

            <article className="rounded-3xl border border-slate-300/60 bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-slate-900">
                  Pending invites
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    authenticatedUser &&
                    void refreshInvites(authenticatedUser.id)
                  }
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  {loadingInvites ? "Refreshing..." : "Reload"}
                </button>
              </div>
              {pendingInvites.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Belum ada undangan.
                </p>
              ) : (
                <div className="space-y-3">
                  {pendingInvites.map((invite) => (
                    <div
                      key={invite.projectUserId}
                      className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                    >
                      <div>
                        <p className="font-medium text-slate-900">
                          Project #{invite.projectId}
                        </p>
                        <p className="text-xs text-slate-600">
                          Role: {invite.role}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          void handleAcceptInvite(invite.projectUserId)
                        }
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                      >
                        Accept
                      </button>
                    </div>
                  ))}
                </div>
              )}
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
                {loadingProjects ? "Refreshing..." : "Reload"}
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
                            {project.description || "No description"}
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
