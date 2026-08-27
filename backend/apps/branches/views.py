from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404

from .models import BranchSettings
from .serializers import BranchSettingsSerializer, BranchDetailSerializer
from .permissions import IsBranchMember
from apps.businesses.models import Branch
from apps.core.exceptions import success_response


class BranchSettingsViewSet(viewsets.ModelViewSet):
    serializer_class = BranchSettingsSerializer
    permission_classes = [permissions.IsAuthenticated, IsBranchMember]

    def get_queryset(self):
        business = getattr(self.request, 'business', None)
        if business:
            return BranchSettings.objects.filter(
                branch__business=business, is_deleted=False
            ).select_related('branch')
        return BranchSettings.objects.none()

    @action(detail=False, methods=['post'])
    def upsert(self, request):
        branch_id = request.data.get('branch_id')
        if not branch_id:
            return success_response(message='branch_id is required', status_code=400)
        business = getattr(request, 'business', None)
        branch = get_object_or_404(Branch, id=branch_id, business=business)
        settings_obj, created = BranchSettings.objects.get_or_create(
            branch=branch, business=business
        )
        serializer = BranchSettingsSerializer(settings_obj, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(data=serializer.data)


class BranchDetailView(viewsets.ReadOnlyModelViewSet):
    serializer_class = BranchDetailSerializer
    permission_classes = [permissions.IsAuthenticated, IsBranchMember]

    def get_queryset(self):
        business = getattr(self.request, 'business', None)
        if business:
            return Branch.objects.filter(
                business=business, is_active=True
            ).prefetch_related('settings')
        return Branch.objects.none()
