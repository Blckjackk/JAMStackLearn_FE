export type Project = {
  id: number
  userId: number
  name: string
  description: string
  createdAt: string
}

export type CreateProjectInput = {
  userId: number
  name: string
  description?: string
}
