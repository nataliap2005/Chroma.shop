import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { IonButton } from '@ionic/react';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { requireSupabase } from '../lib/supabase';
import { useShop } from '../context/Shop';
import { Screen, Intro, Card } from '../components/UI';
export function Account() {
    const s = useShop(), nav = useNavigate(), [reg, setReg] = useState(false), [email, setEmail] = useState(''), [pass, setPass] = useState(''), [name, setName] = useState(''), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false);
    async function auth() {
        setBusy(true);
        setMsg('');
        try {
            const db = requireSupabase();
            const r = reg ? await db.auth.signUp({ email, password: pass, options: { data: { display_name: name } } }) : await db.auth.signInWithPassword({ email, password: pass });
            if (r.error)
                throw r.error;
            setPass('');
            if (reg && !r.data.session)
                setMsg('Revisa tu correo para confirmar la cuenta.');
        }
        catch (e) {
            setMsg(e instanceof Error ? e.message : String(e));
        }
        finally {
            setBusy(false);
        }
    }
    async function upload(blob: Blob) {
        if (!s.user)
            return;
        const db = requireSupabase(), path = s.user.id + '/avatar-' + Date.now() + '.jpg';
        const r = await db.storage.from('shop-avatars').upload(path, blob, { contentType: blob.type || 'image/jpeg' });
        if (r.error)
            throw r.error;
        const p = await db.from('profiles').upsert({ id: s.user.id, name: s.user.user_metadata.display_name || '', avatar: path });
        if (p.error)
            throw p.error;
        const signed = await db.storage.from('shop-avatars').createSignedUrl(path, 3600);
        s.setAvatar(signed.data?.signedUrl || '');
    }
    async function camera() {
        try {
            const pic = await Camera.getPhoto({ quality: 80, resultType: CameraResultType.Uri, source: CameraSource.Camera });
            if (pic.webPath)
                await upload(await (await fetch(pic.webPath)).blob());
        }
        catch (e) {
            setMsg(String(e));
        }
    }
    return <Screen title="Mi cuenta Chroma">
        {!s.ready ? <p>Consultando sesión…
        </p> : s.user ? <><div className="profile">
            {s.avatar ? <img src={s.avatar} alt="Foto de perfil"/> : <span className="avatar">♡
            </span>}
        <IonButton fill="outline" onClick={() => void camera()}>Tomar fotografía
        </IonButton>
        <label className="file-label">Elegir foto
        <input type="file" accept="image/*" capture="user" onChange={e => {
                const f = e.target.files?.[0];
                if (f)
                    void upload(f).catch(x => setMsg(String(x)));
            }}/>
        </label>
        <h2>
        {s.user.user_metadata.display_name || 'Mi perfil'}
        </h2>
        <p>
        {s.user.email}
        </p>
        <p>
        {s.admin ? 'Administrador' : s.beauty?.season || 'Cliente'}
        </p>
        </div><div className="menu">
            {[['Mis pedidos', '/orders'], ['Mis favoritos', '/favorites'], ['Mis colores', '/colors'], ['Tiendas cercanas', '/stores'], ...(s.admin ? [['Panel de administración', '/admin']] : [])].map(([label, path]) => <button key={path} onClick={() => nav(path)}>
            {label} →
            </button>)}
        </div><IonButton fill="outline" expand="block" onClick={() => void requireSupabase().auth.signOut().then(r => {
                if (r.error)
                    setMsg(r.error.message);
                else {
                    s.clear();
                    setMsg('');
                }
            })}>Cerrar sesión
        </IonButton></> : <><Intro tag="BIENVENIDA" title="Mi cuenta Chroma"/><div className="switch">
        <button className={!reg ? 'selected' : ''} onClick={() => setReg(false)}>Entrar
        </button>
        <button className={reg ? 'selected' : ''} onClick={() => setReg(true)}>Registrarse
        </button>
        </div><form onSubmit={e => {
                e.preventDefault();
                void auth();
            }}>
            {reg && <label>Nombre
            <input required value={name} onChange={e => setName(e.target.value)}/>
            </label>}
        <label>Correo
        <input required type="email" value={email} onChange={e => setEmail(e.target.value)}/>
        </label>
        <label>Contraseña
        <input required type="password" minLength={6} value={pass} onChange={e => setPass(e.target.value)}/>
        </label>
        <IonButton expand="block" type="submit" disabled={busy}>
        {reg ? 'Crear cuenta' : 'Ingresar'}
        </IonButton>
        </form></>}
    <p role="alert">
    {msg}
    </p>
    </Screen>;
}
export function Favorites() {
    const s = useShop();
    return <Screen title="Mis favoritos" back>
    <div className="products">
    {s.products.filter(p => s.favorites.includes(p.id) && p.active !== false).map(p => <Card key={p.id} p={p}/>)}
    </div>
        {!s.favorites.length && <p>Aún no tienes favoritos.
        </p>}
    </Screen>;
}
