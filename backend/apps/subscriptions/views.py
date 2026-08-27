from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from django.utils import timezone
from datetime import timedelta

from .models import SubscriptionPlan, Subscription
from .serializers import (
    SubscriptionPlanSerializer,
    SubscriptionSerializer,
    CreateSubscriptionSerializer,
)
from .permissions import IsSubscriptionAdmin
from apps.core.exceptions import success_response


class SubscriptionPlanViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionPlanSerializer
    permission_classes = [permissions.IsAuthenticated, IsSubscriptionAdmin]
    filterset_fields = ['interval', 'is_active']
    search_fields = ['name']

    def get_queryset(self):
        if self.request.user.is_platform_admin:
            return SubscriptionPlan.objects.filter(is_deleted=False)
        return SubscriptionPlan.objects.filter(is_active=True, is_deleted=False)

    def perform_create(self, serializer):
        if not self.request.user.is_platform_admin:
            from rest_framework.exceptions import PermissionDenied
            raise PermissionDenied('Only platform admins can create plans')
        serializer.save()


class SubscriptionViewSet(viewsets.ModelViewSet):
    serializer_class = SubscriptionSerializer
    permission_classes = [permissions.IsAuthenticated, IsSubscriptionAdmin]
    filterset_fields = ['status', 'plan']
    search_fields = ['business__name']

    def get_queryset(self):
        if self.request.user.is_platform_admin:
            return Subscription.objects.filter(is_deleted=False).select_related('plan', 'business')
        business = getattr(self.request, 'business', None)
        if business:
            return Subscription.objects.filter(
                business=business, is_deleted=False
            ).select_related('plan', 'business')
        return Subscription.objects.none()

    @action(detail=False, methods=['post'])
    def subscribe(self, request):
        serializer = CreateSubscriptionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        business = getattr(request, 'business', None)
        if not business:
            return success_response(message='Business context required', status_code=400)
        plan = SubscriptionPlan.objects.filter(
            id=serializer.validated_data['plan_id'], is_active=True
        ).first()
        if not plan:
            return success_response(message='Plan not found', status_code=404)
        active_sub = Subscription.objects.filter(
            business=business, status=Subscription.Status.ACTIVE
        ).first()
        if active_sub:
            return success_response(message='Business already has an active subscription', status_code=400)
        now = timezone.now()
        interval_map = {
            'monthly': timedelta(days=30),
            'quarterly': timedelta(days=90),
            'yearly': timedelta(days=365),
        }
        duration = interval_map.get(plan.interval, timedelta(days=30))
        subscription = Subscription.objects.create(
            business=business,
            plan=plan,
            status=Subscription.Status.ACTIVE,
            starts_at=now,
            ends_at=now + duration,
            auto_renew=serializer.validated_data.get('auto_renew', True),
        )
        return success_response(
            data=SubscriptionSerializer(subscription).data,
            message='Subscription created',
            status_code=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        subscription = self.get_object()
        if subscription.status != Subscription.Status.ACTIVE:
            return success_response(message='Subscription is not active', status_code=400)
        subscription.status = Subscription.Status.CANCELLED
        subscription.auto_renew = False
        subscription.save(update_fields=['status', 'auto_renew', 'updated_at'])
        return success_response(
            data=SubscriptionSerializer(subscription).data,
            message='Subscription cancelled',
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = self.get_serializer(queryset, many=True)
        return success_response(data=serializer.data)
