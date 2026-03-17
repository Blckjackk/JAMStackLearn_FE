import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from "react"

import { createProject, getProjects } from "@/services/projectService"
import {
  createTask,
  getAvailableTags,
  getTasksByProject,
  updateTask,
} from "@/services/taskService"
import { createUser, getUsers, loginUser } from "@/services/userService"
import type {
  CreateProjectInput,
  CreateTaskInput,
  CreateUserInput,
  LoginUserInput,
  Project,
  TaskItem,
  TaskTag,
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

const initialTaskForm = {
  title: "",
  content: "",
  dueDate: "",
}

const initialLoginForm: LoginUserInput = {
  email: "",
  password: "",
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

export function ProjectCrudDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<TaskItem[]>([])
  const [availableTags, setAvailableTags] = useState<TaskTag[]>([])
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(
    null
  )
  const [selectedTagId, setSelectedTagId] = useState<number | null>(null)
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null)

  const [loadingUsers, setLoadingUsers] = useState(false)
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [loadingTasks, setLoadingTasks] = useState(false)
  const [loadingTags, setLoadingTags] = useState(false)
  const [creatingUser, setCreatingUser] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)
  const [creatingTask, setCreatingTask] = useState(false)
  const [loggingIn, setLoggingIn] = useState(false)
  const [updatingTaskId, setUpdatingTaskId] = useState<number | null>(null)

  const [globalError, setGlobalError] = useState<string | null>(null)
  const [userMessage, setUserMessage] = useState<string | null>(null)
  const [projectMessage, setProjectMessage] = useState<string | null>(null)
  const [taskMessage, setTaskMessage] = useState<string | null>(null)
  const [loginMessage, setLoginMessage] = useState<string | null>(null)

  const [userForm, setUserForm] = useState<CreateUserInput>(initialUserForm)
  const [projectForm, setProjectForm] =
    useState<Omit<CreateProjectInput, "userId">>(initialProjectForm)
  const [taskForm, setTaskForm] = useState(initialTaskForm)
  const [loginForm, setLoginForm] = useState<LoginUserInput>(initialLoginForm)

  const selectedUser = useMemo(
    () => users.find((user) => user.id === selectedUserId) ?? null,
    [users, selectedUserId]
  )

  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selectedProjectId) ?? null,
    [projects, selectedProjectId]
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
          setSelectedProjectId(null)
          setProjects([])
          setTasks([])
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
    setGlobalError(null)

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
    void refreshUsers()
  }, [refreshUsers])

  useEffect(() => {
    void refreshAvailableTags()
  }, [refreshAvailableTags])

  useEffect(() => {
    if (selectedUserId === null) {
      setProjects([])
      setSelectedProjectId(null)
      setTasks([])
      return
    }

    void refreshProjects(selectedUserId)
  }, [refreshProjects, selectedUserId])

  useEffect(() => {
    if (projects.length === 0) {
      setSelectedProjectId(null)
      setTasks([])
      return
    }

    const stillExists =
      selectedProjectId !== null &&
      projects.some((project) => project.id === selectedProjectId)

    if (!stillExists) {
      setSelectedProjectId(projects[0].id)
    }
  }, [projects, selectedProjectId])

  useEffect(() => {
    if (selectedProjectId === null) {
      setTasks([])
      return
    }

    void refreshTasks(selectedProjectId)
  }, [refreshTasks, selectedProjectId])

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
      setSelectedProjectId(created.id)
    } catch (error) {
      setProjectMessage(`Create project failed: ${toErrorMessage(error)}`)
    } finally {
      setCreatingProject(false)
    }
  }

  function selectSingleTag(tagId: number) {
    setSelectedTagId((previous) => (previous === tagId ? null : tagId))
  }

  async function handleCreateTask(event: FormEvent<HTMLFormElement>) {
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
      }

      const created = await createTask(payload)
      setTaskMessage(`Task ${created.title} created successfully.`)
      setTaskForm(initialTaskForm)
      setSelectedTagId(null)
      await refreshTasks(selectedProjectId)
    } catch (error) {
      setTaskMessage(`Create task failed: ${toErrorMessage(error)}`)
    } finally {
      setCreatingTask(false)
    }
  }

  async function handleUpdateTaskStatus(taskId: number, isCompleted: boolean) {
    if (selectedProjectId === null) {
      return
    }

    setUpdatingTaskId(taskId)
    setTaskMessage(null)

    try {
      await updateTask(taskId, { isCompleted })
      setTaskMessage("Task status updated.")
      await refreshTasks(selectedProjectId)
    } catch (error) {
      setTaskMessage(`Update task failed: ${toErrorMessage(error)}`)
    } finally {
      setUpdatingTaskId(null)
    }
  }

  async function handleUpdateTaskTag(taskId: number, nextTagIdValue: string) {
    if (selectedProjectId === null) {
      return
    }

    const parsedTagId = nextTagIdValue ? Number(nextTagIdValue) : null
    if (parsedTagId !== null && Number.isNaN(parsedTagId)) {
      return
    }

    setUpdatingTaskId(taskId)
    setTaskMessage(null)

    try {
      await updateTask(taskId, {
        tagIds: parsedTagId === null ? [] : [parsedTagId],
      })
      setTaskMessage("Task tag updated.")
      await refreshTasks(selectedProjectId)
    } catch (error) {
      setTaskMessage(`Update task failed: ${toErrorMessage(error)}`)
    } finally {
      setUpdatingTaskId(null)
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoggingIn(true)
    setLoginMessage(null)

    try {
      if (!loginForm.email.trim() || !loginForm.password.trim()) {
        throw new Error("Email and password are required.")
      }

      const loggedInUser = await loginUser({
        email: loginForm.email.trim(),
        password: loginForm.password,
      })

      setAuthenticatedUser(loggedInUser)
      setLoginForm(initialLoginForm)
      setLoginMessage(`Login successful. Welcome, ${loggedInUser.username}.`)
    } catch (error) {
      setAuthenticatedUser(null)
      setLoginMessage(`Login failed: ${toErrorMessage(error)}`)
    } finally {
      setLoggingIn(false)
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
          <p className="text-sm font-medium text-slate-700">
            Login state:{" "}
            {authenticatedUser ? authenticatedUser.email : "Not logged in"}
          </p>
        </section>

        {globalError && (
          <div className="rounded-2xl border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {globalError}
          </div>
        )}

        <section className="grid gap-4 sm:grid-cols-4">
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
          <article className="rounded-2xl border border-slate-200 bg-white/85 p-5 shadow-sm">
            <p className="text-xs tracking-wider text-slate-500 uppercase">
              Tasks for selected project
            </p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">
              {tasks.length}
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
            <div className="flex flex-wrap gap-2">
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
              <select
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900"
                value={selectedProjectId ?? ""}
                onChange={(event) =>
                  setSelectedProjectId(Number(event.target.value) || null)
                }
                disabled={projects.length === 0 || loadingProjects}
              >
                {projects.length === 0 ? (
                  <option value="">No projects available</option>
                ) : (
                  projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name} (#{project.id})
                    </option>
                  ))
                )}
              </select>
              <button
                type="button"
                onClick={() =>
                  selectedProjectId !== null &&
                  void refreshTasks(selectedProjectId)
                }
                className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={selectedProjectId === null || loadingTasks}
              >
                {loadingTasks ? "Refreshing tasks..." : "Refresh tasks"}
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
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
            onSubmit={handleLogin}
            className="space-y-4 rounded-3xl border border-slate-300/60 bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-slate-900">
              Login (POST /api/user/login)
            </h3>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Email</label>
              <input
                type="email"
                value={loginForm.email}
                onChange={(event) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    email: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 ring-violet-300 outline-none focus:ring"
                placeholder="john@example.com"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Password</label>
              <input
                type="password"
                value={loginForm.password}
                onChange={(event) =>
                  setLoginForm((prev) => ({
                    ...prev,
                    password: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 ring-violet-300 outline-none focus:ring"
                placeholder="Your password"
              />
            </div>
            <button
              type="submit"
              disabled={loggingIn}
              className="rounded-xl bg-violet-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loggingIn ? "Logging in..." : "Login"}
            </button>
            {loginMessage && (
              <p className="text-sm text-slate-600">{loginMessage}</p>
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

          <form
            onSubmit={handleCreateTask}
            className="space-y-4 rounded-3xl border border-slate-300/60 bg-white p-6 shadow-sm"
          >
            <h3 className="text-lg font-semibold text-slate-900">
              Create task (POST /api/task)
            </h3>
            <p className="text-sm text-slate-600">
              Selected project: {selectedProject?.name ?? "none"}
            </p>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Task title</label>
              <input
                value={taskForm.title}
                onChange={(event) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    title: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 ring-emerald-300 outline-none focus:ring"
                placeholder="Design landing section"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Content</label>
              <textarea
                value={taskForm.content}
                onChange={(event) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    content: event.target.value,
                  }))
                }
                rows={3}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 ring-emerald-300 outline-none focus:ring"
                placeholder="Add hero headline and CTA"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-slate-600">Due date</label>
              <input
                type="date"
                value={taskForm.dueDate}
                onChange={(event) =>
                  setTaskForm((prev) => ({
                    ...prev,
                    dueDate: event.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-900 ring-emerald-300 outline-none focus:ring"
              />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label className="text-sm text-slate-600">
                  Tags template (choose one)
                </label>
                <button
                  type="button"
                  onClick={() => void refreshAvailableTags()}
                  className="rounded-lg border border-slate-300 px-2 py-1 text-xs font-medium text-slate-600 transition hover:bg-slate-100"
                >
                  {loadingTags ? "Refreshing..." : "Refresh tags"}
                </button>
              </div>
              {availableTags.length === 0 ? (
                <p className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-3 py-2 text-xs text-slate-500">
                  {loadingTags
                    ? "Loading tag templates..."
                    : "No tag templates found in database table Tags."}
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
                          backgroundColor: active ? tag.colorHex : undefined,
                        }}
                      >
                        {tag.tagName}
                      </button>
                    )
                  })}
                </div>
              )}
              <p className="text-xs text-slate-500">
                Click selected tag again to clear.
              </p>
            </div>
            <button
              type="submit"
              disabled={creatingTask || selectedProjectId === null}
              className="rounded-xl bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {creatingTask ? "Creating task..." : "Create task"}
            </button>
            {taskMessage && (
              <p className="text-sm text-slate-600">{taskMessage}</p>
            )}
          </form>
        </section>

        <section className="grid gap-6 xl:grid-cols-3">
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
                        onClick={() => setSelectedProjectId(project.id)}
                        className={`cursor-pointer border-t border-slate-200 ${
                          selectedProjectId === project.id
                            ? "bg-amber-50/80"
                            : "odd:bg-white even:bg-slate-50/40"
                        }`}
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

          <article className="rounded-3xl border border-slate-300/60 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-slate-900">
                Tasks (GET /api/task/project/{"{id}"})
              </h3>
              <button
                type="button"
                onClick={() =>
                  selectedProjectId !== null &&
                  void refreshTasks(selectedProjectId)
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
                    <th className="px-3 py-2">Task</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Due</th>
                    <th className="px-3 py-2">Tags</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 ? (
                    <tr>
                      <td className="px-3 py-3 text-slate-500" colSpan={4}>
                        {loadingTasks
                          ? "Loading tasks..."
                          : "No tasks for selected project."}
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
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          <select
                            value={task.isCompleted ? "done" : "open"}
                            onChange={(event) =>
                              void handleUpdateTaskStatus(
                                task.id,
                                event.target.value === "done"
                              )
                            }
                            disabled={updatingTaskId === task.id}
                            className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                          >
                            <option value="open">Open</option>
                            <option value="done">Done</option>
                          </select>
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          {task.dueDate ? formatDate(task.dueDate) : "-"}
                        </td>
                        <td className="px-3 py-2 text-slate-600">
                          <div className="flex flex-wrap items-center gap-2">
                            <select
                              value={task.tags[0]?.id ?? ""}
                              onChange={(event) =>
                                void handleUpdateTaskTag(
                                  task.id,
                                  event.target.value
                                )
                              }
                              disabled={updatingTaskId === task.id}
                              className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs text-slate-700"
                            >
                              <option value="">No tag</option>
                              {availableTags.map((tag) => (
                                <option key={tag.id} value={tag.id}>
                                  {tag.tagName}
                                </option>
                              ))}
                            </select>
                            {task.tags[0] && (
                              <span
                                className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                                style={{
                                  backgroundColor: task.tags[0].colorHex,
                                }}
                              >
                                {task.tags[0].tagName}
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
