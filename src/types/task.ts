export type TaskTag = {
  id: number
  tagName: string
  colorHex: string
}

export type TaskItem = {
  id: number
  projectId: number
  title: string
  content: string | null
  isCompleted: boolean
  dueDate: string | null
  tags: TaskTag[]
}

export type CreateTaskInput = {
  projectId: number
  title: string
  content?: string
  dueDate?: string
  tagIds: number[]
}

export type UpdateTaskInput = {
  title?: string
  content?: string
  isCompleted?: boolean
  dueDate?: string
  tagIds?: number[]
}
