import { useState } from 'react';
import { IonButton } from '@ionic/react';
import { pushApi } from '../services/push';

const stages = ['Confirmado', 'En preparación', 'Enviado', 'Entregado'];

export function OrderStatusControls({ id, status }: { id: string; status: string }) {
    const [busy, setBusy] = useState(false);
    const [message, setMessage] = useState('');
    const index = stages.indexOf(status);

    async function change(next: string, backwards: boolean) {
        if (backwards && !window.confirm(`¿Corregir el pedido a ${next}?`)) return;
        setBusy(true);
        setMessage('');
        try {
            const result = await pushApi('advance', { order_id: id, status: next, previous_status: status });
            setMessage(`Estado actualizado: ${next}. Notificaciones aceptadas por Firebase: ${result.sent}.`);
        } catch (error) {
            setMessage(error instanceof Error ? error.message : 'No se pudo actualizar el pedido.');
        } finally {
            setBusy(false);
        }
    }

    if (index < 0) return null;
    return (
        <section>
            {index < stages.length - 1 && (
                <IonButton expand="block" disabled={busy} onClick={() => void change(stages[index + 1], false)}>
                    Avanzar a {stages[index + 1]}
                </IonButton>
            )}
            {index > 0 && (
                <IonButton expand="block" fill="outline" disabled={busy} onClick={() => void change(stages[index - 1], true)}>
                    Volver a {stages[index - 1]}
                </IonButton>
            )}
            <p role="status">{busy ? 'Actualizando…' : message}</p>
        </section>
    );
}
