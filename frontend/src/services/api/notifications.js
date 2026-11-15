import { BASE_URL } from "./client";

const API_URL = BASE_URL.replace(/\/+$/, "");

function getHeaders() {
    const secret = import.meta.env.VITE_WEBHOOK_SECRET;

    return {
        "Content-Type": "application/json",
        ...(secret ? { "X-Webhook-Secret": secret } : {}),
    };
}

async function handleResponse(response) {
    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            typeof data.detail === "string"
                ? data.detail
                : "Notification request failed."
        );
    }

    return data;
}

export async function sendNotification(payload) {
    const response = await fetch(`${API_URL}/api/notifications/send`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(payload),
    });

    return handleResponse(response);
}

export async function fetchNotificationHistory(limit = 100) {
    const response = await fetch(
        `${API_URL}/api/notifications/history?limit=${limit}`,
        {
            method: "GET",
            headers: getHeaders(),
            cache: "no-store",
        }
    );

    return handleResponse(response);
}