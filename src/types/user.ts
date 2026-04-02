export type User = {
  id: number
  username: string
  email: string
  userCode: string
  role: string
  phoneNumber?: string
  isOtpVerified: boolean
}

export type CreateUserInput = {
  username: string
  email: string
  password: string
}

export type LoginUserInput = {
  email: string
  password: string
}

export type UpdateUserProfileInput = {
  username: string
}
