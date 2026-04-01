import { useCallback, useEffect, useState } from "react"

import { clearSessionUser, getSessionUser } from "@/lib/authSession"
import {
  acceptInvite,
  getPendingInvites,
  rejectInvite,
} from "@/services/projectService"
import { getUser } from "@/services/userService"
import type { ProjectInvite, User } from "@/types"

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Unexpected error"
}

export function UserProjectInvites() {
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [pendingInvites, setPendingInvites] = useState<ProjectInvite[]>([])
  const [loadingInvites, setLoadingInvites] = useState(false)
  const [inviteMessage, setInviteMessage] = useState<string | null>(null)

  const refreshInvites = useCallback(async (userId: number) => {
    setLoadingInvites(true)
    setInviteMessage(null)

    try {
      const response = await getPendingInvites(userId)
      setPendingInvites(response)
    } catch (error) {
      setPendingInvites([])
      setInviteMessage(`Gagal memuat undangan: ${toErrorMessage(error)}`)
    } finally {
      setLoadingInvites(false)
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
    if (!authenticatedUser) {
      return
    }

    void refreshInvites(authenticatedUser.id)
  }, [authenticatedUser, refreshInvites])

  async function handleAcceptInvite(inviteId: number) {
    if (!authenticatedUser) {
      return
    }

    try {
      await acceptInvite(inviteId, authenticatedUser.id)
      await refreshInvites(authenticatedUser.id)
    } catch (error) {
      setInviteMessage(`Terima undangan gagal: ${toErrorMessage(error)}`)
    }
  }

  async function handleRejectInvite(inviteId: number) {
    if (!authenticatedUser) {
      return
    }

    try {
      await rejectInvite(inviteId, authenticatedUser.id)
      await refreshInvites(authenticatedUser.id)
    } catch (error) {
      setInviteMessage(`Tolak undangan gagal: ${toErrorMessage(error)}`)
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.12),transparent_30%),radial-gradient(circle_at_70%_12%,rgba(16,185,129,0.12),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#f1f5f9_55%,#f8fafc_100%)]">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 lg:px-10 lg:py-14">
        <section className="rounded-3xl border border-slate-300/60 bg-white/85 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold tracking-[0.28em] text-slate-500 uppercase">
                Undangan Project
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
                Kotak masuk undangan
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Kelola undangan masuk project agar tetap rapi.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  authenticatedUser && void refreshInvites(authenticatedUser.id)
                }
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                {loadingInvites ? "Memuat..." : "Muat ulang"}
              </button>
            </div>
          </div>
        </section>

        {inviteMessage && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {inviteMessage}
          </div>
        )}

        <section className="rounded-3xl border border-slate-300/60 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Undangan aktif
            </h2>
            <span className="text-xs text-slate-500">
              {pendingInvites.length} undangan
            </span>
          </div>
          {pendingInvites.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
              Belum ada undangan masuk.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 px-4 py-3"
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {invite.projectName || `Project #${invite.projectId}`}
                    </p>
                    <p className="text-xs text-slate-600">
                      Role: {invite.role}
                    </p>
                    <p className="text-xs text-slate-500">
                      Diundang oleh {invite.invitedByUsername}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void handleRejectInvite(invite.id)}
                      className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    >
                      Tolak
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleAcceptInvite(invite.id)}
                      className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500"
                    >
                      Terima
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
