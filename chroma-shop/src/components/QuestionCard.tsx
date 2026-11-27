import { IonRadioGroup, IonRadio, IonNote } from '@ionic/react';
import type { ReactElement } from 'react';
import type { Option, Question } from '../services/types';
/** Muestra visual de una opción: foto de referencia si existe; si no, círculos con los colores. */
function OptionVisual({ option }: {
    option: Option;
}): ReactElement | null {
    if (option.image)
        return <img className="ch-option-photo" src={option.image} alt="" aria-hidden="true" loading="lazy"/>;
    if (!option.colors?.length)
        return null;
    return <span className="ch-swatches" aria-hidden="true">
    
    {option.colors.map((c, i) => <span key={i} className={`ch-swatch ${option.finish ? `ch-finish-${option.finish}` : ''} ${c.toUpperCase() === '#FFFFFF' ? 'ch-swatch-white' : ''}`} style={{ background: c }}/>)}
  
    </span>;
}
export default function QuestionCard({ question, value, onChange }: {
    question: Question;
    value?: string;
    onChange: (value: string) => void;
}): ReactElement {
    // Con fotos, las opciones se muestran como tarjetas en dos columnas para que la foto se vea grande
    const withPhotos = question.options.some(o => o.image);
    return <section className="ch-question-panel">
    
    <h2>
    {question.heading}
    </h2>
    
    <p className="ch-question-hint">
    {question.hint}
    </p>
    
    <IonRadioGroup value={value || ''} onIonChange={e => onChange(String(e.detail.value))}>
      
    <div className={`ch-option-list ${withPhotos ? 'ch-option-grid' : ''}`}>
        {question.options.map(option => <label key={option.value} className={`ch-option ${value === option.value ? 'selected' : ''}`}>
          
        <IonRadio value={option.value} labelPlacement="end" justify="start">
            
        <span className="ch-option-label">
        <OptionVisual option={option}/>
        <span>
        {option.label}
        </span>
        </span>
          
        </IonRadio>
        
        </label>)}
      
    </div>
    
    </IonRadioGroup>
    
        {question.photo && <IonNote className="ch-photo-note">✦ Compáralo con luz natural y sin filtros. Es una pista orientativa.
        </IonNote>}
  
    </section>;
}
