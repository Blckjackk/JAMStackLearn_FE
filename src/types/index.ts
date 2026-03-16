// Sesuai dengan TaskResponseDto di C#
export interface Task {
  id: number
  title: string
  projectName: string
  tagNames: string[]
  isCompleted: boolean
  status: string
}

// Sesuai dengan ProjectResponseDto di C#
export interface Project {
  id: number
  name: string
  description: string
}
