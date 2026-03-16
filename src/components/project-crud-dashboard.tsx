import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react"

import { createProject, getProjects } from "@/services/projectService"
import { createUser, getUsers } from "@/services/userService"
import type {
  CreateProjectInput,
  CreateUserInput,
  Project,
  User,
} from "@/types"

const initialUserForm: CreateUserInput = {
  username: "",
  email: "",
  password: "",
}

const initialProjectForm: Omit<CreateProjectInput, "userId"> = {
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

export function ProjectCrudDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)

  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)

  const [globalError, setGlobalError] = useState<string | null>(null)
  const [userMessage, setUserMessage] = useState<string | null>(null)
  const [projectMessage, setProjectMessage] = useState<string | null>(null)

  const [userForm, setUserForm] = useState<CreateUserInput>(initialUserForm)
  const [projectForm, setProjectForm] =
    useState<Omit<CreateProjectInput, "userId">>(initialProjectForm)

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [users, selectedUserId]
  )

  const refreshUsers = useCallback(
    async (preferredUserId?: number) => {
      setLoadingUsers(true)
      setGlobalError(null)

      try {
        const response = await getUsers()
        setUsers(response)

        if (response.length === 0) {
          setSelectedUserId(null)
          setProjects([])
          return
        }

        const stillExists = response.some((user) => user.id === selectedUserId)
        const canUsePreferred =
          preferredUserId !== undefined &&
          response.some((user) => user.id === preferredUserId)

        if (canUsePreferred) {
          setSelectedUserId(preferredUserId)
        } else if (!stillExists) {
          setSelectedUserId(response[0].id)
        }
      } catch (error) {
        setGlobalError(`Failed to load user data: ${toErrorMessage(error)}`)
      } finally {
        setLoadingUsers(false)
      }
    },
    [selectedUserId]
  )

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

  useEffect(() => {
    void refreshUsers()
  }, [refreshUsers])

  useEffect(() => {
    if (selectedUserId === null) {
      setProjects([])
      return
    }

    void refreshProjects(selectedUserId)
  }, [refreshProjects, selectedUserId])

  async function handleCreateUser(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreatingUser(true)
    setUserMessage(null)

    try {
      if (
        !userForm.username.trim() ||
        !userForm.email.trim() ||
        !userForm.password.trim()
      ) {
        throw new Error("Username, email, and password are required.")
      }

      const created = await createUser({
        username: userForm.username.trim(),
        email: userForm.email.trim(),
        password: userForm.password,
      })

      setUserMessage(`User ${created.username} created successfully.`)
      setUserForm(initialUserForm)
      await refreshUsers(created.id)
    } catch (error) {
      setUserMessage(`Create user failed: ${toErrorMessage(error)}`)
    } finally {
      setCreatingUser(false)
    }
  }

  async function handleCreateProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setCreatingProject(true)
    setProjectMessage(null)

    try {
      if (selectedUserId === null) {
        throw new Error("Create at least one user before creating a project.")
      }

      if (!projectForm.name.trim()) {
        throw new Error("Project name is required.")
      }

      const created = await createProject({
        userId: selectedUserId,
        name: projectForm.name.trim(),
        description: projectForm.description?.trim() || undefined,
      })

      setProjectMessage(`Project ${created.name} created successfully.`)
      setProjectForm(initialProjectForm)
      await refreshProjects(selectedUserId)
    } catch (error) {
      setProjectMessage(`Create project failed: ${toErrorMessage(error)}`)
    } finally {
      setCreatingProject(false)
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.2),transparent_30%),radial-gradient(circle_at_85%_5%,rgba(249,115,22,0.18),transparent_32%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_55%,#f8fafc_100%)]">
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10 lg:px-10 lg:py-14">
        <section className="space-y-4 rounded-3xl border border-slate-300/60 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
          <p className="text-xs font-semibold tracking-[0.24em] text-sky-700 uppercase">
            Astro JAMStack + Dynamic API
          </p>
          <h1 className="max-w-3xl text-3xl font-bold tracking-tight text-slate-900 sm:text-5xl">
            Manage users and projects from ASP.NET API in real time.
          </h1>
          <p className="max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
            Shell page is static HTML from Astro build. Data operations
            (GET/POST) run in this client island.
          </p>
        </section>

        {globalError && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {globalError}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <article className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm">
            <p className="text-xs tracking-wider text-slate-500 uppercase">
              Users
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {users.length}
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm">
            <p className="text-xs tracking-wider text-slate-500 uppercase">
              Projects for selected user
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {projects.length}
            </p>
          </article>
          <article className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm">
            <p className="text-xs tracking-wider text-slate-500 uppercase">
              Active user
            </p>
            <p className="mt-2 truncate text-lg font-semibold text-slate-900">
              {selectedUser
                ? `${selectedUser.username} (#${selectedUser.id})`
                : "No user selected"}
            </p>
          </article>
        </section>

        <section className="rounded-3xl border border-slate-300/60 bg-white/80 p-6 shadow-sm backdrop-blur sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">
                Data controls
              </h2>
              <p className="text-sm text-slate-600">
                Pick a user to load projects, then create new resources below.
              </p>
            </div>
            <div className="flex gap-2">
              <select
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                value={selectedUserId ?? ""}
                onChange={(event) =>
                  setSelectedUserId(Number(event.target.value) || null)
                }
                disabled={users.length === 0 || loadingUsers}
              >
                {users.length === 0 ? (
                  <option value="">No users available</option>
                ) : (
                  users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.username} (#{user.id})
                    </option>
                  ))
                )}
              </select>
              <button
                type="button"
                onClick={() => void refreshUsers()}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={loadingUsers}
              >
                {loadingUsers ? "Refreshing..." : "Refresh users"}
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <form
            onSubmit={handleCreateUser}
            className="space-y-4 rounded-3xl border border-slate-300/60 bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-slate-900">
              Create user (POST /api/user)
            </h3>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Username</label>
              <input
                value={userForm.username}
                onChange={(event) =>
                  setUserForm((prev) => ({
                    ...prev,
                    username: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 ring-sky-300 outline-none focus:ring"
                placeholder="john.doe"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Email</label>
              <input
                type="email"
                value={userForm.email}
                onChange={(event) =>
                  setUserForm((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 ring-sky-300 outline-none focus:ring"
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Password</label>
              <input
                type="password"
                value={userForm.password}
                onChange={(event) =>
                  setUserForm((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 ring-sky-300 outline-none focus:ring"
                placeholder="minimum 8 characters"
              />
            </div>
            <button
              type="submit"
              disabled={creatingUser}
              className="rounded-xl bg-sky-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingUser ? "Creating user..." : "Create user"}
            </button>
            {userMessage && (
              <p className="text-sm text-slate-600">{userMessage}</p>
            )}
          </form>

          <form
            onSubmit={handleCreateProject}
            className="space-y-4 rounded-3xl border border-slate-300/60 bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-slate-900">
              Create project (POST /api/project)
            </h3>
            <p className="text-sm text-slate-600">
              Selected user ID: {selectedUserId ?? "none"}
            </p>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Project name</label>
              <input
                value={projectForm.name}
                onChange={(event) =>
                  setProjectForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 ring-amber-300 outline-none focus:ring"
                placeholder="Website revamp"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Description</label>
              <textarea
                value={projectForm.description}
                onChange={(event) =>
                  setProjectForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                rows={4}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 ring-amber-300 outline-none focus:ring"
                placeholder="Scope and goals"
              />
            </div>
            <button
              type="submit"
              disabled={creatingProject || selectedUserId === null}
              className="rounded-xl bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingProject ? "Creating project..." : "Create project"}
            </button>
            {projectMessage && (
              <p className="text-sm text-slate-600">{projectMessage}</p>
            )}
          </form>
        </section>

        <section className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <article className="rounded-3xl border border-slate-300/60 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Users (GET /api/user)
              </h3>
              <button
                type="button"
                onClick={() => void refreshUsers()}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Reload
              </button>
            </div>
            <div className="max-h-105 overflow-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-3 py-2">ID</th>
                    <th className="px-3 py-2">Username</th>
                    <th className="px-3 py-2">Email</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3 text-slate-500" colSpan={3}>
                        {loadingUsers ? "Loading users..." : "No users yet."}
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr
                        key={user.id}
                        className="border-t border-slate-200 odd:bg-white even:bg-slate-50/40"
                      >
                        <td className="px-3 py-2">{user.id}</td>
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {user.username}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {user.email}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </article>

          <article className="rounded-3xl border border-slate-300/60 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Projects (GET /api/project/user/{"{id}"})
              </h3>
              <button
                type="button"
                onClick={() =>
                  selectedUserId !== null &&
                  void refreshProjects(selectedUserId)
                }
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
              >
                Reload
              </button>
            </div>
            <div className="max-h-105 overflow-auto rounded-xl border border-slate-200">
              <table className="w-full text-left text-sm">
                <thead className="sticky top-0 bg-slate-100 text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Project</th>
                    <th className="px-3 py-2">Description</th>
                    <th className="px-3 py-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3 text-slate-500" colSpan={3}>
                        {loadingProjects
                          ? "Loading projects..."
                          : "No projects for selected user."}
                      </td>
                    </tr>
                  ) : (
                    projects.map((project) => (
                      <tr
                        key={project.id}
                        className="border-t border-slate-200 odd:bg-white even:bg-slate-50/40"
                      >
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {project.name}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {project.description || "No description"}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {formatDate(project.createdAt)}
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
