import { apiFetch } from "./api"
import type { User } from "@/types"

type OtpSendResponse = {
  message: string
  expiresInSeconds: number
}

type OtpVerifyResponse = {
  message: string
  user?: User
}

export async function sendOtp(phoneNumber: string): Promise<OtpSendResponse> {
  return apiFetch<OtpSendResponse>("otp/send", {
    method: "POST",
    body: { phoneNumber },
  })
}

export async function verifyOtp(
  phoneNumber: string,
  code: string,
  userId?: number
): Promise<OtpVerifyResponse> {
  return apiFetch<OtpVerifyResponse>("otp/verify", {
    method: "POST",
    body: { phoneNumber, code, userId },
  })
}
