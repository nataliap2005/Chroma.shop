"""Especificación única del cuestionario Chroma v2 (UI y validación en servidor)."""

def q(key, section, title, hint, options, photo=False, multi=False):
    return {"key": key, "section": section, "heading": title, "hint": hint,
            "options": [{"value": value, "label": label} for value, label in options],
            "photo": photo, "multi": multi}

QUESTIONS = [
 q('skin_tone', 'Tu piel', '¿Qué tan clara u oscura es tu piel?',
   'Mírate sin maquillaje y con luz natural, por ejemplo cerca de una ventana. Esto ayuda a elegir el tono de base y corrector.',
   [('claro', 'Clara (porcelana o marfil)'), ('medio', 'Media (beige o trigueña)'), ('oscuro', 'Oscura (morena o canela)'), ('profundo', 'Muy oscura (ébano o chocolate)')]),
 q('undertone_self', 'Tu piel', '¿Qué color se nota por debajo de tu piel?',
   'Es tu subtono: el matiz de fondo de la piel, que no cambia aunque te broncees. Si no lo sabes, no pasa nada: las demás preguntas ayudan a calcularlo.',
   [('frio', 'Rosado o rojizo (subtono frío)'), ('calido', 'Dorado, amarillo o durazno (subtono cálido)'), ('neutro', 'Una mezcla de los dos (subtono neutro)'), ('oliva', 'Verdoso o grisáceo (subtono oliva)'), ('no_se', 'No lo sé')]),
 q('veins', 'Tu piel', 'Con luz natural, ¿de qué color ves las venas de tu muñeca?',
   'Mira la parte de adentro de la muñeca. Es solo una pista pequeña: no decide tu resultado.',
   [('azules', 'Azules o moradas'), ('verdes', 'Verdes'), ('mixtas', 'Una mezcla de azules y verdes'), ('no_se', 'No lo sé')], photo=True),
 q('sun', 'Tu piel', '¿Qué le pasa a tu piel cuando tomas sol sin protector?',
   'Piensa en lo que suele pasarte, por ejemplo en la playa. Esta respuesta no decide si tus colores son cálidos o fríos.',
   [('quema', 'Se enrojece y me quemo fácil'), ('broncea', 'Me bronceo fácil y casi no me quemo'), ('ambas', 'Primero me quemo un poco y luego me bronceo'), ('no_se', 'No lo sé')]),
 q('metal', 'Tu piel', '¿Qué joyas te quedan mejor: plateadas o doradas?',
   'Ponte (o imagina) unos aretes o un collar cerca de la cara, con luz natural y sin filtros. Elige con cuál tu cara se ve más luminosa y pareja.',
   [('plata', 'Plateadas'), ('oro', 'Doradas'), ('ambos', 'Las dos me quedan igual de bien'), ('no_se', 'No lo sé')]),
 q('white', 'Tu piel', '¿Qué blanco te queda mejor cerca de la cara?',
   'Compara una prenda blanca brillante con una color crema. Elige la que hace que tu piel se vea más pareja, con menos ojeras o manchas.',
   [('puro', 'Blanco puro (como una hoja de papel)'), ('marfil', 'Blanco crema o hueso'), ('ambos', 'Los dos igual'), ('no_se', 'No lo sé')]),
 q('clothes', 'Tu piel', '¿Con qué colores de ropa se ve mejor tu cara?',
   'Elige por cómo se ve tu piel con ese color cerca de la cara, no por tu color favorito.',
   [('frios', 'Azul rey, fucsia, morado (colores fríos)'), ('calidos', 'Coral, naranja, camel, terracota (colores cálidos)'), ('ambos', 'Los dos grupos por igual'), ('no_se', 'No lo sé')]),
 q('lip_temp', 'Tu piel', '¿Qué labiales te quedan mejor?',
   'Piensa en labiales que hayas usado o probado.',
   [('berry', 'Vino, cereza o frambuesa (rojos con fondo azulado)'), ('rosa', 'Rosa o nude rosado'), ('rojo', 'Rojo clásico'), ('durazno', 'Durazno o nude cálido'), ('coral', 'Coral, terracota o ladrillo (rojos con fondo naranja)'), ('ambos', 'Varios me quedan igual de bien'), ('no_se', 'No lo sé')]),
 q('blush_temp', 'Tu piel', '¿Qué color de rubor se ve más natural en ti?',
   'El rubor es el color que se pone en las mejillas.',
   [('rosa', 'Rosado o malva'), ('durazno', 'Durazno o coral'), ('ambos', 'Los dos por igual'), ('no_se', 'No lo sé')]),
 q('foundation_temp', 'Tu piel', 'Si usas base de maquillaje, ¿cuál te ha funcionado mejor?',
   'Responde solo si lo sabes por experiencia. Muchas marcas lo dicen en el nombre del tono: rosado, cálido, neutral u oliva.',
   [('rosado', 'Las de tono rosado (frías)'), ('dorado', 'Las de tono dorado o amarillo (cálidas)'), ('neutro', 'Las neutras: ni rosadas ni doradas'), ('oliva', 'Las de tono oliva o verdoso'), ('no_se', 'No uso base / no lo sé')]),
 q('hair', 'Tu cabello y tus ojos', '¿De qué color es tu cabello natural?',
   'El color con el que te crece, sin tintes ni mechas.',
   [('rubio', 'Rubio'), ('castano', 'Castaño'), ('negro', 'Negro'), ('rojizo', 'Pelirrojo o cobrizo'), ('otro', 'Canoso u otro')]),
 q('hair_depth', 'Tu cabello y tus ojos', '¿Qué tan claro u oscuro es tu cabello natural?',
   'Sin tintes ni mechas.',
   [('muy_claro', 'Muy claro (rubio claro o canoso)'), ('claro', 'Claro (rubio oscuro o castaño claro)'), ('medio', 'Medio (castaño)'), ('oscuro', 'Oscuro (castaño oscuro o negro)'), ('no_se', 'No lo sé')]),
 q('eyes', 'Tu cabello y tus ojos', '¿De qué color son tus ojos?',
   'Si tienen varios colores, elige el que más se nota.',
   [('azul', 'Azules'), ('verde', 'Verdes'), ('miel', 'Miel o avellana'), ('cafe', 'Cafés'), ('negro', 'Cafés muy oscuros, casi negros')]),
 q('eye_depth', 'Tu cabello y tus ojos', 'Con luz natural, ¿qué tan claros u oscuros se ven tus ojos?',
   'No importa el color, sino si se ven claros o muy oscuros.',
   [('claro', 'Claros'), ('medio', 'Intermedios'), ('oscuro', 'Oscuros'), ('no_se', 'No lo sé')]),
 q('contrast', 'Tu cabello y tus ojos', '¿Qué tanta diferencia hay entre tu piel, tu cabello y tus ojos?',
   'Ejemplo de mucha diferencia: piel clara con cabello negro. Ejemplo de poca diferencia: piel, cabello y ojos de tonos parecidos, como piel trigueña con cabello castaño.',
   [('bajo', 'Poca: son tonos parecidos'), ('medio', 'Algo de diferencia'), ('alto', 'Mucha: se notan muy distintos'), ('no_se', 'No lo sé')]),
 q('brow_contrast', 'Tu cabello y tus ojos', '¿Qué tanto resaltan tus cejas sobre tu piel?',
   'Sin maquillar las cejas. La forma no importa, solo qué tan oscuras se ven frente a tu piel.',
   [('suaves', 'Poco: casi se confunden con la piel'), ('medias', 'Algo'), ('marcadas', 'Mucho: son mucho más oscuras que mi piel'), ('no_se', 'No lo sé')]),
 q('depth_best', 'Colores que te favorecen', '¿Te quedan mejor los colores claros u oscuros?',
   'Imagina prendas cerca de tu cara. No es cuál te gusta más, sino con cuál se ve mejor tu piel.',
   [('profundos', 'Oscuros: vino, azul marino, verde botella'), ('claros', 'Claros: rosa pálido, celeste, crema'), ('intermedios', 'Ni muy claros ni muy oscuros'), ('no_se', 'No lo sé')]),
 q('lip_depth', 'Colores que te favorecen', '¿Te quedan mejor los labiales claros u oscuros?',
   'Piensa en cómo se ve tu cara completa, no solo los labios.',
   [('profundo', 'Oscuros: vino, ciruela, rojo oscuro'), ('claro', 'Claros: rosa claro o nude'), ('medio', 'Intermedios: rojo, rosa o durazno de intensidad media'), ('no_se', 'No lo sé')]),
 q('chromatic_best', 'Colores que te favorecen', '¿Cómo te ves con colores muy vivos y llamativos?',
   'Por ejemplo: rojo intenso, fucsia o azul eléctrico cerca de la cara.',
   [('favorecen', 'Me iluminan la cara'), ('dominan', 'Llaman más la atención que mi cara'), ('intermedio', 'No noto mucha diferencia'), ('no_se', 'No lo sé')]),
 q('muted_effect', 'Colores que te favorecen', '¿Cómo te ves con colores suaves y apagados?',
   'Son colores con un toque de gris, por ejemplo: rosa viejo, malva o verde salvia.',
   [('favorecen', 'Me quedan bien, se ven armoniosos'), ('apagan', 'Me hacen ver cansada o sin vida'), ('intermedio', 'Igual que con los colores vivos'), ('no_se', 'No lo sé')]),
 q('vivid_effect', 'Colores que te favorecen', 'Entre estos dos rosados, ¿cuál te quedaría mejor?',
   'Los dos son igual de claros; lo que cambia es qué tan vivo es el color.',
   [('fuerte', 'Fucsia intenso y vivo'), ('polvoso', 'Rosa viejo, suave y apagado'), ('intermedio', 'Un rosado intermedio'), ('no_se', 'No lo sé')]),
 q('makeup_intensity', 'Colores que te favorecen', '¿Qué tipo de maquillaje te favorece más?',
   'No es cuánto te gusta maquillarte, sino con cuál se ve más equilibrada tu cara.',
   [('definido', 'Intenso: labios u ojos marcados y de color fuerte'), ('difuminado', 'Suave: tonos ligeros y difuminados'), ('equilibrado', 'Intermedio'), ('no_se', 'No lo sé')]),
 q('clear_vs_dusty', 'Colores que te favorecen', '¿Qué azul te queda mejor cerca de la cara?',
   'Compara cómo se ve tu piel con cada color.',
   [('electrico', 'Azul eléctrico: brillante y limpio'), ('grisaceo', 'Azul grisáceo: suave y apagado'), ('medio', 'Un azul intermedio'), ('no_se', 'No lo sé')]),
 q('season_known', 'Colores que te favorecen', '¿Alguien ya te hizo un análisis de color y te dijo tu estación?',
   'Las estaciones (primavera, verano, otoño e invierno) agrupan los colores que mejor le quedan a cada persona. Si nunca te hicieron un análisis de color, elige la primera opción.',
   [('no_se', 'No, quiero que Chroma la calcule'), ('Invierno profundo', 'Invierno profundo'), ('Invierno frío', 'Invierno frío'), ('Invierno brillante', 'Invierno brillante'), ('Verano claro', 'Verano claro'), ('Verano frío', 'Verano frío'), ('Verano suave', 'Verano suave'), ('Otoño profundo', 'Otoño profundo'), ('Otoño cálido', 'Otoño cálido'), ('Otoño suave', 'Otoño suave'), ('Primavera clara', 'Primavera clara'), ('Primavera cálida', 'Primavera cálida'), ('Primavera brillante', 'Primavera brillante')]),
 q('skin_type', 'Tus preferencias', '¿Cómo está tu piel al final del día?',
   'Fíjate en tu cara al terminar un día normal, sin maquillaje.',
   [('seca', 'Seca: se siente tirante o se pela'), ('mixta', 'Mixta: brilla en frente, nariz y mentón, pero el resto no'), ('grasa', 'Grasa: brilla en toda la cara'), ('normal', 'Normal: ni brilla ni se siente tirante'), ('no_se', 'No lo sé')]),
 q('finish', 'Tus preferencias', '¿Cómo te gusta que se vea el maquillaje en tu piel?',
   'Esto se llama acabado. Ninguno es mejor que otro: es cuestión de gusto.',
   [('mate', 'Mate: sin brillo'), ('satinado', 'Satinado: un brillo suave y natural'), ('luminoso', 'Luminoso: con brillo, efecto «glow»')]),
 q('budget', 'Tus preferencias', '¿Cuánto gastas como máximo en un producto de maquillaje?',
   'Sirve para mostrarte primero los productos que están dentro de tu presupuesto.',
   [('50000', 'Hasta $50.000 COP'), ('80000', 'Hasta $80.000 COP'), ('120000', 'Hasta $120.000 COP'), ('180000', 'Hasta $180.000 COP')]),
]

QUESTION_BY_KEY = {question['key']: question for question in QUESTIONS}
QUESTIONNAIRE_VERSION = 2


def validate_questionnaire(data):
    if not isinstance(data, dict):
        raise ValueError('Debes completar el cuestionario.')
    mode = data.get('_mode', 'full')
    if mode not in ('quick', 'full'):
        raise ValueError('Modalidad inválida')
    quick_keys = {'skin_tone', 'undertone_self', 'metal', 'clothes', 'hair_depth',
                  'eye_depth', 'contrast', 'depth_best', 'chromatic_best',
                  'muted_effect', 'skin_type', 'finish', 'budget'}
    result = {'_mode': mode}
    for question in QUESTIONS:
        key = question['key']
        if mode == 'quick' and key not in quick_keys:
            continue
        opts = {opt['value'] for opt in question['options']}
        if question['multi']:
            values = data.get(key, [])
            if not isinstance(values, list) or any(not isinstance(x, str) or x not in opts for x in values):
                raise ValueError(f'Respuesta inválida: {key}')
            result[key] = list(dict.fromkeys(values))
        else:
            response = str(data.get(key, ''))
            if response not in opts:
                raise ValueError(f'Completa la pregunta: {question["heading"]}')
            result[key] = int(response) if key == 'budget' else response
    result['_questionnaire_version'] = QUESTIONNAIRE_VERSION
    return result
