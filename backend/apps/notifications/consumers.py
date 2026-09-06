import json
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser


class NotificationConsumer(AsyncWebsocketConsumer):
    group_name = None

    async def connect(self):
        self.user = self.scope.get('user')
        if isinstance(self.user, AnonymousUser) or not self.user.is_authenticated:
            await self.close()
            return
        self.group_name = f'notifications_{self.user.id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        pass

    async def notification_send(self, event):
        await self.send(text_data=json.dumps({
            'type': 'notification',
            'data': event['data'],
        }))


class BusinessConsumer(AsyncWebsocketConsumer):
    group_name = None

    async def connect(self):
        self.user = self.scope.get('user')
        if isinstance(self.user, AnonymousUser) or not self.user.is_authenticated:
            await self.close()
            return
        business_id = await self.get_business_id()
        if not business_id:
            await self.close()
            return
        self.group_name = f'business_{business_id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        pass

    async def order_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'order_update',
            'data': event['data'],
        }))

    async def delivery_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'delivery_update',
            'data': event['data'],
        }))

    async def payment_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'payment_update',
            'data': event['data'],
        }))

    async def dashboard_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'dashboard_update',
            'data': event['data'],
        }))

    @database_sync_to_async
    def get_business_id(self):
        business = getattr(self.user, '_business', None)
        if business:
            return str(business.id)
        business_user = self.user.business_roles.first()
        if business_user:
            return str(business_user.business.id)
        return None


class CourierConsumer(AsyncWebsocketConsumer):
    group_name = None

    async def connect(self):
        self.user = self.scope.get('user')
        if isinstance(self.user, AnonymousUser) or not self.user.is_authenticated:
            await self.close()
            return
        if self.user.role != 'courier':
            await self.close()
            return
        self.group_name = f'courier_{self.user.id}'
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if self.group_name:
            await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data):
        pass

    async def delivery_assigned(self, event):
        await self.send(text_data=json.dumps({
            'type': 'delivery_assigned',
            'data': event['data'],
        }))

    async def delivery_status_update(self, event):
        await self.send(text_data=json.dumps({
            'type': 'delivery_status_update',
            'data': event['data'],
        }))
