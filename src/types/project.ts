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
}

export type ProjectInvite = {
  id: number
  projectId: number
  projectName: string
  invitedUserId: number
  invitedUserCode: string
  invitedByUserId: number
  invitedByUsername: string
  role: string
  status: string
  createdAt: string
}

export type CreateProjectInput = {
  name: string
  description?: string
}
