from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Count

from .models import Business, BusinessUser, Branch, BusinessSettings
from .serializers import (
    BusinessSerializer,
    CreateBusinessSerializer,
    BusinessUserSerializer,
    BranchSerializer,
    BusinessSettingsSerializer,
)
from .permissions import IsBusinessMember, IsBusinessOwner, CanManageBranch
from apps.core.exceptions import success_response


class BusinessViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_permissions(self):
        if self.action in ('add_member', 'update_member_role', 'destroy', 'update', 'partial_update'):
            return [permissions.IsAuthenticated(), IsBusinessOwner()]
        return super().get_permissions()

    def get_queryset(self):
        if self.request.user.is_platform_admin:
            return Business.objects.all().select_related('owner').prefetch_related('branches')
        return Business.objects.filter(
            business_users__user=self.request.user,
            business_users__is_active=True,
        ).select_related('owner').prefetch_related('branches').distinct()

    def get_serializer_class(self):
        if self.action == 'create':
            return CreateBusinessSerializer
        return BusinessSerializer

    def perform_create(self, serializer):
        serializer.save()

    @action(detail=True, methods=['get'])
    def members(self, request, pk=None):
        business = self.get_object()
        members = BusinessUser.objects.filter(
            business=business, is_active=True
        ).select_related('user')
        serializer = BusinessUserSerializer(members, many=True)
        return success_response(data=serializer.data)

    @action(detail=True, methods=['post'])
    def add_member(self, request, pk=None):
        business = self.get_object()
        email = request.data.get('email') or request.data.get('user')
        role = request.data.get('role', 'seller')
        if not email:
            return Response({'error': 'email is required'}, status=status.HTTP_400_BAD_REQUEST)
        from apps.accounts.models import User
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return Response({'error': 'User not found. They must register first.'}, status=status.HTTP_404_NOT_FOUND)
        bu, created = BusinessUser.objects.update_or_create(
            user=user, business=business,
            defaults={'role': role, 'is_active': True}
        )
        if role in ['owner', 'admin', 'manager', 'seller', 'courier']:
            user.role = role
            user.save(update_fields=['role'])
        return success_response(data={
            'id': str(bu.id),
            'user_email': user.email,
            'user_full_name': user.get_full_name(),
            'role': bu.role,
            'is_active': bu.is_active,
        }, status_code=status.HTTP_201_CREATED)

    @action(detail=True, methods=['patch'], url_path='update-member-role')
    def update_member_role(self, request, pk=None):
        business = self.get_object()
        user_id = request.data.get('user_id')
        new_role = request.data.get('role')
        if not user_id or not new_role:
            return Response({'error': 'user_id and role are required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            membership = BusinessUser.objects.get(business=business, user_id=user_id)
        except BusinessUser.DoesNotExist:
            return Response({'error': 'Member not found'}, status=status.HTTP_404_NOT_FOUND)
        membership.role = new_role
        membership.save(update_fields=['role'])
        if new_role in ['owner', 'admin', 'manager', 'seller', 'courier']:
            user = membership.user
            user.role = new_role
            user.save(update_fields=['role'])
        return success_response(data=BusinessUserSerializer(membership).data)


class BranchViewSet(viewsets.ModelViewSet):
    serializer_class = BranchSerializer
    permission_classes = [permissions.IsAuthenticated, IsBusinessMember]

    def get_queryset(self):
        business_id = self.kwargs.get('business_pk')
        return Branch.objects.filter(business_id=business_id, is_active=True)

    def perform_create(self, serializer):
        business_id = self.kwargs.get('business_pk')
        serializer.save(business_id=business_id)


class BusinessUserViewSet(viewsets.ModelViewSet):
    serializer_class = BusinessUserSerializer
    permission_classes = [permissions.IsAuthenticated, IsBusinessMember]

    def get_queryset(self):
        business_id = self.kwargs.get('business_pk')
        return BusinessUser.objects.filter(
            business_id=business_id, is_active=True
        ).select_related('user')

    def perform_create(self, serializer):
        business_id = self.kwargs.get('business_pk')
        serializer.save(business_id=business_id)


class BusinessMarketplaceSettingsView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def _get_settings(self):
        business = getattr(self.request, 'business', None)
        if not business:
            return None, None
        settings_obj, _ = BusinessSettings.objects.get_or_create(business=business)
        return settings_obj, business

    def list(self, request):
        settings_obj, business = self._get_settings()
        if not settings_obj:
            return Response({'error': 'No business context'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = BusinessSettingsSerializer(settings_obj)
        return success_response(data=serializer.data)

    def update(self, request):
        settings_obj, business = self._get_settings()
        if not settings_obj:
            return Response({'error': 'No business context'}, status=status.HTTP_400_BAD_REQUEST)
        serializer = BusinessSettingsSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(data=serializer.data)
