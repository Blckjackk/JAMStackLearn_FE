export type TaskTag = {
  id: number
  name: string
  color: string
}

export type TaskItem = {
  id: number
  projectId: number
  assigneeUserId: number | null
  title: string
  content: string | null
  isCompleted: boolean
  dueDate: string | null
  tags: TaskTag[]
}

export type CreateTaskInput = {
  projectId: number
  assigneeUserId?: number
  title: string
  content?: string
  dueDate?: string
  tagIds: number[]
}

export type UpdateTaskInput = {
  assigneeUserId?: number
  title?: string
  content?: string
  isCompleted?: boolean
  dueDate?: string
  tagIds?: number[]
}
