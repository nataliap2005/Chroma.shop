# Chroma Shop — Ionic
Adaptación académica independiente de Chroma App (Data Thinking). Conserva el cuestionario, recursos visuales y tipos del original; las compras, rutas y persistencia comercial son nuevas. Confirmar autorización de reutilización y atribuir a los autores originales antes de publicar.

## Inicio (Node 22.12+)
1. `npm install`
2. Copiar `.env.example` a `.env.local`. Configurar URL y clave publishable del NUEVO Supabase y URL del backend Shop.
3. Ejecutar `schema.sql` y `seed.sql` del ZIP backend en SQL Editor de un proyecto Supabase vacío.
4. `npm run dev` (http://localhost:8101). Sin Supabase se puede explorar el catálogo local, pero no comprar ni iniciar sesión.
5. `npm run build`; `npx cap add android`; `npx cap sync android`; `npx cap open android`. Configurar permisos ACCESS_COARSE_LOCATION y ACCESS_FINE_LOCATION en AndroidManifest. Usar URL HTTPS del backend para Android. En web, cámara depende del navegador; hay selector de archivo alternativo.

## Admin
Registrar usuario normal, confirmar correo si aplica, luego desde SQL Editor: `insert into public.admins(id) select id from auth.users where email='CORREO_ADMIN';` Cerrar sesión y volver a entrar. No existe un selector de rol público.

## APIs
FastAPI: POST /api/analyze, /api/recommend, /api/translator, /api/advisor; GET /health, /api/questionnaire. Supabase Auth, PostgREST, Storage privado, Realtime, RPC checkout y advance_order. OpenStreetMap para mapa; distancias en línea recta.

## Validación pendiente
Instalar dependencias y compilar; no se pudo completar npm install en el entorno de generación. Probar con dos sesiones: stock cambia al confirmar pedido, cliente ve cambio de estado, usuario normal no puede administrar ni consultar pedidos ajenos. Verificar cámara y GPS en dispositivo. No hay cobros reales; stock inicial y tiendas son datos de demostración. Las fotos de tonos aplicados requieren recursos verificados (campo swatch_image); si no existen se muestra HEX etiquetado. El prototipo en docs contiene referencias visuales, no un enlace Lovable publicado.

## Entrega
Integrantes: completar. Enlace Lovable: completar. Enlaces Git frontend/backend: completar. Crear ramas por integrante y mezclar a main con aportes reales. Confirmar con docente si Supabase sustituye Firebase (rúbrica lo menciona expresamente).
