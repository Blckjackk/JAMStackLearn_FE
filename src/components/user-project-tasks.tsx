import { useCallback, useEffect, useMemo, useState } from "react"

import { getSessionUser } from "@/lib/authSession"
import { getProjects } from "@/services/projectService"
import {
  createTask,
  getAvailableTags,
  getTasksByProject,
  updateTask,
} from "@/services/taskService"
import { getUser } from "@/services/userService"
import type {
  CreateTaskInput,
  Project,
  TaskItem,
  TaskTag,
  UpdateTaskInput,
  User,
} from "@/types"

const initialTaskForm = {
  title: "",
  content: "",
  dueDate: "",
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  return "Unexpected error"
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

function toDueDateIso(dateValue: string): string | undefined {
  if (!dateValue.trim()) {
    return undefined
  }

  const isoValue = `${dateValue}T00:00:00Z`
  if (Number.isNaN(new Date(isoValue).getTime())) {
    throw new Error("Due date format is invalid.")
  }

  return isoValue
}

function getQueryProjectId(): number | null {
  const query = new URLSearchParams(window.location.search)
  const value = query.get("projectId")
  if (!value) {
    return null
  }

  const parsed = Number(value)
  return Number.isNaN(parsed) ? null : parsed
}

export function UserProjectTasks() {
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)

  const [userProjects, setUserProjects] = useState<Project[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  )
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [availableTags, setAvailableTags] = useState<TaskTag[]>([])
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null)
  const [selectedAssigneeUserId, setSelectedAssigneeUserId] = useState<
    number | null
  >(null)

  const [loadingProjects, setLoadingProjects] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [loadingTags, setLoadingTags] = useState(false)
  const [creatingTask, setCreatingTask] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null)

  const [globalError, setGlobalError] = useState<string | null>(null)
  const [taskMessage, setTaskMessage] = useState<string | null>(null)
  const [taskErrors, setTaskErrors] = useState<Record<number, string>>({})
  const [taskForm, setTaskForm] = useState(initialTaskForm)

  const selectedProject = useMemo(
    () =>
      userProjects.find((project) => project.id === selectedProjectId) ?? null,
    [userProjects, selectedProjectId]
  )

  const isProjectManager = useMemo(() => {
    if (!selectedProject?.userRole) {
      return false
    }

    return selectedProject.userRole.toLowerCase().includes("project manager")
  }, [selectedProject])

  const isAdmin = useMemo(() => {
    if (!authenticatedUser) {
      return false
    }
    return authenticatedUser.role.toLowerCase() === "admin"
  }, [authenticatedUser])

  const projectMembers = useMemo(() => {
    return selectedProject?.members ?? []
  }, [selectedProject])

  const refreshProjects = useCallback(async (userId: number) => {
    setLoadingProjects(true)
    setGlobalError(null)

    try {
      const response = await getProjects(userId)
      setUserProjects(response)

      const requestedProjectId = getQueryProjectId()
      if (
        requestedProjectId !== null &&
        response.some((project) => project.id === requestedProjectId)
      ) {
        setSelectedProjectId(requestedProjectId)
      } else if (response.length > 0) {
        setSelectedProjectId(response[0].id)
      } else {
        setSelectedProjectId(null)
      }
    } catch (error) {
      setUserProjects([])
      setSelectedProjectId(null)
      setGlobalError(`Failed to load projects: ${toErrorMessage(error)}`)
    } finally {
      setLoadingProjects(false)
    }
  }, [])

  const refreshTasks = useCallback(async (projectId: number) => {
    setLoadingTasks(true)
    setGlobalError(null)

    try {
      const response = await getTasksByProject(projectId)
      setTasks(response)
    } catch (error) {
      setTasks([])
      setGlobalError(`Failed to load tasks: ${toErrorMessage(error)}`)
    } finally {
      setLoadingTasks(false)
    }
  }, [])

  const refreshAvailableTags = useCallback(async () => {
    setLoadingTags(true)

    try {
      const response = await getAvailableTags()
      setAvailableTags(response)
    } catch (error) {
      setAvailableTags([])
      setGlobalError(`Failed to load tags: ${toErrorMessage(error)}`)
    } finally {
      setLoadingTags(false)
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

    void refreshProjects(authenticatedUser.id)
  }, [authenticatedUser, refreshProjects])

  useEffect(() => {
    void refreshAvailableTags()
  }, [refreshAvailableTags])

  useEffect(() => {
    if (selectedProjectId === null) {
      setTasks([])
      return
    }

    void refreshTasks(selectedProjectId)
  }, [selectedProjectId, refreshTasks])

  async function handleCreateTask(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreatingTask(true)
    setTaskMessage(null)

    try {
      if (selectedProjectId === null) {
        throw new Error("Select a project before creating a task.")
      }

      if (!taskForm.title.trim()) {
        throw new Error("Task title is required.")
      }

      const payload: CreateTaskInput = {
        projectId: selectedProjectId,
        title: taskForm.title.trim(),
        content: taskForm.content.trim() || undefined,
        dueDate: toDueDateIso(taskForm.dueDate),
        tagIds: selectedTagId === null ? [] : [selectedTagId],
        assigneeUserId:
          selectedAssigneeUserId === null ? undefined : selectedAssigneeUserId,
      }

      if (!authenticatedUser) {
        throw new Error("Session user tidak ditemukan.")
      }

      await createTask(authenticatedUser.id, payload)
      setTaskForm(initialTaskForm)
      setSelectedTagId(null)
      setSelectedAssigneeUserId(null)
      setTaskMessage("Task berhasil dibuat.")
      await refreshTasks(selectedProjectId)
    } catch (error) {
      setTaskMessage(`Gagal membuat task: ${toErrorMessage(error)}`)
    } finally {
      setCreatingTask(false)
    }
  }

  async function handleUpdateTask(taskId: number, payload: UpdateTaskInput) {
    if (selectedProjectId === null) {
      return
    }

    setUpdatingTaskId(taskId)
    setTaskMessage(null)

    try {
      if (!authenticatedUser) {
        throw new Error("Session user tidak ditemukan.")
      }

      await updateTask(authenticatedUser.id, taskId, payload)
      setTaskMessage("Task berhasil diperbarui.")
      setTaskErrors((previous) => {
        if (!(taskId in previous)) {
          return previous
        }

        const next = { ...previous }
        delete next[taskId]
        return next
      })
      await refreshTasks(selectedProjectId)
    } catch (error) {
      setTaskMessage(`Gagal memperbarui task: ${toErrorMessage(error)}`)
      setTaskErrors((previous) => ({
        ...previous,
        [taskId]: toErrorMessage(error),
      }))
    } finally {
      setUpdatingTaskId(null)
    }
  }

  function selectSingleTag(tagId: number) {
    setSelectedTagId((previous) => (previous === tagId ? null : tagId))
  }

  if (checkingSession) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-6 py-10">
        <p className="text-sm text-slate-600">Memeriksa sesi...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_16%_10%,rgba(34,197,94,0.16),transparent_30%),radial-gradient(circle_at_82%_12%,rgba(14,165,233,0.16),transparent_30%),linear-gradient(180deg,#f8fafc_0%,#f0fdf4_55%,#f8fafc_100%)]">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-10 lg:px-10 lg:py-14">
        <section className="rounded-3xl border border-slate-300/60 bg-white/85 p-6 shadow-sm backdrop-blur sm:p-8">
          <p className="text-xs font-semibold tracking-[0.24em] text-emerald-700 uppercase">
            Project
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            {selectedProject ? selectedProject.name : "Ruang Task"}
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Kelola task untuk project terpilih. Kembali ke dashboard untuk pilih
            project lain.
          </p>
          <p className="mt-1 text-sm text-slate-600">
            Kode user: {authenticatedUser?.userCode || "-"}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <a
              href="/dashboard"
              className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
            >
              Kembali ke project
            </a>
            {selectedProjectId !== null && (
              <a
                href={`/projects/${selectedProjectId}/members`}
                className="rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Kelola anggota
              </a>
            )}
            <select
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
              value={selectedProjectId ?? ""}
              onChange={(event) =>
                setSelectedProjectId(Number(event.target.value) || null)
              }
              disabled={userProjects.length === 0 || loadingProjects}
            >
              {userProjects.length === 0 ? (
                <option value="">Belum ada project</option>
              ) : (
                userProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))
              )}
            </select>
          </div>
        </section>

        {globalError && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {globalError}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm">
            <p className="text-xs tracking-wider text-slate-500 uppercase">
              Project
            </p>
            <p className="mt-2 truncate text-lg font-semibold text-slate-900">
              {selectedProject?.name ?? "Belum ada"}
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm">
            <p className="text-xs tracking-wider text-slate-500 uppercase">
              Total task
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {tasks.length}
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm">
            <p className="text-xs tracking-wider text-slate-500 uppercase">
              User
            </p>
            <p className="mt-2 truncate text-lg font-semibold text-slate-900">
              {authenticatedUser?.username}
            </p>
          </article>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          {isProjectManager || isAdmin ? (
            <form
              onSubmit={handleCreateTask}
              className="space-y-4 rounded-3xl border border-slate-300/60 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <h2 className="text-xl font-semibold text-slate-900">
                  Buat task
                </h2>
                <button
                  type="button"
                  onClick={() => void refreshAvailableTags()}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  {loadingTags ? "Memuat..." : "Muat ulang tag"}
                </button>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-600">Judul task</label>
                <input
                  value={taskForm.title}
                  onChange={(event) =>
                    setTaskForm((previous) => ({
                      ...previous,
                      title: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 ring-emerald-300 outline-none focus:ring"
                  placeholder="Design landing section"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-600">Detail</label>
                <textarea
                  value={taskForm.content}
                  onChange={(event) =>
                    setTaskForm((previous) => ({
                      ...previous,
                      content: event.target.value,
                    }))
                  }
                  rows={3}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 ring-emerald-300 outline-none focus:ring"
                  placeholder="Detail pekerjaan"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-600">Assign ke</label>
                <select
                  value={selectedAssigneeUserId ?? ""}
                  onChange={(event) =>
                    setSelectedAssigneeUserId(
                      event.target.value ? Number(event.target.value) : null
                    )
                  }
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                  disabled={projectMembers.length === 0}
                >
                  <option value="">Belum ditugaskan</option>
                  {projectMembers.map((member) => (
                    <option key={member.userId} value={member.userId}>
                      {member.username}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-600">Tenggat</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(event) =>
                    setTaskForm((previous) => ({
                      ...previous,
                      dueDate: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 ring-emerald-300 outline-none focus:ring"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-slate-600">Template tag</label>
                {availableTags.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                    {loadingTags ? "Memuat tag..." : "Belum ada template tag."}
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2 rounded-xl border border-slate-300 p-3">
                    {availableTags.map((tag) => {
                      const active = selectedTagId === tag.id
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => selectSingleTag(tag.id)}
                          className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                            active
                              ? "border-slate-900 text-white"
                              : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                          }`}
                          style={{
                            backgroundColor: active ? tag.color : undefined,
                          }}
                        >
                          {tag.name}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
              <button
                type="submit"
                disabled={creatingTask || selectedProjectId === null}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {creatingTask ? "Membuat task..." : "Buat task"}
              </button>
              {taskMessage && (
                <p className="text-sm text-slate-600">{taskMessage}</p>
              )}
            </form>
          ) : (
            <div className="rounded-3xl border border-amber-200 bg-amber-50/70 p-6 text-sm text-amber-800 shadow-sm">
              Buat task hanya untuk Project Manager.
            </div>
          )}

          <article className="rounded-3xl border border-slate-300/60 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-slate-900">
                Daftar task
              </h3>
              <button
                type="button"
                onClick={() =>
                  selectedProjectId !== null &&
                  void refreshTasks(selectedProjectId)
                }
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
              >
                {loadingTasks ? "Memuat..." : "Muat ulang"}
              </button>
            </div>
            <div className="max-h-96 overflow-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Task</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Tenggat</th>
                    <th className="px-3 py-2">Assignee</th>
                    <th className="px-3 py-2">Tag</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 ? (
                    <tr>
                      <td className="px-3 py-4 text-slate-500" colSpan={5}>
                        {loadingTasks
                          ? "Memuat task..."
                          : "Belum ada task. Buat task baru di panel kiri."}
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <tr
                        key={task.id}
                        className="border-t border-slate-200 odd:bg-white even:bg-slate-50/40"
                      >
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {task.title}
                          {taskErrors[task.id] && (
                            <p className="mt-1 text-xs text-rose-600">
                              {taskErrors[task.id]}
                            </p>
                          )}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          <select
                            value={task.isCompleted ? "selesai" : "on-progress"}
                            onChange={(event) =>
                              void handleUpdateTask(task.id, {
                                isCompleted: event.target.value === "selesai",
                              })
                            }
                            disabled={updatingTaskId === task.id}
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                          >
                            <option value="on-progress">On Progress</option>
                            <option value="selesai">Selesai</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {task.dueDate ? formatDate(task.dueDate) : "-"}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          <select
                            value={task.assigneeUserId ?? ""}
                            onChange={(event) => {
                              if (!event.target.value) {
                                void handleUpdateTask(task.id, {
                                  clearAssignee: true,
                                })
                                return
                              }

                              void handleUpdateTask(task.id, {
                                assigneeUserId: Number(event.target.value),
                              })
                            }}
                            disabled={
                              !isProjectManager || updatingTaskId === task.id
                            }
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                          >
                            <option value="">Unassigned</option>
                            {projectMembers.map((member) => (
                              <option key={member.userId} value={member.userId}>
                                {member.username}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={task.tags[0]?.id ?? ""}
                              onChange={(event) => {
                                const nextTagId = event.target.value
                                const parsedTagId = nextTagId
                                  ? Number(nextTagId)
                                  : null
                                void handleUpdateTask(task.id, {
                                  tagIds:
                                    parsedTagId === null ? [] : [parsedTagId],
                                })
                              }}
                              disabled={updatingTaskId === task.id}
                              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                            >
                              <option value="">No tag</option>
                              {availableTags.map((tag) => (
                                <option key={tag.id} value={tag.id}>
                                  {tag.name}
                                </option>
                              ))}
                            </select>
                            {task.tags[0] && (
                              <span
                                className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                                style={{
                                  backgroundColor: task.tags[0].color,
                                }}
                              >
                                {task.tags[0].name}
                              </span>
                            )}
                          </div>
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
