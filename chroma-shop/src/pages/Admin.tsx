import { useState } from 'react';
import { IonButton } from '@ionic/react';
import { OrderStatusControls } from '../components/OrderStatusControls';
import { Screen, Intro } from '../components/UI';
import { useShop, money, type Item } from '../context/Shop';
import { requireSupabase } from '../lib/supabase';
import { useOrders, Timeline } from './Commerce';

// Valores iniciales para crear un producto
const empty = {
    id: '', nombre: '', marca: '', categoria: 'Base', tono: '', color_hex: '#DAB39A',
    precio_cop: 0, stock: 0, imagen: '', swatch_image: '', descripcion: '',
    estacion: 'Primavera clara', subtono: 'calido', profundidad: 'claro', acabado: 'satinado',
    tipos_piel: 'normal;mixta;seca;grasa', nivel: 'C', calidad: 'ok', panes: '', active: true
};

export function Admin() {
    const s = useShop();
    const { rows, error } = useOrders();
    const [tab, setTab] = useState('products');
    const [form, setForm] = useState<Item | null>(null);
    const [q, setQ] = useState('');
    const [msg, setMsg] = useState('');
    const [busy, setBusy] = useState(false);

    // Validar permisos de administrador
    if (!s.admin) {
        return (
            <Screen title="Administración">
                <p>Acceso reservado a administradores.</p>
            </Screen>
        );
    }

    // Crear o actualizar un producto
    async function save() {
        if (!form) return;
        setBusy(true);
        try {
            const { error } = await requireSupabase().from('products').upsert(form);
            if (error) throw error;
            setForm(null);
            await s.refresh();
            setMsg('Producto guardado');
        } catch (e) {
            setMsg(e instanceof Error ? e.message : JSON.stringify(e));
        } finally {
            setBusy(false);
        }
    }

    // Retirar un producto del catálogo
    async function archive(p: Item) {
        if (!confirm('¿Retirar producto del catálogo?')) return;
        const { error } = await requireSupabase()
            .from('products')
            .update({ active: false })
            .eq('id', p.id);
        setMsg(error?.message || 'Producto retirado');
        void s.refresh();
    }

    // Interfaz del panel administrativo
    return (
        <Screen title="Panel de administración" back>
            <Intro tag="GESTIÓN DE TIENDA" title="Administración" />
            {/* Navegación del administrador */}
            <div className="quick">
                <button onClick={() => setTab('products')}>Productos</button>
                <button onClick={() => setTab('orders')}>Pedidos</button>
            </div>
            {tab === 'products' ? (
                <>
                    {/* Resumen del inventario */}
                    <div className="quick">
                        <span>{s.products.length} productos</span>
                        <span>{s.products.filter(p => p.stock === 0).length} agotados</span>
                    </div>
                    {/* Crear producto */}
                    <IonButton expand="block" onClick={() => setForm({ ...empty, id: crypto.randomUUID() })}>
                        + Crear producto
                    </IonButton>
                    {/* Formulario de productos */}
                    {form && (
                        <form className="panel" onSubmit={e => { e.preventDefault(); void save(); }}>
                            <h2>Editar producto</h2>
                            {([
                                'nombre', 'marca', 'categoria', 'tono', 'descripcion', 'imagen',
                                'swatch_image', 'estacion', 'subtono', 'profundidad', 'acabado', 'tipos_piel'
                            ] as const).map(k => (
                                <label key={k}>
                                    {k}
                                    <input
                                        required={['nombre', 'marca', 'categoria', 'tono'].includes(k)}
                                        value={String(form[k] ?? '')}
                                        onChange={e => setForm({ ...form, [k]: e.target.value })}
                                    />
                                </label>
                            ))}
                            {/* Selector de color */}
                            <label>
                                Color
                                <input
                                    type="color"
                                    value={form.color_hex}
                                    onChange={e => setForm({ ...form, color_hex: e.target.value })}
                                />
                            </label>
                            {/* Precio e inventario */}
                            {(['precio_cop', 'stock'] as const).map(k => (
                                <label key={k}>
                                    {k}
                                    <input
                                        type="number"
                                        min={k === 'stock' ? 0 : 1}
                                        required
                                        value={form[k]}
                                        onChange={e => setForm({ ...form, [k]: Number(e.target.value) })}
                                    />
                                </label>
                            ))}
                            {/* Visibilidad del producto */}
                            <label>
                                <input
                                    type="checkbox"
                                    checked={form.active !== false}
                                    onChange={e => setForm({ ...form, active: e.target.checked })}
                                />
                                Visible en tienda
                            </label>
                            {/* Acciones del formulario */}
                            <IonButton type="submit" disabled={busy}>Guardar</IonButton>
                            <IonButton fill="outline" onClick={() => setForm(null)}>Cancelar</IonButton>
                        </form>
                    )}
                    {/* Buscador de productos */}
                    <input placeholder="Buscar producto" value={q} onChange={e => setQ(e.target.value)} />
                    {/* Listado de productos */}
                    {s.products
                        .filter(p => `${p.nombre} ${p.tono}`.toLowerCase().includes(q.toLowerCase()))
                        .slice(0, 60)
                        .map(p => (
                            <div className="panel" key={p.id}>
                                <strong>{p.nombre} · {p.tono}</strong>
                                <p>
                                    {money(p.precio_cop)}
                                    {' · Stock: '}
                                    {p.stock}
                                    {p.active === false ? ' · Retirado' : ''}
                                </p>
                                <IonButton size="small" onClick={() => setForm(p)}>Editar</IonButton>
                                <IonButton size="small" fill="outline" onClick={() => void archive(p)}>
                                    Retirar
                                </IonButton>
                            </div>
                        ))}
                </>
            ) : (
                <>
                    {/* Gestión de pedidos */}
                    {error && <p>{error}</p>}
                    {rows.map(o => (
                        <div className="panel" key={o.id}>
                            <strong>#{o.id.slice(0, 8)}{' · '}{money(o.total)}</strong>
                            <p>{o.address}</p>
                            {/* Seguimiento del pedido */}
                            <Timeline status={o.status} />
                            <p>Estado actual:{' '}<strong>{o.status}</strong></p>
                            {/* Actualización de estados y notificaciones */}
                            <OrderStatusControls id={o.id} status={o.status} />
                        </div>
                    ))}
                </>
            )}
            {/* Mensajes de confirmación o error */}
            <p role="alert">{msg}</p>
        </Screen>
    );
}