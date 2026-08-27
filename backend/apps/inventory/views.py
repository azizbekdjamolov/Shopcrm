from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404

from .models import Inventory, InventoryMovement
from .serializers import (
    InventorySerializer,
    InventoryMovementSerializer,
    StockAdjustmentSerializer,
    StockTransferSerializer,
)
from .services import InventoryService
from .permissions import IsInventoryMember
from apps.products.models import Product
from apps.core.exceptions import success_response


class InventoryViewSet(viewsets.ModelViewSet):
    serializer_class = InventorySerializer
    permission_classes = [permissions.IsAuthenticated, IsInventoryMember]
    filterset_fields = ['warehouse']
    search_fields = ['product__name']

    def get_queryset(self):
        business = getattr(self.request, 'business', None)
        if self.request.user.is_platform_admin and not business:
            return Inventory.objects.filter(is_deleted=False).select_related('product')
        if business:
            return Inventory.objects.filter(
                business=business, is_deleted=False
            ).select_related('product')
        return Inventory.objects.none()

    @action(detail=False, methods=['get'], url_path='low-stock')
    def low_stock(self, request):
        business = getattr(request, 'business', None)
        if business:
            items = InventoryService.get_low_stock_products(business)
            data = [
                {
                    'id': str(inv.product.id),
                    'name': inv.product.name,
                    'sku': inv.product.sku,
                    'stock_quantity': inv.quantity,
                    'min_stock': inv.minimum_stock,
                }
                for inv in items
            ]
            return success_response(data=data)
        return success_response(data=[])

    @action(detail=False, methods=['post'], url_path='adjust')
    def adjust_stock(self, request):
        serializer = StockAdjustmentSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        business = getattr(request, 'business', None)
        product = get_object_or_404(Product, id=serializer.validated_data['product_id'], business=business)
        try:
            inventory = InventoryService.adjust_stock(
                business=business,
                product=product,
                new_quantity=serializer.validated_data['quantity'],
                user=request.user,
                notes=serializer.validated_data.get('notes', ''),
            )
            return success_response(data=InventorySerializer(inventory).data, message='Stock adjusted')
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'])
    def transfer_stock(self, request):
        serializer = StockTransferSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        business = getattr(request, 'business', None)
        from_product = get_object_or_404(Product, id=serializer.validated_data['from_product_id'], business=business)
        to_product = get_object_or_404(Product, id=serializer.validated_data['to_product_id'], business=business)
        try:
            from_inv, to_inv = InventoryService.transfer_stock(
                business=business,
                from_product=from_product,
                to_product=to_product,
                quantity=serializer.validated_data['quantity'],
                user=request.user,
                notes=serializer.validated_data.get('notes', ''),
            )
            return success_response(
                data={
                    'from': InventorySerializer(from_inv).data,
                    'to': InventorySerializer(to_inv).data,
                },
                message='Stock transferred',
            )
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['get'])
    def movements(self, request):
        business = getattr(request, 'business', None)
        product_id = request.query_params.get('product_id')
        movement_type = request.query_params.get('movement_type')
        product = None
        if product_id:
            product = Product.objects.filter(id=product_id, business=business).first()
        movements = InventoryService.get_stock_movements(
            business=business, product=product, movement_type=movement_type
        )
        page = self.paginate_queryset(movements)
        if page is not None:
            serializer = InventoryMovementSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        serializer = InventoryMovementSerializer(movements, many=True)
        return success_response(data=serializer.data)
