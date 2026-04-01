import { apiFetch } from "./api"

type OtpSendResponse = {
  message: string
  expiresInSeconds: number
}

type OtpVerifyResponse = {
  message: string
}

export async function sendOtp(phoneNumber: string): Promise<OtpSendResponse> {
  return apiFetch<OtpSendResponse>("otp/send", {
    method: "POST",
    body: { phoneNumber },
  })
}

export async function verifyOtp(
  phoneNumber: string,
  code: string
): Promise<OtpVerifyResponse> {
  return apiFetch<OtpVerifyResponse>("otp/verify", {
    method: "POST",
    body: { phoneNumber, code },
  })
}
