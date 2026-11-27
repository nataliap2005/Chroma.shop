"""Catálogo de Chroma: lectura, búsqueda y filtros.

De dónde salen los productos (get_products):
- Supabase (tabla catalog_products, migraciones 005 y 006), si CHROMA_SUPABASE_URL y
  CHROMA_SUPABASE_PUBLISHABLE_KEY están configuradas. Así lo que una administradora agrega
  o cambia en la app aparece para todas en menos de un minuto.
- El CSV data/productos_mvp.csv, si Supabase no está configurado (desarrollo y pruebas) o si
  falla la conexión y todavía no hay una copia en memoria.
CHROMA_CATALOG_SOURCE=csv obliga a usar el CSV.
"""
import csv
import logging
import os
import time
from collections import Counter
from pathlib import Path
from typing import Any

import httpx

CATALOG_FILE = Path(__file__).resolve().parent / "data" / "productos_mvp.csv"
CACHE_SECONDS = 60
COLUMNS = ("id", "nombre", "marca", "categoria", "tono", "profundidad", "subtono", "acabado", "color_hex", "precio_cop",
           "tipos_piel", "estacion", "descripcion", "imagen", "nivel", "calidad", "fuente", "precio_fuente", "tienda",
           "tienda_url", "enlace_tipo", "panes", "origen_color")

log = logging.getLogger("chroma.catalog")
_cache: dict[str, Any] = {"rows": None, "at": 0.0, "source": ""}
_forced_source: str | None = None


def set_source(source: str | None) -> None:
    """Para pruebas: 'csv', 'supabase' o None (según el entorno). Limpia la copia en memoria."""
    global _forced_source
    _forced_source = source
    _cache.update(rows=None, at=0.0, source="")


def configured_source() -> str:
    if _forced_source:
        return _forced_source
    if os.environ.get("CHROMA_CATALOG_SOURCE", "").strip().lower() == "csv":
        return "csv"
    url = os.environ.get("CHROMA_SUPABASE_URL", "").strip()
    key = os.environ.get("CHROMA_SUPABASE_PUBLISHABLE_KEY", "").strip()
    return "supabase" if url and key else "csv"


def _normalize(row: dict[str, Any]) -> dict[str, Any]:
    item = {k: ("" if row.get(k) is None else row.get(k)) for k in COLUMNS}
    for k, v in row.items():  # columnas extra del CSV, si las hay
        item.setdefault(k, "" if v is None else v)
    try:
        item["precio_cop"] = int(item["precio_cop"])
    except (ValueError, TypeError) as exc:
        raise ValueError(f"Precio inválido en producto {item.get('id', '?')}") from exc
    return item


def fetch_supabase_catalog() -> list[dict[str, Any]]:
    url = os.environ["CHROMA_SUPABASE_URL"].strip().rstrip("/")
    key = os.environ["CHROMA_SUPABASE_PUBLISHABLE_KEY"].strip()
    rows: list[dict[str, Any]] = []
    page = 1000
    while True:
        r = httpx.get(f"{url}/rest/v1/catalog_products",
                      params={"select": ",".join(COLUMNS), "activo": "eq.true", "order": "id"},
                      headers={"apikey": key, "Range-Unit": "items", "Range": f"{len(rows)}-{len(rows) + page - 1}"},
                      timeout=10)
        r.raise_for_status()
        batch = r.json()
        rows.extend(batch)
        if len(batch) < page:
            return rows


def get_products() -> list[dict[str, Any]]:
    """Productos activos (copias: quien llama puede modificarlas)."""
    source = configured_source()
    now = time.monotonic()
    if _cache["rows"] is None or _cache["source"] != source or now - _cache["at"] > CACHE_SECONDS:
        try:
            raw = fetch_supabase_catalog() if source == "supabase" else load_catalog()
            if source == "supabase" and not raw:
                raise ValueError("catalog_products está vacía: ejecuta 006_catalogo_inicial.sql")
            _cache.update(rows=[_normalize(r) for r in raw], at=now, source=source)
        except (httpx.HTTPError, ValueError, KeyError) as exc:
            if _cache["rows"] is None:
                log.warning("No se pudo leer el catálogo de Supabase (%s); se usa el CSV.", exc)
                _cache.update(rows=load_catalog(), at=now, source=source)
            else:
                log.warning("No se pudo actualizar el catálogo (%s); se usa la copia en memoria.", exc)
                _cache["at"] = now
    return [dict(p) for p in _cache["rows"]]


def catalog_status() -> str:
    return "supabase" if configured_source() == "supabase" else "mvp_snapshot"


def load_catalog(path: Path = CATALOG_FILE) -> list[dict[str, Any]]:
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        records = list(csv.DictReader(handle))
    result = []
    for record in records:
        item = dict(record)
        try:
            item["precio_cop"] = int(item["precio_cop"])
        except (ValueError, TypeError, KeyError) as exc:
            raise ValueError(f"Precio inválido en producto {item.get('id', '?')}") from exc
        result.append(item)
    return result


def search_catalog(
    items: list[dict[str, Any]], *, q: str = "", category: str = "", brand: str = "",
    max_price: int | None = None, offset: int = 0, limit: int = 24,
) -> dict[str, Any]:
    query = q.strip().casefold()
    filtered = [p for p in items if (
        (not query or query in " ".join(str(p.get(k, "")) for k in ("nombre", "marca", "tono")).casefold())
        and (not category or str(p.get("categoria", "")).casefold() == category.casefold())
        and (not brand or str(p.get("marca", "")).casefold() == brand.casefold())
        and (max_price is None or p["precio_cop"] <= max_price)
    )]
    filtered.sort(key=lambda p: (str(p.get("marca", "")).casefold(), str(p.get("nombre", "")).casefold(), str(p.get("tono", "")).casefold()))
    return {"products": filtered[offset:offset + limit], "total": len(filtered), "offset": offset, "limit": limit, "catalog_status": catalog_status()}


def catalog_facets(items: list[dict[str, Any]]) -> dict[str, Any]:
    return {"total": len(items),
            "categories": dict(sorted(Counter(p.get("categoria", "") for p in items).items())),
            "brands": dict(sorted(Counter(p.get("marca", "") for p in items).items()))}
