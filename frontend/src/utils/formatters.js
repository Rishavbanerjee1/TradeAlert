export function formatPrice(value) {
    const number = Number(value)

    if (!Number.isFinite(number)) return '—'

    return number.toLocaleString('en-IN', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })
}

export function formatDate(value) {
    if (!value) return '—'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return '—'

    return date.toLocaleString('en-IN', {
        dateStyle: 'medium',
        timeStyle: 'short'
    })
}

export function normalizeAction(value) {
    const action = String(value || '').toUpperCase()

    if (['BUY', 'SELL', 'HOLD'].includes(action)) {
        return action
    }

    return 'UNKNOWN'
}