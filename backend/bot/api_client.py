import httpx
from bot.config import API_BASE_URL


class APIClient:
    def __init__(self, base_url: str = API_BASE_URL):
        self.base_url = base_url
        self.client = httpx.Client(timeout=15.0)

    def login(self, email: str, password: str) -> dict | None:
        try:
            r = self.client.post(f'{self.base_url}/auth/login/', json={
                'email': email, 'password': password,
            })
            if r.status_code == 200:
                return r.json().get('data')
            return None
        except Exception:
            return None

    def telegram_bot_auth(self, telegram_user_id: int = 0, link_token: str = '') -> dict | None:
        try:
            payload = {}
            if telegram_user_id:
                payload['telegram_user_id'] = str(telegram_user_id)
            if link_token:
                payload['link_token'] = link_token
            if not payload:
                return None
            r = self.client.post(f'{self.base_url}/auth/telegram/bot-auth/', json=payload)
            if r.status_code == 200:
                return r.json().get('data')
            return None
        except Exception:
            return None

    def get_headers(self, token: str, business_id: str) -> dict:
        return {
            'Authorization': f'Bearer {token}',
            'X-Business-ID': business_id,
            'Content-Type': 'application/json',
        }

    def get_sales_report(self, token: str, business_id: str, start_date: str = '') -> dict | None:
        try:
            params = {}
            if start_date:
                params['start_date'] = start_date
            r = self.client.get(
                f'{self.base_url}/reports/sales/',
                headers=self.get_headers(token, business_id),
                params=params,
            )
            if r.status_code == 200:
                return r.json().get('data')
            return None
        except Exception:
            return None

    def get_profit_report(self, token: str, business_id: str, start_date: str = '') -> dict | None:
        try:
            params = {}
            if start_date:
                params['start_date'] = start_date
            r = self.client.get(
                f'{self.base_url}/reports/profit/',
                headers=self.get_headers(token, business_id),
                params=params,
            )
            if r.status_code == 200:
                return r.json().get('data')
            return None
        except Exception:
            return None

    def get_products(self, token: str, business_id: str) -> list | None:
        try:
            r = self.client.get(
                f'{self.base_url}/products/',
                headers=self.get_headers(token, business_id),
            )
            if r.status_code == 200:
                return r.json().get('data', {}).get('results', [])
            return None
        except Exception:
            return None

    def get_low_stock(self, token: str, business_id: str) -> list | None:
        try:
            r = self.client.get(
                f'{self.base_url}/inventory/low-stock/',
                headers=self.get_headers(token, business_id),
            )
            if r.status_code == 200:
                return r.json().get('data', [])
            return None
        except Exception:
            return None

    def get_orders(self, token: str, business_id: str) -> list | None:
        try:
            r = self.client.get(
                f'{self.base_url}/orders/',
                headers=self.get_headers(token, business_id),
            )
            if r.status_code == 200:
                return r.json().get('data', {}).get('results', [])
            return None
        except Exception:
            return None

    def get_sales(self, token: str, business_id: str) -> list | None:
        try:
            r = self.client.get(
                f'{self.base_url}/sales/',
                headers=self.get_headers(token, business_id),
            )
            if r.status_code == 200:
                return r.json().get('data', {}).get('results', [])
            return None
        except Exception:
            return None

    def get_notifications(self, token: str, business_id: str) -> list | None:
        try:
            r = self.client.get(
                f'{self.base_url}/notifications/',
                headers=self.get_headers(token, business_id),
            )
            if r.status_code == 200:
                return r.json().get('data', {}).get('results', [])
            return None
        except Exception:
            return None

    def close(self):
        self.client.close()
