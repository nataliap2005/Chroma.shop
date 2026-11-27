import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { requireSupabase } from '../lib/supabase';

export async function pushApi(path: string, body: unknown) {
    const { data } = await requireSupabase().auth.getSession();
    if (!data.session) throw new Error('Sesión requerida');
    const base = (import.meta.env.VITE_API_URL || 'http://localhost:5050').replace(/\/$/, '');
    const response = await fetch(`${base}/api/push/${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${data.session.access_token}`
        },
        body: JSON.stringify(body)
    });
    if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(typeof error?.detail === 'string' ? error.detail : 'No se pudo completar la operación de notificaciones');
    }
    return response.json();
}

export async function disconnectPush() {
    if (!Capacitor.isNativePlatform()) return;
    const token = localStorage.getItem('shop-push-token');
    if (token) await pushApi('unregister', { token });
    await PushNotifications.unregister();
    localStorage.removeItem('shop-push-token');
}
