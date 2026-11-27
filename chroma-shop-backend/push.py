import json
import os
import logging
from uuid import UUID

import httpx
import firebase_admin
from firebase_admin import credentials, messaging
from fastapi import APIRouter, Header, HTTPException
from pydantic import BaseModel, Field

router = APIRouter(prefix='/api/push')
log = logging.getLogger(__name__)


def request(method, path, jwt=None, **kwargs):
    url = os.environ['SUPABASE_URL'].rstrip('/')
    key = os.environ['SUPABASE_SERVICE_ROLE_KEY']
    headers = {'apikey': key, 'Authorization': f'Bearer {jwt or key}'}
    return httpx.request(method, url + path, headers=headers, timeout=15, **kwargs)


def identity(authorization):
    if not authorization or not authorization.startswith('Bearer '):
        raise HTTPException(401, 'Sesión requerida')
    jwt = authorization[7:]
    response = request('GET', '/auth/v1/user', jwt)
    if response.status_code != 200:
        raise HTTPException(401, 'Sesión inválida')
    return jwt, response.json()['id']


class Device(BaseModel):
    token: str = Field(min_length=10, max_length=4096)


class Transition(BaseModel):
    order_id: UUID
    status: str


@router.post('/register')
def register(body: Device, authorization: str = Header(default='')):
    _, uid = identity(authorization)
    key = os.environ['SUPABASE_SERVICE_ROLE_KEY']
    response = httpx.post(os.environ['SUPABASE_URL'].rstrip('/') + '/rest/v1/device_tokens',
                          params={'on_conflict': 'token'},
                          headers={'apikey': key, 'Authorization': f'Bearer {key}',
                                   'Prefer': 'resolution=merge-duplicates'},
                          json={'user_id': uid, 'token': body.token, 'platform': 'android'}, timeout=15)
    if not response.is_success:
        raise HTTPException(502, 'No se pudo registrar el dispositivo')
    return {'ok': True}


@router.post('/unregister')
def unregister(body: Device, authorization: str = Header(default='')):
    _, uid = identity(authorization)
    response = request('DELETE', '/rest/v1/device_tokens', params={'user_id': 'eq.' + uid, 'token': 'eq.' + body.token})
    if not response.is_success:
        raise HTTPException(502, 'No se pudo desvincular el dispositivo')
    return {'ok': True}


@router.post('/advance')
def advance(body: Transition, authorization: str = Header(default='')):
    jwt, _ = identity(authorization)
    # The existing SQL RPC checks administrator privileges and valid transitions.
    response = request('POST', '/rest/v1/rpc/advance_order', jwt,
                       json={'oid': str(body.order_id), 'new_status': body.status})
    if not response.is_success:
        raise HTTPException(403, 'Cambio de estado no autorizado o inválido')
    sent = 0
    try:
        order = request('GET', '/rest/v1/orders', params={'id': 'eq.' + str(body.order_id), 'select': 'user_id'}).json()[0]
        devices = request('GET', '/rest/v1/device_tokens', params={'user_id': 'eq.' + order['user_id'], 'select': 'token'}).json()
        try:
            firebase_admin.get_app()
        except ValueError:
            firebase_admin.initialize_app(credentials.Certificate(json.loads(os.environ['FIREBASE_CREDENTIALS'])))
        titles = {'En preparación': 'Estamos preparando tu pedido', 'Enviado': 'Tu pedido ha sido enviado', 'Entregado': 'Tu pedido ha sido entregado'}
        for device in devices:
            try:
                messaging.send(messaging.Message(token=device['token'], notification=messaging.Notification(title=titles[body.status], body='Consulta el seguimiento en Chroma Shop.')))
                sent += 1
            except messaging.UnregisteredError:
                request('DELETE', '/rest/v1/device_tokens', params={'token': 'eq.' + device['token'], 'user_id': 'eq.' + order['user_id']})
            except Exception:
                log.warning('No se pudo enviar una notificación')
    except Exception:
        log.warning('Pedido actualizado; envío push no disponible')
    return {'ok': True, 'sent': sent}
