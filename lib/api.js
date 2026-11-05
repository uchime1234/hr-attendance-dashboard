const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"

export class ApiError extends Error {
  constructor(message, status) {
    super(message)
    this.status = status
  }
}

export function normalizeError(payload, status) {
  if (status === 409) return "This action conflicts with an existing record."
  if (status === 404) return "The requested resource could not be found."
  if (status === 422) {
    if (Array.isArray(payload?.detail)) return payload.detail.map((item) => item.msg).join("; ")
    return payload?.detail || "Please check the submitted fields."
  }
  if (typeof payload?.detail === "string") return payload.detail
  return "The backend could not complete the request."
}

async function request(path, options = {}) {
  try {
    const response = await fetch(`${API_BASE}${path}`, { headers: { "Content-Type": "application/json", ...(options.headers || {}) }, ...options })
    const text = await response.text()
    let payload = null
    try { payload = text ? JSON.parse(text) : null } catch { payload = { detail: text } }
    if (!response.ok) throw new ApiError(normalizeError(payload, response.status), response.status)
    return payload
  } catch (error) {
    if (error instanceof ApiError) throw error
    throw new ApiError("The attendance backend could not be reached. Check that the API is running.", 0)
  }
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: "POST", body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: "PATCH", body: JSON.stringify(body) }),
}
