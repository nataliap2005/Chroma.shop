"""Motores independientes: equivalencias cromáticas y asesor por ocasión.

Los colores son los publicados por las marcas (nivel B). ΔE00 describe distancia entre
colores digitales: no asegura que el tono se vea igual en piel.
"""
from __future__ import annotations
import json
import math

# Límite prudente para muestras HEX ilustrativas: no mostrar tonos distintos como 'dupes'.
# Es un filtro para una DEMO, no una garantía de equivalencia en piel.
MAX_DELTA_E = 4.0          # datos de referencia (nivel C), si se vuelven a cargar
MAX_DELTA_E_OFICIAL = 3.0  # colores oficiales de la marca (nivel B)

OCCASIONS = {
 'universidad': {'name':'Universidad o trabajo', 'description':'Look natural y práctico para el día a día.', 'categories':['Base','Corrector','Rubor','Labial']},
 'noche': {'name':'Evento de noche', 'description':'Look más definido para una ocasión formal.', 'categories':['Base','Corrector','Rubor','Iluminador','Sombras','Labial']},
 'cita': {'name':'Cita o salida', 'description':'Un look equilibrado y versátil.', 'categories':['Base','Rubor','Labial','Sombras']},
 'aire_libre': {'name':'Plan al aire libre', 'description':'Look ligero para una ocasión informal.', 'categories':['Base','Bronzer','Rubor','Labial']},
}


def _lab_from_hex(value):
    s=str(value).lstrip('#')
    if len(s)!=6:raise ValueError('Muestra de color inválida')
    channels=[int(s[i:i+2],16)/255 for i in (0,2,4)]
    r,g,b=[v/12.92 if v<=.04045 else ((v+.055)/1.055)**2.4 for v in channels]
    x=(.4124564*r+.3575761*g+.1804375*b)/.95047
    y=(.2126729*r+.7151522*g+.0721750*b)
    z=(.0193339*r+.1191920*g+.9503041*b)/1.08883
    def f(t):return t**(1/3) if t>(6/29)**3 else t/(3*(6/29)**2)+4/29
    X,Y,Z=f(x),f(y),f(z)
    return (116*Y-16,500*(X-Y),200*(Y-Z))


def _delta_e_2000(lab1,lab2):
    """Implementación sin dependencias de CIEDE2000 (kL=kC=kH=1)."""
    L1,a1,b1=lab1;L2,a2,b2=lab2
    C1=math.hypot(a1,b1);C2=math.hypot(a2,b2)
    Cm=(C1+C2)/2
    G=.5*(1-math.sqrt(Cm**7/(Cm**7+25**7)))
    ap1=(1+G)*a1;ap2=(1+G)*a2
    Cp1=math.hypot(ap1,b1);Cp2=math.hypot(ap2,b2)
    h1=math.degrees(math.atan2(b1,ap1))%360
    h2=math.degrees(math.atan2(b2,ap2))%360
    dL=L2-L1;dC=Cp2-Cp1
    if Cp1*Cp2==0:dh=0
    elif abs(h2-h1)<=180:dh=h2-h1
    elif h2<=h1:dh=h2-h1+360
    else:dh=h2-h1-360
    dH=2*math.sqrt(Cp1*Cp2)*math.sin(math.radians(dh/2))
    Lm=(L1+L2)/2;Cpm=(Cp1+Cp2)/2
    if Cp1*Cp2==0:hm=h1+h2
    elif abs(h1-h2)<=180:hm=(h1+h2)/2
    elif h1+h2<360:hm=(h1+h2+360)/2
    else:hm=(h1+h2-360)/2
    T=(1-.17*math.cos(math.radians(hm-30))+.24*math.cos(math.radians(2*hm))
         +.32*math.cos(math.radians(3*hm+6))-.20*math.cos(math.radians(4*hm-63)))
    dtheta=30*math.exp(-((hm-275)/25)**2)
    RC=2*math.sqrt(Cpm**7/(Cpm**7+25**7))
    SL=1+.015*(Lm-50)**2/math.sqrt(20+(Lm-50)**2)
    SC=1+.045*Cpm;SH=1+.015*Cpm*T
    RT=-math.sin(math.radians(2*dtheta))*RC
    return math.sqrt((dL/SL)**2+(dC/SC)**2+(dH/SH)**2+RT*(dC/SC)*(dH/SH))


def translate_shades(rows, product_id, limit=5, max_price=None, only_cheaper=False):
    """Busca muestras cromáticamente cercanas, NO cualquier tono de menor precio.

    Primero verifica categoría/marca, precio y ΔE00 <= MAX_DELTA_E.
    Un conjunto vacío es correcto: la app nunca anuncia tonos diferentes como dupes.
    """
    catalog=[dict(r) for r in rows]
    chosen=next((p for p in catalog if p['id']==product_id),None)
    if chosen is None:raise ValueError('Selecciona un producto de referencia válido.')
    if chosen.get('panes'):raise ValueError('Las paletas tienen varias sombras: el traductor compara tonos individuales.')
    origin=_lab_from_hex(chosen['color_hex'])
    candidates=[]
    compared=0
    rejected_by_color=0
    for p in catalog:
        if p['id']==chosen['id'] or p['categoria']!=chosen['categoria'] or p['marca']==chosen['marca']:
            continue
        # Reglas de confiabilidad: solo tonos sin alertas de calidad; con datos oficiales (nivel B)
        # se exige además el mismo subtono y ΔE00 <= 3.
        if p.get('calidad','ok')!='ok' or chosen.get('calidad','ok')!='ok' or p.get('panes'):continue
        oficial=p.get('nivel')=='B' and chosen.get('nivel')=='B'
        if oficial and p['subtono']!=chosen['subtono']:continue
        if max_price is not None and int(p['precio_cop'])>max_price:continue
        if only_cheaper and int(p['precio_cop'])>=int(chosen['precio_cop']):continue
        compared+=1
        delta=_delta_e_2000(origin,_lab_from_hex(p['color_hex']))
        if delta>(MAX_DELTA_E_OFICIAL if oficial else MAX_DELTA_E):
            rejected_by_color+=1
            continue
        result={k:p[k] for k in ('id','nombre','marca','categoria','tono','color_hex','acabado','subtono')}
        result.update(nivel_dato=p.get('nivel','C'),imagen=p.get('imagen',''),precio_fuente=p.get('precio_fuente',''))
        result['precio_cop']=int(p['precio_cop']);result['delta_e00']=round(delta,2)
        result['ahorro_cop']=int(chosen['precio_cop'])-int(p['precio_cop'])
        result['nivel']='Muestra muy cercana' if delta<=2 else 'Muestra cercana: verificar subtono'
        result['subtono_diferente']=p['subtono']!=chosen['subtono']
        candidates.append(result)
    candidates.sort(key=lambda p:(p['delta_e00'],p['precio_cop']))
    reference={k:chosen[k] for k in ('id','nombre','marca','categoria','tono','color_hex','subtono')}
    reference['precio_cop']=int(chosen['precio_cop'])
    return {'reference':reference,'results':candidates[:limit], 'total':len(candidates),
            'compared':compared,'rejected_by_color':rejected_by_color,
            'max_delta_e00':MAX_DELTA_E,
            'method':('Colores oficiales de la marca, misma categoría, mismo subtono y ΔE00 ≤ 3. '
                      'Es una equivalencia de color digital: pruébalo en tienda antes de comprar.')}


ZONAS_SOMBRA=[('claro','Arco de la ceja y lagrimal'),('medio','Párpado móvil'),
              ('semioscuro','Pliegue del párpado'),('oscuro','Esquina externa')]


def guia_sombras(product, occasion):
    """Dónde va cada sombra. De día: claro y medio; de noche (o cita): las cuatro zonas."""
    panes=json.loads(product['panes']) if product.get('panes') else [
        {'nombre':product['tono'],'hex':product['color_hex'],'zona':_zona(product['color_hex'])}]
    usar=[z for z,_ in ZONAS_SOMBRA] if occasion in ('noche','cita') else ['claro','medio']
    guia=[]
    for z,lugar in ZONAS_SOMBRA:
        if z not in usar:continue
        sombras=[{'nombre':x['nombre'],'hex':x['hex']} for x in panes if x['zona']==z]
        if sombras:guia.append({'zona':z,'lugar':lugar,'sombras':sombras})
    return guia


def _zona(hex_color):
    L=_lab_from_hex(hex_color)[0]
    return 'claro' if L>=75 else 'medio' if L>=60 else 'semioscuro' if L>=45 else 'oscuro'


def recommend_look(products, owned_ids, profile, occasion, budget):
    cfg=OCCASIONS[occasion]
    owned=set(owned_ids)
    bycategory={}
    for cat in cfg['categories']:
        options=sorted((p for p in products if p['categoria']==cat and p.get('calidad','ok')=='ok'),
                       key=lambda p:(p['compatibilidad']['score'] if p['compatibilidad']['score'] is not None else 0),reverse=True)
        available=[p for p in options if p['id'] in owned]
        if available:
            selected=available[0]
            bycategory[cat]={'status':'en_cosmetiquera','product':selected,'reason':'Ya lo tienes y puede reutilizarse para esta ocasión.'}
        elif options:
            bycategory[cat]={'status':'pendiente','options':options}
        else:
            bycategory[cat]={'status':'sin_catalogo'}
    remaining=budget
    for cat in cfg['categories']:
        entry=bycategory[cat]
        if entry['status']!='pendiente':continue
        valid=[p for p in entry['options'] if p['precio_cop']<=remaining]
        if valid:
            # De noche o en una cita se prefiere una paleta: trae sombras para las cuatro zonas del ojo
            extra=lambda p:15 if cat=='Sombras' and p.get('panes') and occasion in ('noche','cita') else 0
            selected=max(valid,key=lambda p:(p['compatibilidad']['score'] or 0)+extra(p)-p['precio_cop']/15000)
            entry.update({'status':'sugerido','product':selected,
                          'reason':'Alternativa del catálogo para completar este look sin superar el presupuesto restante.'})
            remaining-=selected['precio_cop']
        else:
            entry.update({'status':'sin_presupuesto','product':None,'reason':'No encontramos una opción en el presupuesto restante.'})
        entry.pop('options',None)
    result=[]
    for cat in cfg['categories']:
        entry=bycategory[cat]
        entry.pop('options',None)
        if cat=='Sombras' and entry.get('product'):
            entry['aplicacion']=guia_sombras(entry['product'],occasion)
        result.append({'category':cat,**entry})
    a=profile['answers']
    undertone=profile['undertone']
    if undertone=='frio':palette_tip='Prueba labiales o rubores con matices rosados o fríos, según tu preferencia.'
    elif undertone=='calido':palette_tip='Prueba matices durazno, terracota y dorados si armonizan con tu rostro.'
    else:palette_tip='Compara opciones cálidas y frías; la evaluación es orientativa.'
    contrast=a.get('contrast','medio')
    if contrast=='alto':contrast_tip='Puedes explorar combinaciones con mayor contraste para definir labios u ojos.'
    elif contrast=='bajo':contrast_tip='Puedes probar transiciones suaves y tonos cercanos entre sí.'
    else:contrast_tip='Una intensidad media puede ser un punto de partida para tu maquillaje.'
    occasion_tip={'universidad':'Para el día a día, prioriza pasos sencillos y los productos que ya tienes.',
                  'noche':'Para un evento de noche, puedes intensificar labios u ojos según lo que prefieras.',
                  'cita':'Combina un punto de atención con tonos de intensidad equilibrada.',
                  'aire_libre':'Prefiere una aplicación ligera según el clima y tu comodidad.'}[occasion]
    eyes={'azul':'ojos azules','verde':'ojos verdes','miel':'ojos miel','cafe':'ojos cafés','negro':'ojos oscuros'}.get(a.get('eyes'),'tus ojos')
    eyes_tip=f'Para {eyes}, prueba tonos de sombras de la paleta sugerida y ajusta su intensidad según tu gusto.'
    tips=[palette_tip,contrast_tip,eyes_tip,occasion_tip]
    total=budget-remaining
    return {'occasion':occasion,'occasion_name':cfg['name'],'description':cfg['description'],
            'budget':budget,'spent':total,'remaining':remaining,
            'items':result,'tips':tips,'owns':sum(x['status']=='en_cosmetiquera' for x in result),
            'missing':sum(x['status']=='sin_presupuesto' for x in result),
            'note':'Selección con reglas a partir de colores oficiales y precios de tiendas colombianas; las recomendaciones no garantizan coincidencia física del tono.'}
