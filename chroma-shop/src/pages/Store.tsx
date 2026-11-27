import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { IonButton } from '@ionic/react';
import { Card, Intro, Photo, Reason, Screen } from '../components/UI';
import { engine, money, useShop, type Item } from '../context/Shop';
export function Home() {
    const nav = useNavigate(), s = useShop();
    return <Screen title="Chroma Shop">
    <section className="hero">
    <small>TIENDA DE MAQUILLAJE INTELIGENTE
    </small>
    <h1>Maquillaje que resalta 
    <em>tus colores.
    </em>
    </h1>
    <p>Descubre productos, encuentra tu tono y compra en un solo lugar.
    </p>
    <IonButton onClick={() => nav('/catalog')}>Explorar tienda →
    </IonButton>
    <div className="hero-products">
    {s.products.slice(0, 1).map(p => <Photo key={p.id} p={p}/>)}
    </div>
    </section>
    <section className="panel">
    <h2>Descubre tu paleta en 2 minutos
    </h2>
    <p>Conoce tu estación cromática con nuestro cuestionario.
    </p>
    <IonButton expand="block" onClick={() => nav('/questionnaire')}>Empezar diagnóstico
    </IonButton>
    </section>
    <div className="quick">
    <button onClick={() => nav('/translator')}>Traductor de tonos
    </button>
    <button onClick={() => nav('/advisor')}>Asesor de looks
    </button>
    <button onClick={() => nav('/stores')}>Tiendas cercanas
    </button>
    </div>
    <h2>Recomendados para ti
    </h2>
    <div className="products">
    {s.products.filter(p => p.active !== false && p.stock > 0).sort((a, b) => Number(b.estacion === s.beauty?.season) - Number(a.estacion === s.beauty?.season)).slice(0, 6).map(p => <Card key={p.id} p={p}/>)}
    </div>
    </Screen>;
}
export function Catalog() {
    const s = useShop(), [q, setQ] = useState(''), [cat, setCat] = useState('Todos'), [brand, setBrand] = useState('Todas'), [rank, setRank] = useState<Item[]>([]), [limit, setLimit] = useState(24);
    useEffect(() => {
        let live = true;
        setRank([]);
        if (s.beauty && s.products.length)
            void engine<{
                products: Item[];
            }>('recommend', { answers: s.beauty.answers, products: s.products }).then(r => {
                if (live)
                    setRank(r.products);
            }).catch(() => {
            });
        return () => {
            live = false;
        };
    }, [s.beauty, s.products]);
    const rows = (rank.length ? rank : s.products).filter(p => p.active !== false && (cat === 'Todos' || p.categoria === cat) && (brand === 'Todas' || p.marca === brand) && `${p.nombre} ${p.marca} ${p.tono}`.toLowerCase().includes(q.toLowerCase()));
    return <Screen title="Tienda Chroma">
    <Intro tag="CHROMA · PRODUCTOS" title="Recomendados para ti">Encuentra maquillaje para tus colores.
    </Intro>
        {s.error && <p role="alert">
        {s.error}
        </p>}
    <input aria-label="Buscar productos" placeholder="Buscar producto, marca o tono…" value={q} onChange={e => {
            setQ(e.target.value);
            setLimit(24);
        }}/>
    <div className="filters">
    <select aria-label="Categoría" value={cat} onChange={e => setCat(e.target.value)}>
        {['Todos', ...new Set(s.products.map(p => p.categoria))].map(x => <option key={x}>
        {x}
        </option>)}
    </select>
    <select aria-label="Marca" value={brand} onChange={e => setBrand(e.target.value)}>
        {['Todas', ...new Set(s.products.map(p => p.marca))].map(x => <option key={x}>
        {x}
        </option>)}
    </select>
    </div>
    <p>
    {rows.length} productos
    </p>
    <div className="products">
    {rows.slice(0, limit).map(p => <Card key={p.id} p={p}/>)}
    </div>
        {rows.length > limit && <IonButton expand="block" fill="outline" onClick={() => setLimit(x => x + 24)}>Ver más
        </IonButton>}
    </Screen>;
}
export function Detail() {
    const { id } = useParams(), s = useShop(), nav = useNavigate(), [n, setN] = useState(1);
    const p = s.products.find(x => x.id === id);
    if (!p)
        return <Screen title="Producto" back>
        <p>Producto no disponible.
        </p>
        </Screen>;
    return <Screen title="Detalle del producto" back>
    <Photo p={p}/>
    <Intro tag={`${p.marca} · ${p.categoria}`} title={p.nombre}>
    {p.descripcion}
    </Intro>
    <h2>
    {money(p.precio_cop)}
    </h2>
    <Reason p={p}/>
    <section className="panel">
    <h3>Selecciona tu tono
    </h3>
    <div className="tones">
        {s.products.filter(x => x.nombre === p.nombre && x.marca === p.marca && x.active !== false).map(x => <button key={x.id} className={x.id === p.id ? 'selected' : ''} onClick={() => {
                setN(1);
                nav('/product/' + x.id);
            }}>
        {x.swatch_image ? <img src={x.swatch_image} alt={'Tono ' + x.tono}/> : <span className="swatch" style={{ background: x.color_hex }}/>}
        {x.tono}
        </button>)}
    </div>
    <p className="muted">
    {p.swatch_image ? 'Fotografía de referencia del tono.' : 'Muestra digital orientativa; no es una foto del tono aplicado.'}
    </p>
    <p className="stock">
    {p.stock} disponibles
    </p>
    <input aria-label="Cantidad" type="number" min="1" max={p.stock} value={n} onChange={e => setN(Math.max(1, Math.min(p.stock, Number(e.target.value) || 1)))}/>
        {!s.admin && <IonButton expand="block" disabled={!p.stock} onClick={() => s.add(p, n)}>Añadir al carrito
        </IonButton>}
    <IonButton fill="outline" expand="block" onClick={() => nav('/translator?id=' + p.id)}>Buscar tono equivalente
    </IonButton>
    </section>
    </Screen>;
}
