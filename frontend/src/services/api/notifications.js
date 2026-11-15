import { api } from './client'

export async function sendNotification(payload) {
    return api.post('/api/notifications/send', payload)
}