# Chroma Shop Backend
Motor independiente FastAPI adaptado de Chroma Backend. Reutiliza questionnaire.py, colorimetry.py, recommender.py e hybrid.py. No usa cuotas, Wompi ni credenciales de Chroma original. Los cálculos reciben el catálogo de la tienda; nunca autorizan compras ni fijan precios de pedidos.

## Python
`python -m venv .venv`
Windows: `.venv\Scripts\activate`
`pip install -r requirements.txt`
`uvicorn app:app --host 0.0.0.0 --port 5050`
Swagger: http://localhost:5050/docs
Para producción, configurar SHOP_CORS con orígenes exactos separados por coma. Desplegar como servicio separado (start command: uvicorn app:app --host 0.0.0.0 --port $PORT).

## Supabase nuevo
Ejecutar supabase/schema.sql y luego supabase/seed.sql una sola vez en SQL Editor. El seed contiene 688 variantes del CSV original con stock ficticio de 12 unidades. Verificar permisos y Realtime. Registrar administrador según README frontend. No usar service_role en frontend. Las tiendas son puntos ficticios de prueba. La base no requiere FastAPI para autenticar ni comprar.

## Pruebas
`python -m pytest -q` valida endpoints de cálculo con catálogo original. SQL y pruebas con dispositivos requieren proyecto Supabase real.
