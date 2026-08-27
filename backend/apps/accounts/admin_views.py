from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Sum, Count, Q
from django.utils import timezone
from datetime import timedelta

from apps.accounts.models import User
from apps.businesses.models import Business, BusinessUser
from apps.sales.models import Sale
from apps.orders.models import Order
from apps.payments.models import Payment
from apps.subscriptions.models import Subscription, SubscriptionPlan
from apps.core.exceptions import success_response


class IsPlatformAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.is_platform_admin


class PlatformAdminDashboardView(viewsets.ViewSet):
    permission_classes = [permissions.IsAuthenticated, IsPlatformAdmin]
    
    def list(self, request):
        now = timezone.now()
        today = now.date()
        month_start = today.replace(day=1)
        
        total_businesses = Business.objects.count()
        active_businesses = Business.objects.filter(is_active=True).count()
        total_users = User.objects.filter(is_active=True).count()
        total_sales = Sale.objects.filter(is_deleted=False, created_at__date=today).aggregate(
            total=Sum('total'))['total'] or 0
        total_orders = Order.objects.filter(is_deleted=False, created_at__date=today).count()
        monthly_revenue = Sale.objects.filter(
            is_deleted=False, created_at__date__gte=month_start
        ).aggregate(total=Sum('total'))['total'] or 0
        
        recent_businesses = list(Business.objects.order_by('-created_at')[:5].values(
            'id', 'name', 'slug', 'is_active', 'created_at'
        ))
        
        recent_users = list(User.objects.filter(is_active=True).order_by('-date_joined')[:5].values(
            'id', 'email', 'role', 'is_platform_admin', 'date_joined'
        ))
        
        return success_response(data={
            'total_businesses': total_businesses,
            'active_businesses': active_businesses,
            'total_users': total_users,
            'today_sales': float(total_sales),
            'today_orders': total_orders,
            'monthly_revenue': float(monthly_revenue),
            'recent_businesses': recent_businesses,
            'recent_users': recent_users,
        })


class PlatformAdminBusinessViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsPlatformAdmin]
    queryset = Business.objects.order_by('-created_at')
    
    def list(self, request):
        search = request.query_params.get('search', '')
        qs = self.queryset
        if search:
            qs = qs.filter(Q(name__icontains=search) | Q(slug__icontains=search))
        
        page = self.paginate_queryset(qs)
        data = [{
            'id': str(b.id),
            'name': b.name,
            'slug': b.slug,
            'phone': b.phone,
            'email': b.email,
            'is_active': b.is_active,
            'owner_id': str(b.owner_id),
            'created_at': b.created_at.isoformat() if b.created_at else None,
            'member_count': BusinessUser.objects.filter(business=b, is_active=True).count(),
        } for b in (page or qs[:20])]
        
        return success_response(data=data)
    
    def retrieve(self, request, pk=None):
        business = self.get_object()
        members = list(BusinessUser.objects.filter(business=business, is_active=True).select_related('user').values(
            'id', 'user__id', 'user__email', 'user__first_name', 'user__last_name', 'role', 'joined_at'
        ))
        return success_response(data={
            'id': str(business.id),
            'name': business.name,
            'slug': business.slug,
            'phone': business.phone,
            'email': business.email,
            'address': business.address,
            'is_active': business.is_active,
            'created_at': business.created_at.isoformat() if business.created_at else None,
            'members': members,
        })


class PlatformAdminUserViewSet(viewsets.ReadOnlyModelViewSet):
    permission_classes = [permissions.IsAuthenticated, IsPlatformAdmin]
    queryset = User.objects.filter(is_active=True).order_by('-date_joined')
    
    def list(self, request):
        search = request.query_params.get('search', '')
        role = request.query_params.get('role', '')
        qs = self.queryset
        if search:
            qs = qs.filter(Q(email__icontains=search) | Q(first_name__icontains=search) | Q(last_name__icontains=search))
        if role:
            qs = qs.filter(role=role)
        
        page = self.paginate_queryset(qs)
        data = [{
            'id': str(u.id),
            'email': u.email,
            'first_name': u.first_name,
            'last_name': u.last_name,
            'role': u.role,
            'is_platform_admin': u.is_platform_admin,
            'is_active': u.is_active,
            'date_joined': u.date_joined.isoformat() if u.date_joined else None,
            'business_count': BusinessUser.objects.filter(user=u, is_active=True).count(),
        } for u in (page or qs[:20])]
        
        return success_response(data=data)


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated, IsPlatformAdmin])
def toggle_business_active(request, pk):
    try:
        business = Business.objects.get(id=pk)
    except Business.DoesNotExist:
        return success_response(message='Business not found', status_code=404)
    business.is_active = not business.is_active
    business.save(update_fields=['is_active', 'updated_at'])
    return success_response(data={'id': str(business.id), 'is_active': business.is_active})


@api_view(['PATCH'])
@permission_classes([permissions.IsAuthenticated, IsPlatformAdmin])
def toggle_user_active(request, pk):
    try:
        user = User.objects.get(id=pk)
    except User.DoesNotExist:
        return success_response(message='User not found', status_code=404)
    user.is_active = not user.is_active
    user.save(update_fields=['is_active'])
    return success_response(data={'id': str(user.id), 'is_active': user.is_active})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsPlatformAdmin])
def create_business_for_user(request):
    """Admin creates a business and assigns an owner"""
    email = request.data.get('email')
    business_name = request.data.get('business_name', '')
    first_name = request.data.get('first_name', '')
    last_name = request.data.get('last_name', '')
    phone = request.data.get('phone', '')
    password = request.data.get('password', '12345678')

    if not email or not business_name:
        return success_response(message='Email and business_name required', status_code=400)

    # Create or get user
    user, created = User.objects.get_or_create(
        email=email,
        defaults={
            'first_name': first_name,
            'last_name': last_name,
            'phone': phone,
        }
    )
    if created:
        user.set_password(password)
        user.save()

    # Create business
    from apps.core.utils import generate_unique_slug
    from django.utils.text import slugify
    slug = slugify(business_name) or 'business'
    base_slug = slug
    counter = 1
    while Business.objects.filter(slug=slug).exists():
        slug = f'{base_slug}-{counter}'
        counter += 1

    business = Business.objects.create(
        owner=user,
        name=business_name,
        slug=slug,
        phone=phone,
        email=email,
    )
    BusinessUser.objects.create(
        user=user,
        business=business,
        role=BusinessUser.Role.OWNER,
    )
    return success_response(data={
        'business_id': str(business.id),
        'user_id': str(user.id),
        'email': email,
        'business_name': business_name,
    }, status_code=201)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated, IsPlatformAdmin])
def assign_business_role(request, business_pk):
    """Admin assigns a user to a business with a role"""
    email = request.data.get('email')
    role = request.data.get('role')
    if not email or not role:
        return success_response(message='Email and role required', status_code=400)

    try:
        business = Business.objects.get(id=business_pk)
    except Business.DoesNotExist:
        return success_response(message='Business not found', status_code=404)

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        return success_response(message='User not found', status_code=404)

    bu, created = BusinessUser.objects.update_or_create(
        user=user, business=business,
        defaults={'role': role, 'is_active': True}
    )
    return success_response(data={
        'id': str(bu.id),
        'email': email,
        'role': role,
        'business_name': business.name,
    })
