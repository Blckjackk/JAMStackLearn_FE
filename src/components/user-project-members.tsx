import { useEffect, useMemo, useState } from "react"

import { clearSessionUser, getSessionUser } from "@/lib/authSession"
import { createProjectInvite, getProject } from "@/services/projectService"
import { getUser } from "@/services/userService"
import type { Project, ProjectMember, User } from "@/types"

const roleOptions = [
  "Project Manager",
  "Frontend",
  "Backend",
  "QA",
  "DevOps",
  "Viewer",
]

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Unexpected error"
}

type UserProjectMembersProps = {
  projectId: number
}

export function UserProjectMembers({ projectId }: UserProjectMembersProps) {
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  const [project, setProject] = useState<Project | null>(null)
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [loadingProject, setLoadingProject] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  const [inviteForm, setInviteForm] = useState({
    userCode: "",
    role: "Viewer",
  })
  const [sendingInvite, setSendingInvite] = useState(false)

  const isProjectManager = useMemo(() => {
    if (!authenticatedUser) {
      return false
    }

    const membership = members.find(
      (member) => member.userId === authenticatedUser.id
    )

    return membership?.role?.toLowerCase().includes("project manager") ?? false
  }, [authenticatedUser, members])

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
      } catch {
        clearSessionUser()
        window.location.href = "/login"
        return
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
    if (!projectId || Number.isNaN(projectId)) {
      return
    }

    let isActive = true
    setLoadingProject(true)

    async function loadProject() {
      try {
        const response = await getProject(projectId)
        if (!isActive) {
          return
        }

        setProject(response)
        setMembers(response.members || [])
      } catch (error) {
        setMessage(`Gagal memuat project: ${toErrorMessage(error)}`)
      } finally {
        if (isActive) {
          setLoadingProject(false)
        }
      }
    }

    void loadProject()

    return () => {
      isActive = false
    }
  }, [projectId])

  async function handleInviteSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    if (!authenticatedUser) {
      setMessage("Session user tidak ditemukan.")
      return
    }

    if (!inviteForm.userCode.trim()) {
      setMessage("Kode user wajib diisi.")
      return
    }

    try {
      setSendingInvite(true)
      await createProjectInvite(projectId, authenticatedUser.id, {
        userCode: inviteForm.userCode.trim(),
        role: inviteForm.role,
      })
      setInviteForm((previous) => ({
        ...previous,
        userCode: "",
      }))
      setMessage("Undangan berhasil dikirim.")
    } catch (error) {
      setMessage(`Undangan gagal: ${toErrorMessage(error)}`)
    } finally {
      setSendingInvite(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-10">
        <p className="text-sm text-slate-600">Memeriksa sesi...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_8%,rgba(15,118,110,0.15),transparent_32%),radial-gradient(circle_at_85%_12%,rgba(14,165,233,0.16),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#eff6ff_55%,#f8fafc_100%)]">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 lg:px-10 lg:py-14">
        <section className="rounded-3xl border border-slate-300/60 bg-white/85 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.28em] text-teal-700 uppercase">
                Anggota Project
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                {project?.name ?? `Project #${projectId}`}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Lihat anggota project dan kirim undangan baru.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/tasks?projectId=${projectId}`}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Kembali ke jobdesk
              </a>
            </div>
          </div>
        </section>

        {message && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {message}
          </div>
        )}

        <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-3xl border border-slate-300/60 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">
                Daftar anggota
              </h2>
              <span className="text-xs text-slate-500">
                {members.length} anggota
              </span>
            </div>
            {loadingProject ? (
              <p className="text-sm text-slate-500">Memuat anggota...</p>
            ) : members.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Belum ada anggota di project ini.
              </div>
            ) : (
              <div className="space-y-3">
                {members.map((member) => (
                  <div
                    key={member.userId}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm"
                  >
                    <div>
                      <p className="font-medium text-slate-900">
                        {member.username}
                      </p>
                      <p className="text-xs text-slate-600">{member.email}</p>
                      <p className="text-xs text-slate-500">
                        Kode: {member.userCode || "-"}
                      </p>
                    </div>
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs text-slate-600">
                      {member.role}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </article>

          <form
            onSubmit={handleInviteSubmit}
            className="space-y-4 rounded-3xl border border-slate-300/60 bg-white p-6 shadow-sm"
          >
            <h2 className="text-lg font-semibold text-slate-900">
              Undang anggota
            </h2>
            <p className="text-sm text-slate-600">
              Kirim undangan berdasarkan kode user.
            </p>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Kode user</label>
              <input
                value={inviteForm.userCode}
                onChange={(event) =>
                  setInviteForm((previous) => ({
                    ...previous,
                    userCode: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900"
                placeholder="USR-000123"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Peran</label>
              <select
                value={inviteForm.role}
                onChange={(event) =>
                  setInviteForm((previous) => ({
                    ...previous,
                    role: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                disabled={!isProjectManager}
              >
                {roleOptions.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
              {!isProjectManager && (
                <p className="text-xs text-amber-700">
                  Hanya Project Manager yang bisa mengundang anggota.
                </p>
              )}
            </div>
            <button
              type="submit"
              disabled={!isProjectManager || sendingInvite}
              className="rounded-xl bg-teal-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-teal-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {sendingInvite ? "Mengirim..." : "Kirim undangan"}
            </button>
          </form>
        </section>
      </main>
    </div>
  )
}
