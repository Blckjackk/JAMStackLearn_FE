export type User = {
  id: number
  username: string
  email: string
}

export type CreateUserInput = {
  username: string
  email: string
  password: string
}
