from rest_framework import viewsets, permissions
from rest_framework.decorators import api_view, permission_classes
from django.db.models import Avg, Q, Count

from apps.businesses.models import Business
from apps.branches.models import BranchSettings
from apps.products.models import Product, Category
from apps.core.exceptions import success_response


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def public_store_list(request):
    """List all marketplace-visible businesses as stores"""
    search = request.query_params.get('search', '')
    category = request.query_params.get('category', '')
    
    businesses = Business.objects.filter(
        is_active=True
    ).select_related('owner')
    
    if search:
        businesses = businesses.filter(
            Q(name__icontains=search) | Q(description__icontains=search)
        )
    
    stores = []
    for b in businesses:
        product_count = Product.objects.filter(
            business=b, is_deleted=False, status='active'
        ).count()
        if product_count == 0:
            continue
        
        settings_obj = BranchSettings.objects.filter(
            branch__business=b, branch__is_main=True
        ).first()
        
        categories = list(Category.objects.filter(
            business=b, is_deleted=False, is_active=True
        ).values('id', 'name')[:10])
        
        from apps.businesses.models import BusinessSettings
        bs = BusinessSettings.objects.filter(business=b).first()
        store_name = bs.store_name if bs and bs.store_name else b.name
        
        stores.append({
            'id': str(b.id),
            'name': store_name,
            'slug': b.slug,
            'description': b.description,
            'logo': b.logo.url if b.logo else None,
            'phone': b.phone,
            'address': b.address,
            'product_count': product_count,
            'categories': categories,
            'is_delivery_enabled': settings_obj.is_delivery_enabled if settings_obj else False,
            'delivery_fee': float(settings_obj.free_delivery_threshold) if settings_obj else 0,
        })
    
    return success_response(data=stores)


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def public_store_detail(request, business_id):
    """Get store detail with products"""
    try:
        business = Business.objects.get(id=business_id, is_active=True)
    except Business.DoesNotExist:
        return success_response(message='Store not found', status_code=404)
    
    categories = list(Category.objects.filter(
        business=business, is_deleted=False, is_active=True
    ).values('id', 'name'))
    
    products = list(Product.objects.filter(
        business=business, is_deleted=False, status='active'
    ).values(
        'id', 'name', 'slug', 'barcode', 'selling_price',
        'quantity', 'image', 'description'
    ).order_by('name'))
    
    for p in products:
        p['id'] = str(p['id'])
        p['in_stock'] = p['quantity'] > 0
    
    from apps.businesses.models import BusinessSettings
    bs = BusinessSettings.objects.filter(business=business).first()
    store_name = bs.store_name if bs and bs.store_name else business.name
    
    return success_response(data={
        'id': str(business.id),
        'name': store_name,
        'slug': business.slug,
        'description': business.description,
        'logo': business.logo.url if business.logo else None,
        'phone': business.phone,
        'address': business.address,
        'categories': categories,
        'products': products,
    })


@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def public_store_products(request, business_id):
    """List products for a store with category filter"""
    try:
        business = Business.objects.get(id=business_id, is_active=True)
    except Business.DoesNotExist:
        return success_response(message='Store not found', status_code=404)
    
    category_id = request.query_params.get('category_id', '')
    search = request.query_params.get('search', '')
    
    qs = Product.objects.filter(
        business=business, is_deleted=False, status='active'
    )
    if category_id:
        qs = qs.filter(category_id=category_id)
    if search:
        qs = qs.filter(Q(name__icontains=search) | Q(barcode__icontains=search))
    
    products = list(qs.values(
        'id', 'name', 'slug', 'barcode', 'selling_price',
        'quantity', 'image', 'description', 'category_id'
    ).order_by('name')[:50])
    
    for p in products:
        p['id'] = str(p['id'])
        p['in_stock'] = p['quantity'] > 0
    
    return success_response(data=products)
