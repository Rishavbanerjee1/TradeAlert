import { api } from './client'

function unwrapList(value) {
    if (Array.isArray(value)) return value
    if (!value || typeof value !== 'object') return []

    for (const key of ['items', 'results', 'signals', 'positions', 'data']) {
        if (Array.isArray(value[key])) return value[key]
    }

    return []
}

export async function fetchDashboard() {
    const [signalsResult, positionsResult] = await Promise.allSettled([
        api.get('/api/signals'),
        api.get('/api/positions')
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