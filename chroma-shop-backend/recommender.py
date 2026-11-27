"""Recomendador orientativo de colorimetría, acabado y presupuesto; sin filtro de ingredientes."""
from questionnaire import validate_questionnaire
from colorimetry import analyze


def validate_answers(data):
    return validate_questionnaire(data)


def classify(answers):
    analysis = analyze(answers)
    return analysis['undertone'], analysis['season']


def score(product, profile=None, feedback=None):
    if not profile or profile['analysis']['needs_update']:
        return {'score': None, 'factors': [], 'messages': ['Completa tu perfil para recibir sugerencias personalizadas.']}
    a = profile['answers']
    factors, messages = [], []
    def add(label, points, maximum, reason):
        factors.append({'label': label, 'points': points, 'maximum': maximum,
                        'ok': points >= maximum*.7, 'reason': reason})
        if points >= maximum*.7: messages.append(reason)
    depths=['claro','medio','oscuro','profundo']
    d=abs(depths.index(product['profundidad'])-depths.index(a['skin_tone']))
    add('Qué tan claro u oscuro es', [28,17,7,0][d], 28, 'Es igual de claro u oscuro que tu piel.')
    target=profile['undertone']; candidate=product['subtono']
    add('Subtono', 25 if target==candidate else 16 if 'neutro' in (target,candidate) else 5, 25,
        'Tiene el mismo matiz de fondo que tu piel (frío, cálido o neutro).')
    season=profile['season']
    add('Tu estación de color', 17 if product['estacion']==season else 13 if product['estacion'].split()[0]==season.split()[0] else 8 if candidate==target else 3, 17,
        'Combina con los colores de tu estación.')
    add('Tipo de piel', 10 if a.get('skin_type') in product['tipos_piel'].split(';') else 4, 10,
        'Va bien con tu tipo de piel.')
    add('Acabado', 10 if a['finish']==product['acabado'] else 6 if product['acabado']=='satinado' else 2, 10,
        'Tiene el acabado que prefieres.')
    budget=int(a['budget'])
    add('Presupuesto',10 if product['precio_cop']<=budget else 4 if product['precio_cop']<=budget*1.2 else 0,10,
        'Está dentro de tu presupuesto por producto.')
    total=sum(f['points'] for f in factors)
    if feedback:
        resultado=feedback.get('tono_resultado')
        if resultado:
            total+={'acertado':6,'parcial':-6,'incorrecto':-20}[resultado]
            messages.insert(0,{'acertado':'Ya lo probaste y el tono te funcionó.',
                               'parcial':'Nos dijiste que el tono fue parcialmente acertado.',
                               'incorrecto':'Nos dijiste que este tono no te funcionó.'}[resultado])
        else:
            total+=4 if feedback['useful'] else -15
            messages.append('Tu valoración anterior se incorpora a la recomendación.')
    return {'score':max(0,min(100,round(total))), 'factors':factors,'messages':messages[:5]}


def shape_product(row,profile=None,feedback=None,favorite=False):
    d=dict(row)
    d['precio_cop']=int(d['precio_cop'])
    d['compatibilidad']=score(d,profile,feedback)
    d['favorito']=favorite
    return d
