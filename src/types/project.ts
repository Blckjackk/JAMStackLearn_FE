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
  userCode: string
  username: string
  email: string
  role: string
  joinedAt: string
  isAccepted: boolean
}

export type ProjectInvite = {
  projectUserId: number
  projectId: number
  userId: number
  userCode: string
  role: string
  isAccepted: boolean
  joinedAt: string
}

export type CreateProjectInput = {
  name: string
  description?: string
}
