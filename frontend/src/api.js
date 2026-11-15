
const BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
).replace(/\/$/, '')

async function get(path) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { Accept: 'application/json' }
  })

  if (!response.ok) {
    throw new Error(`${path} returned ${response.status}`)
  }

  return response.json()
}

export async function fetchDashboard() {
  const [signalsResult, positionsResult] = await Promise.allSettled([
    get('/api/signals'),
    get('/api/positions')
  ])

  if (
    signalsResult.status === 'rejected' &&
    positionsResult.status === 'rejected'
  ) {
    throw new Error('Could not reach the backend API')
  }

  return {
    signals: unwrapList(
      signalsResult.status === 'fulfilled' ? signalsResult.value : []
    ),
    positions: unwrapList(
      positionsResult.status === 'fulfilled' ? positionsResult.value : []
    ),
    summary: null
  }
}

function unwrapList(value) {
  if (Array.isArray(value)) return value

  if (!value || typeof value !== 'object') return []

  for (const key of ['items', 'results', 'signals', 'positions', 'data']) {
    if (Array.isArray(value[key])) return value[key]
  }

  return []
}

export { BASE_URL }
