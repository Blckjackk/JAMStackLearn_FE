export type Project = {
  id: number
  name: string
  description: string
  createdAt: string
  updatedAt: string
  userRole: string
  members: ProjectMember[]
}

export type ProjectMember = {
  userId: number
  username: string
  email: string
  role: string
  joinedAt: string
}

export type CreateProjectInput = {
  name: string
  description?: string
}
