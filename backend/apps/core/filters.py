import django_filters
from django.db import models


class BaseFilterSet(django_filters.FilterSet):
    created_after = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='gte')
    created_before = django_filters.DateTimeFilter(field_name='created_at', lookup_expr='lte')
    search = django_filters.CharFilter(method='filter_search')
    ordering = django_filters.OrderingFilter(
        fields=(
            ('created_at', 'created_at'),
            ('updated_at', 'updated_at'),
        ),
    )

    def filter_search(self, queryset, name, value):
        return queryset

    class Meta:
        abstract = True
