# Business OS

O'zbekistondagi kichik va o'rta bizneslar uchun to'liq SaaS boshqaruv tizimi.

## Arxitektura

```
                BUSINESS OS
                     │
          ┌──────────┴──────────┐
          │                     │
       React UI             Future Telegram Bot
       (Vite + TS)          (aiogram)
          │                     │
          └──────────┬──────────┘
                     ↓
              Django REST API
                     ↓
            Business Logic Layer
                     ↓
                 PostgreSQL
                     ↓
              Redis / Channels
```

## Texnologiyalar

### Backend
- Python 3.12
- Django 5.1
- Django REST Framework 3.15
- PostgreSQL 16
- Redis 7
- Django Channels (WebSocket)
- JWT Authentication (SimpleJWT)
- Celery (async tasks)
- WeasyPrint (PDF generation)

### Frontend
- React 19
- TypeScript
- Vite 6
- TanStack Query (React Query)
- Zustand (state management)
- Tailwind CSS 3
- Recharts (charts)
- i18next (3 til: UZ/RU/EN)
- React Router 7
- Lucide React (icons)

### Infrastructure
- Docker & Docker Compose
- Nginx (reverse proxy)

## O'rnatish

### Old shartlar
- Docker & Docker Compose
- Python 3.12+
- Node.js 20+
- PostgreSQL 16+
- Redis 7+

### Docker bilan ishga tushirish

```bash
# 1. Clone
git clone <repo-url>
cd business-os

# 2. Environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Edit backend/.env
# SECRET_KEY, DATABASE_URL, etc.

# 4. Docker compose
docker-compose up -d

# 5. Superuser yaratish
docker-compose exec backend python manage.py createsuperuser
```

### Qo'lda ishga tushirish

```bash
# Backend
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# Frontend (yangi terminal)
cd frontend
npm install
cp .env.example .env
npm run dev
```

## API Endpoints

### Auth
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register/` | POST | Ro'yxatdan o'tish |
| `/api/auth/login/` | POST | Kirish |
| `/api/auth/refresh/` | POST | Token yangilash |
| `/api/auth/logout/` | POST | Chiqish |
| `/api/auth/me/` | GET | Profil |
| `/api/auth/change-password/` | POST | Parol o'zgartirish |

### Products
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/products/` | GET/POST | Mahsulotlar |
| `/api/products/:id/` | GET/PUT/DELETE | Mahsulot |
| `/api/categories/` | GET/POST | Kategoriyalar |
| `/api/suppliers/` | GET/POST | Yetkazib beruvchilar |

### Inventory
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/inventory/` | GET | Ombor |
| `/api/inventory/adjust/` | POST | Ombor tuzatish |
| `/api/inventory/movements/` | GET | Harakatlar tarixi |

### Sales / POS
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/sales/` | GET/POST | Sotish |
| `/api/sales/:id/` | GET | Sotish detali |

### Customers
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/customers/` | GET/POST | Mijozlar |
| `/api/customers/:id/` | GET/PUT | Mijoz |

### Orders
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/orders/` | GET/POST | Buyurtmalar |
| `/api/orders/:id/` | GET | Buyurtma |
| `/api/orders/:id/status/` | PATCH | Status o'zgartirish |

### Delivery
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/deliveries/` | GET | Dostavkalar |
| `/api/deliveries/:id/assign/` | POST | Kuryer biriktirish |
| `/api/deliveries/:id/status/` | PATCH | Status yangilash |
| `/api/deliveries/:id/rate/` | POST | Baholash |

### Debts
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/debts/` | GET | Qarzlar |
| `/api/debts/:id/pay/` | POST | Qarz to'lash |

### Expenses
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/expenses/` | GET/POST | Xarajatlar |

### Employees
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/employees/` | GET/POST | Xodimlar |
| `/api/employees/:id/performance/` | GET | Samaradorlik |

### Reports
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/reports/sales/` | GET | Savdo hisoboti |
| `/api/reports/profit/` | GET | Foyda hisoboti |
| `/api/reports/expenses/` | GET | Xarajat hisoboti |
| `/api/reports/inventory/` | GET | Ombor hisoboti |

### Invoices
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/invoices/` | GET/POST | Hisob-fakturalar |
| `/api/invoices/:id/pdf/` | GET | PDF yuklab olish |

### Notifications
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/notifications/` | GET | Bildirishnomalar |
| `/api/notifications/read/` | POST | O'qilgan deb belgilash |

### Admin
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/businesses/` | GET | Bizneslar |
| `/api/admin/users/` | GET | Foydalanuvchilar |
| `/api/admin/stats/` | GET | Statistika |

## Rollar

| Role | Description |
|------|-------------|
| `OWNER` | Biznes egasi - hammani ko'radi |
| `ADMIN` | Admin - boshqarish |
| `MANAGER` | Menejer - boshqarish |
| `SELLER` | Sotuvchi - POS, sotish |
| `COURIER` | Kuryer - dostavka |
| `CUSTOMER` | Mijoz - online do'kon |

## Telegram Bot Integration

Backend Telegram bot uchun tayyor:
- User modelda `telegram_user_id` va `telegram_username` maydonlari mavjud
- Barcha business logic Django service layerda
- REST API orqali bot ham ishlaydi
- Bir database, bir source of truth

Bot qo'shilganda:
```python
# Bot ham shu API endpointlardan foydalanadi
# Alohida database yaratish shart emas
```

## Environment Variables

### backend/.env
```
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_URL=postgres://businessos:password@localhost:5432/businessos_db
REDIS_URL=redis://localhost:6379/0
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### frontend/.env
```
VITE_API_URL=http://localhost:8000/api
```

## Ishlab chiqish

```bash
# Backend testlar
cd backend
python manage.py test

# Frontend build
cd frontend
npm run build

# Lint
npm run lint
```

## Production

```bash
# Docker bilan
docker-compose -f docker-compose.yml up -d --build

# Yoki qo'lda
cd backend
gunicorn config.wsgi:application --bind 0.0.0.0:8000 --workers 4

cd frontend
npm run build
# dist/ papkasini nginx ga joylashtiring
```

## License

Proprietary - All rights reserved.
