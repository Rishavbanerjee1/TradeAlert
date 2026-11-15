export const BASE_URL = (
    import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
).replace(/\/$/, '')

async function request(path, options = {}) {
    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            Accept: 'application/json',
            ...(options.body ? { 'Content-Type': 'application/json' } : {}),
            ...options.headers
        }
    })

    const contentType = response.headers.get('content-type')
    const data = contentType?.includes('application/json')
        ? await response.json()
        : null

    if (!response.ok) {
        throw new Error(
            data?.detail || data?.message || `${path} returned ${response.status}`
        )
    }

    return data
}

export const api = {
    get: (path) => request(path),

    post: (path, body) =>
        request(path, {
            method: 'POST',
            body: JSON.stringify(body)
        })
  }