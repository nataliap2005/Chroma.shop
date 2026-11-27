import { OrderStatusControls } from '../components/OrderStatusControls';
import { Geolocation } from '@capacitor/geolocation';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IonButton } from '@ionic/react';
import { Screen, Intro, Photo } from '../components/UI';
import { money, useShop } from '../context/Shop';
import { requireSupabase, supabase } from '../lib/supabase';
const stages = ['Confirmado', 'En preparación', 'Enviado', 'Entregado'];
export type Order = {
    id: string;
    user_id: string;
    created_at: string;
    address: string;
    status: string;
    total: number;
    shipping: number;
    order_items?: {
        nombre: string;
        tono: string;
        quantity: number;
        price: number;
    }[];
};
export function useOrders() {
    const { user, admin } = useShop(), [rows, setRows] = useState<Order[]>([]), [error, setError] = useState('');
    useEffect(() => {
        setRows([]);
        if (!user || !supabase)
            return;
        const db = supabase;
        let live = true;
        async function load() {
            let query = db.from('orders').select('*,order_items(*)').order('created_at', { ascending: false });
            if (!admin)
                query = query.eq('user_id', user!.id);
            const q = await query;
            if (live) {
                if (q.error)
                    setError(q.error.message);
                else {
                    setError('');
                    setRows(q.data as Order[]);
                }
            }
        }
        void load();
        const c = db.channel('orders-' + user.id + '-' + Math.random()).on('postgres_changes', { event: '*', schema: 'public', table: 'orders', ...(!admin ? { filter: 'user_id=eq.' + user.id } : {}) }, () => void load()).subscribe(status => {
            if (status === 'SUBSCRIBED')
                void load();
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')
                setError('No se pudo conectar a Realtime.');
        });
        return () => {
            live = false;
            void db.removeChannel(c);
        };
    }, [user?.id, admin]);
    return { rows: admin ? rows : rows.filter(o => o.user_id === user?.id), error };
}
function useLines() {
    const s = useShop();
    const lines = Object.entries(s.cart).map(([id, n]) => ({ p: s.products.find(p => String(p.id) === id && p.active !== false), id, n }));
    return { lines, total: lines.reduce((a, x) => a + (x.p?.precio_cop || 0) * x.n, 0), valid: lines.length > 0 && lines.every(x => x.p && x.n > 0 && x.n <= x.p.stock) };
}
export function Cart() {
    const s = useShop(), nav = useNavigate(), { lines, total, valid } = useLines();
    return <Screen title="Carrito de compras">

    <Intro tag="MI COMPRA" title="Tu carrito"/>
        {!lines.length && <p>Tu carrito está vacío.
        </p>}
        {lines.map(({ p, id, n }) => <article className="cart-line" key={id}>
        {p && <Photo p={p}/>}
        <div>

        <strong>
        {p?.nombre || 'Producto no disponible'}
        </strong>

        <p>
        {p?.tono}
        </p>

        <strong>
        {money((p?.precio_cop || 0) * n)}
        </strong>

        <div className="qty">

        <button onClick={() => s.quantity(id, n - 1)}>−
        </button>
        {n}
        <button disabled={!p || n >= p.stock} onClick={() => s.quantity(id, n + 1)}>+
        </button>

        <button onClick={() => s.quantity(id, 0)}>Eliminar
        </button>

        </div>
            {(!p || n > p.stock) && <p role="alert">Revisa la disponibilidad.
            </p>}
        </div>

        </article>)}
    <section className="panel">

    <h2>Resumen del pedido
    </h2>

    <p>Subtotal 
    <b>
    {money(total)}
    </b>

    </p>

    <p>Envío 
    <b>
    {money(lines.length ? 9900 : 0)}
    </b>

    </p>

    <h3>Total 
    {money(total + (lines.length ? 9900 : 0))}
    </h3>

    <IonButton expand="block" disabled={!valid} onClick={() => nav('/checkout')}>Continuar al pago
    </IonButton>

    <IonButton fill="clear" expand="block" onClick={() => nav('/catalog')}>Seguir comprando
    </IonButton>

    </section>

    </Screen>;
}
export function Checkout() {
    const s = useShop(), nav = useNavigate(), { lines, total, valid } = useLines(), [address, setAddress] = useState(''), [city, setCity] = useState(''), [locating, setLocating] = useState(false), [locationMessage, setLocationMessage] = useState(''), [busy, setBusy] = useState(false), [error, setError] = useState('');
    async function useLocation() {
        setLocating(true);
        setLocationMessage('');
        try {
            const { coords } = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 15000 });
            const url = new URL('https://nominatim.openstreetmap.org/reverse');
            url.search = new URLSearchParams({ format: 'jsonv2', lat: String(coords.latitude), lon: String(coords.longitude), 'accept-language': 'es' }).toString();
            const response = await fetch(url, { signal: AbortSignal.timeout(12000) });
            if (!response.ok)
                throw new Error('Geocodificación no disponible');
            const result = await response.json();
            const a = result.address || {};
            const street = [a.road || a.pedestrian || a.residential, a.house_number].filter(Boolean).join(' ');
            const locality = a.city || a.town || a.municipality || a.village || '';
            if (!street || !locality)
                throw new Error('Dirección incompleta');
            setAddress(street);
            setCity(locality);
            setLocationMessage('Ubicación aproximada de OpenStreetMap. Verifica la dirección y añade el número o apartamento si hace falta.');
        }
        catch {
            setLocationMessage('No se pudo obtener una dirección completa. Puedes escribirla manualmente.');
        }
        finally {
            setLocating(false);
        }
    }
    async function buy() {
        if (busy || !valid || address.trim().length < 5 || !city.trim())
            return;
        if (!s.user) {
            nav('/account');
            return;
        }
        setBusy(true);
        setError('');
        try {
            const { data, error } = await requireSupabase().rpc('checkout', { items: lines.map(x => ({ id: x.id, quantity: x.n })), delivery_address: `${address.trim()}, ${city.trim()}` });
            if (error)
                throw error;
            s.clear();
            void s.refresh();
            nav('/orders/' + data, { replace: true });
        }
        catch (e) {
            setError(e instanceof Error ? e.message : JSON.stringify(e));
        }
        finally {
            setBusy(false);
        }
    }
    return <Screen title="Finalizar compra" back>

    <Intro tag="DATOS DE ENTREGA" title="Confirma tu pedido"/>

    <IonButton expand="block" fill="outline" disabled={locating || busy} onClick={() => void useLocation()}>
    {locating ? 'Buscando dirección…' : 'Usar mi ubicación actual'}
    </IonButton>

    <p>Si usas esta opción, tus coordenadas se consultan en OpenStreetMap.
    </p>
    <p role="status">
    {locationMessage}
    </p>

    <label>Dirección de entrega
    <input value={address} onChange={e => setAddress(e.target.value)} placeholder="Calle 10 # 20-30"/>

    </label>

    <label>Ciudad
    <input value={city} onChange={e => setCity(e.target.value)} placeholder="Cali"/>

    </label>

    <section className="panel">

    <h2>Método de pago
    </h2>

    <p>● Pago contra entrega (efectivo)
    </p>

    <p>Demostración académica: no se realiza un cobro real.
    </p>

    </section>

    <h2>Total 
    {money(total + 9900)}
    </h2>
        {!s.user && <p>Inicia sesión para confirmar.
        </p>}
    <IonButton expand="block" disabled={locating || busy || !valid || address.trim().length < 5 || !city.trim()} onClick={() => void buy()}>
    {busy ? 'Confirmando…' : s.user ? 'Confirmar pedido' : 'Iniciar sesión'}
    </IonButton>

    <p role="alert">
    {error}
    </p>
        {!valid && <p>Revisa el stock y las cantidades del carrito.
        </p>}
        {(address.trim().length < 5 || !city.trim()) && <p>Escribe una dirección de al menos cinco caracteres y la ciudad.
        </p>}
    </Screen>;
}
export function Timeline({ status }: {
    status: string;
}) {
    const i = stages.indexOf(status);
    return <div className="timeline">
        {stages.map((x, j) => <div key={x} className={j <= i ? 'complete' : ''}>

        <span>
        {j <= i ? '✓' : j + 1}
        </span>

        <small>
        {x}
        </small>

        </div>)}
    </div>;
}
export function Orders() {
    const { rows, error } = useOrders(), nav = useNavigate();
    return <Screen title="Mis pedidos" back>

    <Intro tag="COMPRAS" title="Historial de pedidos"/>
        {error && <p>
        {error}
        </p>}
        {!rows.length && <p>No hay pedidos todavía.
        </p>}
        {rows.map(o => <button className="order panel" key={o.id} onClick={() => nav('/orders/' + o.id)}>

        <strong>Pedido #
        {o.id.slice(0, 8)}
        </strong>

        <p>
        {new Date(o.created_at).toLocaleDateString('es-CO')} · 
        {money(o.total)}
        </p>

        <Timeline status={o.status}/>

        </button>)}
    </Screen>;
}
export function OrderDetail() {
    const { admin } = useShop();
    const { id } = useParams(), { rows, error } = useOrders(), o = rows.find(x => x.id === id);
    return <Screen title="Seguimiento del pedido" back>
        {o ? <>
        <Intro tag={'PEDIDO #' + o.id.slice(0, 8)} title={o.status === 'Confirmado' ? '¡Pedido confirmado!' : o.status}/>
        <section className="panel">

        <Timeline status={o.status}/>

        <p>
        {o.address}
        </p>

        <p>Pago contra entrega
        </p>
            {o.order_items?.map((x, i) => <p key={i}>
            {x.quantity} × 
            {x.nombre} · 
            {x.tono} — 
            {money(x.price * x.quantity)}
            </p>)}
        <h3>Total 
        {money(o.total)}
        </h3>

        {admin && <OrderStatusControls id={o.id} status={o.status}/>}
        </section>
        </> : <p>
        {error || 'Consultando pedido…'}
        </p>}
    </Screen>;
}
