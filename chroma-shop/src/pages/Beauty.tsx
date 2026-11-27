import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { IonButton, IonProgressBar } from '@ionic/react';
import { Card, Intro, Screen } from '../components/UI';
import { engine, useShop, type Beauty as Result, type Item } from '../context/Shop';
import questions from '../data/questions.json';
import QuestionCard from '../components/QuestionCard';
import type { Answers, Question } from '../services/types';
export function Colors() { const s = useShop(), nav = useNavigate(); return <Screen title="Mis colores">
<Intro tag="TU DIAGNÓSTICO · 12 ESTACIONES" title={s.beauty ? `Eres ${s.beauty.season}` : 'Tu paleta te está esperando'}>{s.beauty?.analysis.summary || 'Completa el cuestionario para descubrir tu estación cromática.'}</Intro>{s.beauty && <section className="panel">
<div className="palette">{s.beauty.analysis.palette.map((c, i) => <span key={i} style={{ background: c }}/>)}</div>
<p>Subtono: {s.beauty.undertone}</p>
<div className="products">{s.products.filter(p => p.estacion === s.beauty?.season && p.stock > 0).slice(0, 4).map(p => <Card key={p.id} p={p}/>)}</div>
</section>}<IonButton expand="block" onClick={() => nav('/questionnaire')}>{s.beauty ? 'Repetir diagnóstico' : 'Empezar diagnóstico'}</IonButton>
<IonButton expand="block" fill="outline" onClick={() => nav('/translator')}>Traductor de tonos</IonButton>
<IonButton expand="block" fill="outline" onClick={() => nav('/advisor')}>Asesor personalizado</IonButton>
</Screen>; }
export function Quiz() { const s = useShop(), nav = useNavigate(), [photo, setPhoto] = useState(''), [cameraBusy, setCameraBusy] = useState(false), [cameraError, setCameraError] = useState(''), [mode, setMode] = useState<'quick' | 'full' | null>(null), [step, setStep] = useState(0), [answers, setAnswers] = useState<Answers>({}), [busy, setBusy] = useState(false), [err, setErr] = useState(''); async function takePhoto() { setCameraBusy(true); setCameraError(''); try { const pic = await Camera.getPhoto({quality: 75, resultType: CameraResultType.Uri, source: CameraSource.Camera}); if (pic.webPath) setPhoto(pic.webPath); } catch { setCameraError('No se tomó la fotografía. Puedes continuar sin ella.'); } finally { setCameraBusy(false); } } const quickKeys = ['skin_tone', 'undertone_self', 'metal', 'clothes', 'hair_depth', 'eye_depth', 'contrast', 'depth_best', 'chromatic_best', 'muted_effect', 'skin_type', 'finish', 'budget']; const all = (questions as Question[]).filter(q => mode !== 'quick' || quickKeys.includes(q.key)), q = all[step]; async function next() { if (!answers[q.key])
    return; if (step < all.length - 1) {
    setStep(step + 1);
    return;
} setBusy(true); setErr(''); try {
    const r = await engine<Result>('analyze', { answers: { ...answers, budget: Number(answers.budget), _questionnaire_version: 2, _mode: mode } });
    await s.saveBeauty(r);
    nav('/colors');
}
catch (e) {
    setErr(String(e));
}
finally {
    setBusy(false);
} } if (!mode)
    return <Screen title="Diagnóstico de color" back>
<Intro tag="ELIGE TU DIAGNÓSTICO" title="Descubre tus colores">El resultado es orientativo.</Intro>
<IonButton expand="block" onClick={() => setMode('quick')}>Rápido · 13 preguntas</IonButton>
<IonButton expand="block" fill="outline" onClick={() => setMode('full')}>Completo · 27 preguntas</IonButton>
</Screen>; return <Screen title="Diagnóstico de color" back>
{step === 0 && <section className="panel"><h2>Fotografía opcional</h2><p>Úsala como referencia visual para responder las preguntas. No se envía al servidor ni se analiza automáticamente.</p>{photo && <img src={photo} alt="Referencia para el diagnóstico" style={{maxHeight: 220, maxWidth: '100%', objectFit: 'contain'}}/>}<IonButton fill="outline" disabled={cameraBusy} onClick={() => void takePhoto()}>{photo ? 'Repetir fotografía' : 'Tomar fotografía'}</IonButton>{photo && <IonButton fill="clear" onClick={() => setPhoto('')}>Quitar fotografía</IonButton>}<p role="status">{cameraError}</p></section>}
<p>Pregunta {step + 1} de {all.length}</p>
<IonProgressBar value={(step + 1) / all.length}/>
<QuestionCard question={q} value={String(answers[q.key] || '')} onChange={v => setAnswers(a => ({ ...a, [q.key]: v }))}/>
<IonButton fill="outline" disabled={!step || busy} onClick={() => setStep(step - 1)}>Anterior</IonButton>
<IonButton disabled={!answers[q.key] || busy} onClick={() => void next()}>{busy ? 'Analizando…' : step === all.length - 1 ? 'Ver resultado' : 'Siguiente'}</IonButton>
<p role="alert">{err}</p>
</Screen>; }
export function Translator() { const s = useShop(), [params] = useSearchParams(), [id, setId] = useState(params.get('id') || ''), [q, setQ] = useState(''), [rows, setRows] = useState<Item[]>([]), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false); async function run() { setBusy(true); setMsg(''); setRows([]); try {
    const r = await engine<{
        results: Item[];
        method: string;
    }>('translator', { product_id: id, products: s.products.filter(p => p.active !== false) });
    setRows(r.results.map(x => s.products.find(p => p.id === x.id)!).filter(Boolean));
    setMsg(r.results.length ? r.method : 'No se encontraron equivalencias suficientemente cercanas.');
}
catch (e) {
    setMsg(String(e));
}
finally {
    setBusy(false);
} } return <Screen title="Traductor de tonos" back>
<Intro tag="CHROMA · EQUIVALENCIAS" title="Encuentra tu tono equivalente">Compara colores digitales entre marcas.</Intro>
<input placeholder="Buscar referencia" value={q} onChange={e => setQ(e.target.value)}/>
<select aria-label="Referencia" value={id} onChange={e => setId(e.target.value)}>
<option value="">Selecciona un tono</option>{s.products.filter(p => p.id === id || `${p.marca} ${p.nombre} ${p.tono}`.toLowerCase().includes(q.toLowerCase())).map(p => <option key={p.id} value={p.id}>{p.marca} · {p.tono}</option>)}</select>
<IonButton expand="block" disabled={!id || busy} onClick={() => void run()}>Buscar equivalencias</IonButton>
<p>{msg}</p>
<div className="products">{rows.map(p => <Card key={p.id} p={p}/>)}</div>
</Screen>; }
export function Advisor() { const s = useShop(), nav = useNavigate(), [occasion, setOccasion] = useState('universidad'), [budget, setBudget] = useState(200000), [rows, setRows] = useState<Item[]>([]), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false); async function run() { if (!s.beauty) {
    nav('/questionnaire');
    return;
} setBusy(true); setRows([]); setMsg(''); try {
    const r = await engine<{
        items: {
            product?: Item;
        }[];
        tips: string[];
    }>('advisor', { occasion, budget, answers: s.beauty.answers, products: s.products.filter(p => p.active !== false) });
    setRows(r.items.flatMap(x => x.product ? [x.product] : []));
    setMsg(r.tips.join(' '));
}
catch (e) {
    setMsg(String(e));
}
finally {
    setBusy(false);
} } return <Screen title="Asesor personalizado" back>
<Intro tag="CHROMA · ASESOR" title="Arma tu look ideal">Elige una ocasión y tu presupuesto.</Intro>
<select value={occasion} onChange={e => setOccasion(e.target.value)}>
<option value="universidad">Universidad o trabajo</option>
<option value="noche">Evento de noche</option>
<option value="cita">Cita o salida</option>
<option value="aire_libre">Aire libre</option>
</select>
<label>Presupuesto COP<input type="number" min="0" value={budget} onChange={e => setBudget(Number(e.target.value))}/>
</label>
<IonButton expand="block" disabled={busy || budget < 0} onClick={() => void run()}>Generar mi look</IonButton>
<p>{msg}</p>{rows.length > 0 && <IonButton expand="block" onClick={() => rows.forEach(p => s.add(p))}>Añadir look al carrito</IonButton>}<div className="products">{rows.map(p => <Card key={p.id} p={p}/>)}</div>
</Screen>; }
