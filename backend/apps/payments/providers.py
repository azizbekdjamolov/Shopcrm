import hashlib
import hmac
import time
from decimal import Decimal
from typing import Optional


class PaymentProvider:
    """Base class for payment providers (Click, Payme, etc.)"""
    
    def __init__(self, business):
        self.business = business
    
    def create_invoice(self, amount: Decimal, order_id: str, description: str = '') -> dict:
        raise NotImplementedError
    
    def verify_payment(self, transaction_id: str) -> dict:
        raise NotImplementedError
    
    def handle_callback(self, data: dict) -> dict:
        raise NotImplementedError


class ClickProvider(PaymentProvider):
    """Click payment provider integration"""
    
    SERVICE_ID = 'click_service_id'
    MERCHANT_USER_ID = 'click_merchant_user_id'
    SECRET_KEY = 'click_secret_key'
    
    def _get_config(self):
        from apps.businesses.models import BusinessSettings
        settings = BusinessSettings.objects.filter(
            business=self.business
        ).first()
        if settings and settings.extra_data:
            return {
                'service_id': settings.extra_data.get(self.SERVICE_ID, ''),
                'merchant_user_id': settings.extra_data.get(self.MERCHANT_USER_ID, ''),
                'secret_key': settings.extra_data.get(self.SECRET_KEY, ''),
            }
        return {'service_id': '', 'merchant_user_id': '', 'secret_key': ''}
    
    def create_invoice(self, amount: Decimal, order_id: str, description: str = '') -> dict:
        config = self._get_config()
        return {
            'provider': 'click',
            'status': 'pending',
            'order_id': order_id,
            'amount': str(amount),
            'merchant_id': config.get('merchant_user_id', ''),
            'service_id': config.get('service_id', ''),
            'return_url': f'/payment/click/callback',
            'extra_data': {
                'click_trans_id': None,
                'merchant_trans_id': order_id,
            },
        }
    
    def verify_payment(self, transaction_id: str) -> dict:
        return {
            'provider': 'click',
            'transaction_id': transaction_id,
            'status': 'verified',
        }
    
    def handle_callback(self, data: dict) -> dict:
        config = self._get_config()
        sign_string = f"{data.get('click_trans_id', '')}{data.get('merchant_trans_id', '')}{config.get('service_id', '')}{config.get('secret_key', '')}{data.get('amount', '')}"
        expected_sign = hashlib.md5(sign_string.encode()).hexdigest()
        
        if data.get('sign_string') == expected_sign:
            return {
                'status': 'success',
                'transaction_id': data.get('click_trans_id'),
                'order_id': data.get('merchant_trans_id'),
                'amount': data.get('amount'),
            }
        return {'status': 'error', 'message': 'Invalid signature'}


class PaymeProvider(PaymentProvider):
    """Payme payment provider integration"""
    
    MERCHANT_ID = 'payme_merchant_id'
    SECRET_KEY = 'payme_secret_key'
    
    def _get_config(self):
        from apps.businesses.models import BusinessSettings
        settings = BusinessSettings.objects.filter(
            business=self.business
        ).first()
        if settings and settings.extra_data:
            return {
                'merchant_id': settings.extra_data.get(self.MERCHANT_ID, ''),
                'secret_key': settings.extra_data.get(self.SECRET_KEY, ''),
            }
        return {'merchant_id': '', 'secret_key': ''}
    
    def create_invoice(self, amount: Decimal, order_id: str, description: str = '') -> dict:
        config = self._get_config()
        amount_in_tiyn = int(amount * 100)
        return {
            'provider': 'payme',
            'status': 'pending',
            'order_id': order_id,
            'amount': str(amount),
            'amount_tiyn': amount_in_tiyn,
            'merchant_id': config.get('merchant_id', ''),
            'return_url': f'/payment/payme/callback',
            'extra_data': {
                'payme_transaction_id': None,
                'account_order_id': order_id,
            },
        }
    
    def verify_payment(self, transaction_id: str) -> dict:
        return {
            'provider': 'payme',
            'transaction_id': transaction_id,
            'status': 'verified',
        }
    
    def handle_callback(self, data: dict) -> dict:
        config = self._get_config()
        auth = data.get('auth', '')
        expected_auth = hashlib.sha1(
            f"{config.get('merchant_id', '')}:{config.get('secret_key', '')}".encode()
        ).hexdigest()
        
        if auth == expected_auth:
            return {
                'status': 'success',
                'transaction_id': data.get('params', {}).get('id'),
                'order_id': data.get('params', {}).get('account', {}).get('order_id'),
                'amount': data.get('params', {}).get('amount', 0) / 100,
            }
        return {'status': 'error', 'message': 'Invalid authentication'}


class PaymentProviderFactory:
    """Factory for creating payment providers"""
    
    _providers = {
        'click': ClickProvider,
        'payme': PaymeProvider,
    }
    
    @classmethod
    def get_provider(cls, provider_name: str, business) -> Optional[PaymentProvider]:
        provider_class = cls._providers.get(provider_name)
        if provider_class:
            return provider_class(business)
        return None
    
    @classmethod
    def get_available_providers(cls) -> list:
        return list(cls._providers.keys())
