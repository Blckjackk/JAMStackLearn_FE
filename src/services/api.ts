const API_URL = import.meta.env.PUBLIC_API_URL || "http://localhost:5156/api"
const IS_NGROK_API = /\.ngrok-free\.dev/i.test(API_URL)

type ApiInit = Omit<RequestInit, "body"> & {
  body?: unknown
}

export async function apiFetch<T>(
  endpoint: string,
  init?: ApiInit
): Promise<T> {
  const normalizedEndpoint = endpoint.replace(/^\/+/, "")

  const headers = new Headers(init?.headers)
  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json")
  }

  if (IS_NGROK_API && !headers.has("ngrok-skip-browser-warning")) {
    headers.set("ngrok-skip-browser-warning", "true")
  }

  let body: BodyInit | undefined
  if (init && "body" in init && init.body !== undefined) {
    headers.set("Content-Type", "application/json")
    body = JSON.stringify(init.body)
  }

  const res = await fetch(`${API_URL}/${normalizedEndpoint}`, {
    ...init,
    headers,
    body,
  })

  const raw = await res.text()
  const parsed = raw
    ? (() => {
        try {
          return JSON.parse(raw)
        } catch {
          return raw
        }
      })()
    : null

  if (!res.ok) {
    const message =
      typeof parsed === "string"
        ? parsed
        : parsed?.detail || parsed?.message || parsed?.title || res.statusText

    throw new Error(
      `Failed to fetch data from ${normalizedEndpoint}: ${res.status} ${message}`
    )
  }

  if (res.status === 204) {
    return undefined as T
  }

  return parsed as T
}
