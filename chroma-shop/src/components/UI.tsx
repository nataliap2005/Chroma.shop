import { IonPage, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonIcon } from '@ionic/react';
import { heart, heartOutline, bagAddOutline, arrowBackOutline } from 'ionicons/icons';
import { useNavigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useShop, money, type Item } from '../context/Shop';
export function Screen({ title, children, back = false }: {
    title: string;
    children: ReactNode;
    back?: boolean;
}) {
    const nav = useNavigate();
    return <IonPage>
    <IonHeader>
    <IonToolbar>
        {back && <IonButton slot="start" fill="clear" aria-label="Volver" onClick={() => nav(-1)}>
        <IonIcon icon={arrowBackOutline}/>
        </IonButton>}
    <IonTitle>
    {title}
    </IonTitle>
    </IonToolbar>
    </IonHeader>
    <IonContent>
    <main className="shop-wrap">
    {children}
    </main>
    </IonContent>
    </IonPage>;
}
export function Intro({ tag, title, children }: {
    tag: string;
    title: string;
    children?: ReactNode;
}) {
    return <header className="intro">
    <small>
    {tag}
    </small>
    <h1>
    {title}
    </h1>
        {children && <p>
        {children}
        </p>}
    </header>;
}
export function Photo({ p }: {
    p: Item;
}) {
    return <div className="product-photo">
    {p.imagen && (/^\/static\/img\//.test(p.imagen) || /^https:\/\//.test(p.imagen)) ? <img src={p.imagen} alt={p.nombre} loading="lazy"/> : <span style={{ background: p.color_hex }} className="swatch"/>}
    </div>;
}
export function Reason({ p }: {
    p: Item;
}) {
    const { beauty } = useShop();
    const messages = p.compatibilidad?.messages;
    return <p className="reason">
    {messages?.length ? messages[0] : beauty ? (p.estacion === beauty.season ? `Coincide con tu estación ${beauty.season}.` : p.subtono === beauty.undertone ? 'Comparte tu subtono; verifica el tono en piel.' : `Referencia cromática: ${p.estacion || 'sin clasificar'}.`) : 'Completa tu diagnóstico para personalizar.'}
    </p>;
}
export function Card({ p }: {
    p: Item;
}) {
    const s = useShop(), nav = useNavigate();
    return <article className="product-card">
    <button className="favorite" aria-label="Favorito" onClick={() => void s.favorite(p.id)}>
    <IonIcon icon={s.favorites.includes(p.id) ? heart : heartOutline}/>
    </button>
    <button className="photo-link" onClick={() => nav('/product/' + encodeURIComponent(p.id))}>
    <Photo p={p}/>
    </button>
    <small>
    {p.marca} · 
    {p.categoria}
    </small>
    <h3 onClick={() => nav('/product/' + encodeURIComponent(p.id))}>
    {p.nombre}
    </h3>
    <p>
    <span className="swatch" style={{ background: p.color_hex }}/> 
    {p.tono}
    </p>
    <strong>
    {money(p.precio_cop)}
    </strong>
    <span className={p.stock ? 'stock' : 'sold'}>
    {p.stock ? `En stock (${p.stock})` : 'Agotado'}
    </span>
    <Reason p={p}/>
        {!s.admin && <IonButton expand="block" disabled={!p.stock} onClick={() => s.add(p)}>
        <IonIcon slot="start" icon={bagAddOutline}/>Añadir al carrito
        </IonButton>}
    </article>;
}
