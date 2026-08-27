from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView, SpectacularRedocView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
    path('api/auth/', include('apps.accounts.urls')),
    path('api/businesses/', include('apps.businesses.urls')),
    path('api/products/', include('apps.products.urls')),
    path('api/categories/', include('apps.products.urls_categories')),
    path('api/suppliers/', include('apps.products.urls_suppliers')),
    path('api/inventory/', include('apps.inventory.urls')),
    path('api/customers/', include('apps.customers.urls')),
    path('api/sales/', include('apps.sales.urls')),
    path('api/debts/', include('apps.debts.urls')),
    path('api/expenses/', include('apps.expenses.urls')),
    path('api/expense-categories/', include('apps.expenses.urls_categories')),
    path('api/employees/', include('apps.employees.urls')),
    path('api/branches/', include('apps.branches.urls')),
    path('api/orders/', include('apps.orders.urls')),
    path('api/deliveries/', include('apps.delivery.urls')),
    path('api/payments/', include('apps.payments.urls')),
    path('api/invoices/', include('apps.invoices.urls')),
    path('api/notifications/', include('apps.notifications.urls')),
    path('api/reports/', include('apps.reports.urls')),
    path('api/subscriptions/', include('apps.subscriptions.urls')),
    path('api/audit/', include('apps.audit.urls')),
    path('api/platform-admin/', include('apps.accounts.urls_admin')),
    path('api/marketplace/', include('apps.products.urls_marketplace')),
]
