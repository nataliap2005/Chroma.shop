import json
import os
import logging

from uuid import UUID
from typing import Literal

import httpx
import firebase_admin

from firebase_admin import credentials, messaging
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field


router = APIRouter(prefix="/api/push")
log = logging.getLogger(__name__)


# Estados permitidos para los pedidos

OrderStatus = Literal[
    "Confirmado",
    "En preparación",
    "Enviado",
    "Entregado"
]

STAGES = [
    "Confirmado",
    "En preparación",
    "Enviado",
    "Entregado"
]


# Comunicación con Supabase

def request(method, path, jwt=None, **kwargs):

    url = os.environ["SUPABASE_URL"].rstrip("/")
    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]

    headers = {
        "apikey": key,
        "Authorization": f"Bearer {jwt or key}"
    }

    try:
        return httpx.request(
            method,
            url + path,
            headers=headers,
            timeout=15,
            **kwargs
        )

    except httpx.RequestError as exc:
        log.warning(
            "Error de comunicación con Supabase: %s",
            type(exc).__name__
        )

        raise HTTPException(
            status_code=502,
            detail="No se pudo conectar con Supabase"
        )


# Validación de la sesión del usuario

def identity(authorization):

    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=401,
            detail="Sesión requerida"
        )

    jwt = authorization[7:]

    response = request(
        "GET",
        "/auth/v1/user",
        jwt
    )

    if response.status_code != 200:
        raise HTTPException(
            status_code=401,
            detail="Sesión inválida"
        )

    return jwt, response.json()["id"]


# Modelos de datos

class Device(BaseModel):

    token: str = Field(
        min_length=10,
        max_length=4096
    )


class Transition(BaseModel):

    order_id: UUID
    status: OrderStatus
    previous_status: OrderStatus


# Registrar dispositivo Android

@router.post("/register")
def register(
    body: Device,
    authorization: str = Header(default="")
):

    _, uid = identity(authorization)

    key = os.environ["SUPABASE_SERVICE_ROLE_KEY"]
    url = os.environ["SUPABASE_URL"].rstrip("/")

    try:
        response = httpx.post(
            url + "/rest/v1/device_tokens",
            params={
                "on_conflict": "token"
            },
            headers={
                "apikey": key,
                "Authorization": f"Bearer {key}",
                "Prefer": "resolution=merge-duplicates"
            },
            json={
                "user_id": uid,
                "token": body.token,
                "platform": "android"
            },
            timeout=15
        )

    except httpx.RequestError as exc:
        log.warning(
            "Error registrando dispositivo: %s",
            type(exc).__name__
        )

        raise HTTPException(
            status_code=502,
            detail="No se pudo conectar con Supabase"
        )

    if not response.is_success:
        log.warning(
            "Registro de dispositivo rechazado: %s",
            response.status_code
        )

        raise HTTPException(
            status_code=502,
            detail="No se pudo registrar el dispositivo"
        )

    return {
        "ok": True
    }


# Desvincular dispositivo al cerrar sesión

@router.post("/unregister")
def unregister(
    body: Device,
    authorization: str = Header(default="")
):

    _, uid = identity(authorization)

    response = request(
        "DELETE",
        "/rest/v1/device_tokens",
        params={
            "user_id": "eq." + uid,
            "token": "eq." + body.token
        }
    )

    if not response.is_success:
        raise HTTPException(
            status_code=502,
            detail="No se pudo desvincular el dispositivo"
        )

    return {
        "ok": True
    }


# Actualizar el estado del pedido

@router.post("/advance")
def advance(
    body: Transition,
    authorization: str = Header(default="")
):

    jwt, _ = identity(authorization)

    # Validar que el cambio sea entre estados consecutivos

    previous_index = STAGES.index(body.previous_status)
    new_index = STAGES.index(body.status)

    if abs(new_index - previous_index) != 1:
        raise HTTPException(
            status_code=400,
            detail="La transición entre estados no es válida"
        )

    # Actualizar el pedido mediante la función segura de Supabase

    response = request(
        "POST",
        "/rest/v1/rpc/change_order_status",
        jwt,
        json={
            "oid": str(body.order_id),
            "new_status": body.status,
            "expected_status": body.previous_status
        }
    )

    if not response.is_success:
        log.warning(
            "Error actualizando pedido: %s - %s",
            response.status_code,
            response.text[:500]
        )

        raise HTTPException(
            status_code=403,
            detail=(
                "Cambio no autorizado o estado desactualizado. "
                "Recarga el pedido."
            )
        )

    order = response.json()

    # Normalizar la respuesta de Supabase

    if isinstance(order, list):
        order = order[0] if order else None

    if (
        not isinstance(order, dict)
        or not order.get("user_id")
        or order.get("previous_status") not in STAGES
    ):
        log.error(
            "El pedido fue actualizado, pero la respuesta "
            "de Supabase no contiene los datos esperados"
        )

        return {
            "ok": True,
            "sent": 0,
            "warning": "Pedido actualizado sin notificación"
        }

    # Identificar si el pedido avanza o retrocede

    backwards = (
        STAGES.index(body.status)
        < STAGES.index(order["previous_status"])
    )

    titles = {
        "Confirmado": "Tu pedido está confirmado",
        "En preparación": "Estamos preparando tu pedido",
        "Enviado": "Tu pedido ha sido enviado",
        "Entregado": "Tu pedido ha sido entregado"
    }

    order_number = str(body.order_id)[:8]

    if backwards:

        title = "Corrección del estado de tu pedido"

        message = (
            f"Hemos corregido el estado de tu pedido "
            f"#{order_number} a: {body.status}. "
            "Consulta el seguimiento en Chroma Shop."
        )

    else:

        title = titles[body.status]

        message = (
            f"Pedido #{order_number}: {body.status}. "
            "Consulta el seguimiento en Chroma Shop."
        )

    sent = 0

    # Obtener los dispositivos del propietario del pedido

    try:

        devices_response = request(
            "GET",
            "/rest/v1/device_tokens",
            params={
                "user_id": "eq." + order["user_id"],
                "select": "token"
            }
        )

        devices_response.raise_for_status()

        devices = devices_response.json()

        # Inicializar Firebase Admin SDK

        try:

            firebase_admin.get_app()

        except ValueError:

            firebase_credentials = json.loads(
                os.environ["FIREBASE_CREDENTIALS"]
            )

            firebase_admin.initialize_app(
                credentials.Certificate(
                    firebase_credentials
                )
            )

        # Enviar notificación a cada dispositivo del cliente

        for device in devices:

            try:

                messaging.send(
                    messaging.Message(
                        token=device["token"],
                        notification=messaging.Notification(
                            title=title,
                            body=message
                        ),
                        data={
                            "order_id": str(body.order_id),
                            "status": body.status,
                            "previous_status": order["previous_status"],
                            "correction": str(backwards).lower()
                        },
                        android=messaging.AndroidConfig(
                            priority="high"
                        )
                    )
                )

                sent += 1

                log.info(
                    "Notificación enviada para pedido %s",
                    order_number
                )

            except messaging.UnregisteredError:

                # Eliminar tokens que ya no son válidos

                request(
                    "DELETE",
                    "/rest/v1/device_tokens",
                    params={
                        "token": "eq." + device["token"],
                        "user_id": "eq." + order["user_id"]
                    }
                )

            except Exception as exc:

                log.warning(
                    "No se pudo enviar una notificación: %s",
                    type(exc).__name__
                )

    except Exception as exc:

        log.warning(
            "Pedido actualizado; envío push no disponible: %s",
            type(exc).__name__
        )

    log.info(
        "Pedido %s actualizado de %s a %s. "
        "Notificaciones enviadas: %s",
        order_number,
        order["previous_status"],
        body.status,
        sent
    )

    return {
        "ok": True,
        "sent": sent,
        "status": body.status,
        "previous_status": order["previous_status"],
        "correction": backwards
    }