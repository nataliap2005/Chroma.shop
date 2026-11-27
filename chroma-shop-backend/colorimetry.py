"""Colorimetría de 12 estaciones: puntuaciones HEURÍSTICAS, no diagnóstico validado.

Se valoran CUATRO EJES independientes:
 - temperatura: frío(-1) / cálido(+1)
 - profundidad: claro(-1) / profundo(+1)
 - saturación: suave(-1) / brillante(+1)
 - contraste: bajo(-1) / alto(+1)

La piel clara NO equivale a Verano y el color de venas pesa muy poco.
"""
from questionnaire import QUESTIONNAIRE_VERSION, QUESTION_BY_KEY

# Cada tupla es: eje, intensidad entre -1 y +1, peso de la pista.
EVIDENCE = {
 'undertone_self': {'frio':('temp',-1,1.1),'calido':('temp',1,1.1),'neutro':('temp',0,0.5),'oliva':('temp',0,0.4)},
 'veins':{'azules':('temp',-1,0.20),'verdes':('temp',1,0.20)},
 'metal':{'plata':('temp',-1,1.3),'oro':('temp',1,1.3)},
 'white':{'puro':('temp',-1,1.1),'marfil':('temp',1,1.1)},
 'clothes':{'frios':('temp',-1,1.7),'calidos':('temp',1,1.7)},
 'lip_temp':{'berry':('temp',-1,1.5),'rosa':('temp',-.7,1.1),'rojo':('temp',-.2,.5),'durazno':('temp',.7,1.1),'coral':('temp',1,1.5)},
 'blush_temp':{'rosa':('temp',-1,1.0),'durazno':('temp',1,1.0)},
 'foundation_temp':{'rosado':('temp',-1,1.4),'dorado':('temp',1,1.4),'neutro':('temp',0,0.6),'oliva':('temp',0,0.4)},
 'hair_depth': {'muy_claro':('depth',-1,0.9),'claro':('depth',-.55,0.9),'medio':('depth',.3,0.9),'oscuro':('depth',1,0.9)},
 'eye_depth':{'claro':('depth',-.8,.65),'medio':('depth',.15,.65),'oscuro':('depth',.8,.65)},
 'depth_best':{'profundos':('depth',1,2.2),'claros':('depth',-1,2.2),'intermedios':('depth',0,1)},
 'lip_depth':{'profundo':('depth',1,1.1),'claro':('depth',-1,1.1),'medio':('depth',0,.5)},
 'contrast':{'bajo':('contrast',-1,2.0),'medio':('contrast',0,1.2),'alto':('contrast',1,2.0)},
 'brow_contrast':{'suaves':('contrast',-1,1.0),'medias':('contrast',0,.65),'marcadas':('contrast',1,1.0)},
 'chromatic_best':{'favorecen':('chroma',1,1.8),'dominan':('chroma',-1,1.8),'intermedio':('chroma',0,.7)},
 'muted_effect':{'favorecen':('chroma',-1,1.6),'apagan':('chroma',1,1.6),'intermedio':('chroma',0,.6)},
 'vivid_effect':{'fuerte':('chroma',1,1.5),'polvoso':('chroma',-1,1.5),'intermedio':('chroma',0,.7)},
 'makeup_intensity':{'definido':('chroma',1,1.1),'difuminado':('chroma',-1,1.1),'equilibrado':('chroma',0,.6)},
 'clear_vs_dusty':{'electrico':('chroma',1,1.1),'grisaceo':('chroma',-1,1.1),'medio':('chroma',0,.6)},
}

# Prototipos de referencia. Un mismo eje puede existir en varias estaciones.
# Aumentar respuestas reduce la ambigüedad, pero no garantiza clasificación correcta.
SEASON_SIGNATURES = {
 'Invierno profundo':  {'temp':-.9,'depth':1.,'chroma':.50,'contrast':.9},
 'Invierno frío':      {'temp':-1.,'depth':.28,'chroma':.42,'contrast':.65},
 'Invierno brillante': {'temp':-.8,'depth':.12,'chroma':1.,'contrast':.85},
 'Verano claro':       {'temp':-.7,'depth':-1.,'chroma':-.45,'contrast':-.45},
 'Verano frío':        {'temp':-1.,'depth':-.16,'chroma':-.40,'contrast':-.15},
 'Verano suave':       {'temp':-.60,'depth':-.14,'chroma':-1.,'contrast':-.65},
 'Otoño profundo':     {'temp':.9,'depth':1.,'chroma':-.33,'contrast':.65},
 'Otoño cálido':       {'temp':1.,'depth':.22,'chroma':-.34,'contrast':.10},
 'Otoño suave':        {'temp':.65,'depth':-.18,'chroma':-1.,'contrast':-.45},
 'Primavera clara':    {'temp':.7,'depth':-1.,'chroma':.40,'contrast':-.20},
 'Primavera cálida':   {'temp':1.,'depth':-.20,'chroma':.55,'contrast':.25},
 'Primavera brillante':{'temp':.7,'depth':.05,'chroma':1.,'contrast':.80},
}
AXIS_WEIGHTS={'temp':2.7,'depth':1.6,'chroma':1.75,'contrast':1.1}

PALETTES={
 'Invierno profundo':['#171E32','#74223E','#24435F','#0D564B','#ECECEC','#52216F'],
 'Invierno frío':['#14365E','#BE1E4C','#FCFAF9','#34255B','#20848C','#1B1B27'],
 'Invierno brillante':['#E60050','#1469D2','#6C0FD0','#00A88A','#FFF9FF','#11151F'],
 'Verano claro':['#9CBBDD','#E5B9CB','#B2A8CF','#A8C8C4','#D8DCE5','#8A9FCA'],
 'Verano frío':['#7894C2','#BF8EAF','#6F719D','#B1BBCD','#DCC2D1','#648C91'],
 'Verano suave':['#918FA6','#AB91A0','#7D8F87','#C5B6C0','#8F9FA9','#A1A79D'],
 'Otoño profundo':['#793D2E','#55633A','#B87A36','#53382D','#9F4A30','#3B4940'],
 'Otoño cálido':['#D16A33','#8C6B2D','#BD812B','#946337','#A25528','#6D7132'],
 'Otoño suave':['#A17E69','#8D8B62','#C3A18A','#7E6B5E','#AB916C','#A66F65'],
 'Primavera clara':['#F3BFA6','#FFD88B','#A7CB9E','#7DC8C5','#F2A8C1','#D5CDA4'],
 'Primavera cálida':['#F28936','#F7C34D','#80AE58','#D36B54','#63B7AE','#D8A63F'],
 'Primavera brillante':['#F14D70','#ED9A18','#21AD8F','#4378D6','#FAE849','#E74C4D'],
}


def analyze(answers):
    if int(answers.get('_questionnaire_version', 1)) < QUESTIONNAIRE_VERSION:
        return {'needs_update':True,'version':1,'method':'legacy',
                'summary':'Tu perfil se creó con la versión anterior. Repite el test ampliado para estimar las 12 estaciones.',
                'alternatives':[], 'axes':{}, 'confidence':'Sin revisar', 'palette':[]}
    sums={k:0. for k in AXIS_WEIGHTS}; weights={k:0. for k in AXIS_WEIGHTS}
    polarity={'temp':[],'depth':[],'chroma':[],'contrast':[]}
    for key, opts in EVIDENCE.items():
        datum=opts.get(answers.get(key))
        if not datum:continue
        axis, value, weight=datum
        sums[axis]+=weight*value; weights[axis]+=weight
        if abs(value)>=.5:polarity[axis].append(value)
    axes={key:round(sums[key]/weights[key],3) if weights[key] else 0 for key in AXIS_WEIGHTS}
    distances=[]
    for season, signature in SEASON_SIGNATURES.items():
        distance=sum(AXIS_WEIGHTS[k] * (axes[k]-signature[k])**2 for k in AXIS_WEIGHTS)
        distances.append((distance,season))
    distances.sort()
    suggested=distances[0][1]
    # Distancia entre las 2 primeras y respuestas contradictorias; no es probabilidad.
    margin=distances[1][0]-distances[0][0]
    signals=sum(len(v) for v in polarity.values())
    contradictory=sum(bool(any(v<0 for v in data) and any(v>0 for v in data)) for data in polarity.values())
    if signals<8 or margin <.14 or contradictory>=3:confidence='Baja'
    elif margin<.38 or contradictory>=2:confidence='Media'
    else:confidence='Alta'
    user_selected=answers.get('season_known','no_se')
    if user_selected in SEASON_SIGNATURES:
        season=user_selected; method='confirmado_por_usuario';confidence='Elegida por ti'
    else:
        season=suggested;method='estimacion'
    family=season.split(' ')[0]
    undertone='frio' if family in ('Invierno','Verano') else 'calido'
    axis_words={
      'temp': 'tendencia fría' if axes['temp']<-.25 else 'tendencia cálida' if axes['temp']>.25 else 'temperatura poco definida',
      'depth': 'profundidad alta' if axes['depth']>.36 else 'profundidad clara' if axes['depth']<-.36 else 'profundidad media',
      'chroma': 'colores vivos' if axes['chroma']>.32 else 'colores suaves' if axes['chroma']<-.32 else 'saturación intermedia',
      'contrast': 'contraste alto' if axes['contrast']>.32 else 'contraste bajo' if axes['contrast']<-.32 else 'contraste medio',
    }
    if method=='confirmado_por_usuario':
        summary=f'Has confirmado {season} a partir de un análisis previo. Puedes cambiarlo cuando quieras.'
    else:
        summary='Estimación basada en '+', '.join(axis_words.values())+'. Compruébala comparando colores en luz natural.'
    if answers.get('_mode') == 'quick':
        if confidence == 'Alta':
            confidence = 'Media'
        summary = 'Diagnóstico rápido orientativo. ' + summary
    return {'needs_update':False,'version':QUESTIONNAIRE_VERSION, 'method':method,
            'season':season,'suggested':suggested,'undertone':undertone,'axes':axes,
            'axis_words':axis_words,'confidence':confidence,'margin':round(margin,3),
            'alternatives':[name for _,name in distances if name!=season][:2],
            'summary':summary,'palette':PALETTES[season]}


