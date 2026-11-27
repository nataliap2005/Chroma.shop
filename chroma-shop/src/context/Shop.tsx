import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { supabase } from '../lib/supabase';
import seed from '../data/shop-products.json';
import type { Product, Analysis, Answers } from '../services/types';
export type Item = Product & {
    stock: number;
    active?: boolean;
    swatch_image?: string;
};
export type Beauty = {
    answers: Answers;
    analysis: Analysis;
    season: string;
    undertone: string;
};
export const money = (n: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(n);
export async function engine<T>(path: string, body: unknown): Promise<T> {
    const r = await fetch(`${(import.meta.env.VITE_API_URL || 'http://localhost:5050').replace(/\/$/, '')}/api/${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!r.ok)
        throw Error('No se pudo completar la consulta al motor.');
    return r.json();
}
function read<T>(key: string, fallback: T): T {
    try {
        return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback;
    }
    catch {
        return fallback;
    }
}
function useShopState() {
    const [user, setUser] = useState<User | null>(null), [admin, setAdmin] = useState(false), [ready, setReady] = useState(!supabase), [products, setProducts] = useState<Item[]>(supabase ? [] : seed as Item[]), [error, setError] = useState(''), [notice, setNotice] = useState(''), [cart, setCart] = useState<Record<string, number>>(() => read('shop-cart', {})), [beauty, setBeauty] = useState<Beauty | null>(() => read('shop-guest-beauty', null)), [favorites, setFavorites] = useState<string[]>([]), [avatar, setAvatar] = useState('');
    async function refresh() {
        if (!supabase)
            return;
        const { data, error } = await supabase.from('products').select('*').order('id');
        if (error)
            setError(error.message);
        else {
            setProducts(data as Item[]);
            setError('');
        }
    }
    useEffect(() => {
        if (!supabase)
            return;
        const db = supabase;
        let alive = true;
        db.auth.getSession().then(({ data }) => {
            if (alive) {
                setUser(data.session?.user ?? null);
                setReady(true);
            }
        });
        const { data } = db.auth.onAuthStateChange((_e, s) => {
            setUser(s?.user ?? null);
            setReady(true);
        });
        void refresh();
        const ch = db.channel('shop-products').on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => void refresh()).subscribe(status => {
            if (status === 'SUBSCRIBED')
                void refresh();
            if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT')
                setError('No se pudo conectar al inventario en tiempo real.');
        });
        return () => {
            alive = false;
            data.subscription.unsubscribe();
            void db.removeChannel(ch);
        };
    }, []);
    useEffect(() => {
        let live = true;
        setAdmin(false);
        setFavorites([]);
        setAvatar('');
        if (!user || !supabase) {
            setBeauty(read('shop-guest-beauty', null));
            return;
        }
        const db = supabase;
        setBeauty(null);
        void (async () => {
            const [a, p, f] = await Promise.all([db.rpc('is_admin'), db.from('profiles').select('*').eq('id', user.id).maybeSingle(), db.from('favorites').select('product_id').eq('user_id', user.id)]);
            if (!live)
                return;
            setAdmin(a.data === true);
            setBeauty(p.data?.beauty ?? null);
            setFavorites((f.data ?? []).map(x => x.product_id));
            if (p.data?.avatar) {
                const signed = await db.storage.from('shop-avatars').createSignedUrl(p.data.avatar, 3600);
                if (live)
                    setAvatar(signed.data?.signedUrl ?? '');
            }
        })();
        return () => {
            live = false;
        };
    }, [user?.id]);
    useEffect(() => {
        void refresh();
    }, [user?.id, admin]);
    useEffect(() => {
        if (!user || admin || !supabase)
            return;
        const db = supabase;
        const channel = db.channel('customer-order-notices-' + user.id)
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: 'user_id=eq.' + user.id }, payload => {
            if (payload.new.user_id !== user.id)
                return;
            const status = String(payload.new.status);
            if (['En preparación', 'Enviado', 'Entregado'].includes(status)) {
                setNotice(`Tu pedido #${String(payload.new.id).slice(0, 8)}: ${status}.`);
            }
        }).subscribe();
        return () => {
            void db.removeChannel(channel);
        };
    }, [user?.id, admin]);
    useEffect(() => {
        localStorage.setItem('shop-cart', JSON.stringify(cart));
    }, [cart]);
    function add(p: Item, n = 1) {
        if (admin)
            return;
        if (!p.active && p.active !== undefined || p.stock < 1) {
            setNotice('Producto agotado');
            return;
        }
        setCart(c => ({ ...c, [p.id]: Math.min(p.stock, (c[p.id] || 0) + n) }));
        setNotice('Añadido al carrito');
        void Haptics.impact({ style: ImpactStyle.Light }).catch(() => {
        });
    }
    function quantity(id: string, n: number) {
        setCart(c => {
            const next = { ...c };
            if (n <= 0)
                delete next[id];
            else
                next[id] = Math.min(n, products.find(p => p.id === id)?.stock ?? n);
            return next;
        });
    }
    async function saveBeauty(b: Beauty) {
        if (user && supabase) {
            const { error } = await supabase.from('profiles').upsert({ id: user.id, name: user.user_metadata.display_name || '', beauty: b });
            if (error)
                throw error;
        }
        else
            localStorage.setItem('shop-guest-beauty', JSON.stringify(b));
        setBeauty(b);
    }
    async function favorite(id: string) {
        if (!user || !supabase) {
            setNotice('Inicia sesión para guardar favoritos');
            return;
        }
        const exists = favorites.includes(id);
        const q = exists ? await supabase.from('favorites').delete().eq('user_id', user.id).eq('product_id', id) : await supabase.from('favorites').insert({ user_id: user.id, product_id: id });
        if (q.error)
            setNotice(q.error.message);
        else
            setFavorites(f => exists ? f.filter(x => x !== id) : [...f, id]);
    }
    return { user, admin, ready, products, error, notice, setNotice, cart, add, quantity, clear: () => setCart({}), beauty, saveBeauty, favorites, favorite, avatar, setAvatar, refresh };
}
const C = createContext<ReturnType<typeof useShopState> | null>(null);
export function ShopProvider({ children }: {
    children: ReactNode;
}) {
    return <C.Provider value={useShopState()}>
    {children}
    </C.Provider>;
}
export function useShop() {
    const s = useContext(C);
    if (!s)
        throw Error('ShopProvider');
    return s;
}
