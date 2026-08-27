from django.contrib import admin
from .models import Delivery, CourierRating


@admin.register(Delivery)
class DeliveryAdmin(admin.ModelAdmin):
    list_display = ('order', 'courier', 'status', 'assigned_at', 'delivered_at')
    list_filter = ('status',)
    search_fields = ('order__order_number',)


@admin.register(CourierRating)
class CourierRatingAdmin(admin.ModelAdmin):
    list_display = ('courier', 'delivery', 'rating', 'customer', 'created_at')
    list_filter = ('rating',)
