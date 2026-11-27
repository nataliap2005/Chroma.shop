import { useState } from 'react';
import { Geolocation } from '@capacitor/geolocation';
export function useGeolocation() {
    const [position, setPosition] = useState<[
        number,
        number
    ] | null>(null), [error, setError] = useState('');
    async function locate() {
        try {
            const p = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
            setPosition([p.coords.latitude, p.coords.longitude]);
            setError('');
        }
        catch (e) {
            setError('No se pudo obtener la ubicación. Revisa los permisos y usa HTTPS o localhost.');
        }
    }
    return { position, error, locate };
}
