import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { pushApi } from '../services/push';
import { requireSupabase } from '../lib/supabase';

export function usePush(userId: string | undefined) {
    useEffect(() => {
        if (!userId || Capacitor.getPlatform() !== 'android') return;
        let active = true;
        const handles: PluginListenerHandle[] = [];
        async function setup() {
            const handle = await PushNotifications.addListener('registration', async ({ value }) => {
                if (!active) return;
                const { data } = await requireSupabase().auth.getSession();
                if (!active || data.session?.user.id !== userId) return;
                try {
                    localStorage.setItem('shop-push-token', value);
                    await pushApi('register', { token: value });
                } catch (error) {
                    console.warn('No se pudo registrar el dispositivo', error);
                }
            });
            if (!active) { await handle.remove(); return; }
            handles.push(handle);
            let permission = await PushNotifications.checkPermissions();
            if (permission.receive === 'prompt' || permission.receive === 'prompt-with-rationale') {
                permission = await PushNotifications.requestPermissions();
            }
            if (active && permission.receive === 'granted') await PushNotifications.register();
        }
        void setup().catch(error => console.warn('Push no disponible', error));
        return () => {
            active = false;
            handles.forEach(handle => void handle.remove());
        };
    }, [userId]);
}
