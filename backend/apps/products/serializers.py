from rest_framework import serializers
from .models import Category, Supplier, Product


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = (
            'id', 'business', 'name', 'slug', 'description',
            'parent', 'image', 'is_active', 'created_at', 'updated_at',
            'children', 'product_count',
        )
        read_only_fields = ('id', 'business', 'slug', 'created_at', 'updated_at')

    def get_children(self, obj):
        children = obj.children.filter(is_deleted=False, is_active=True)
        return CategorySerializer(children, many=True, context=self.context).data

    def get_product_count(self, obj):
        return obj.products.filter(is_deleted=False).count()

    def validate(self, attrs):
        request = self.context.get('request')
        if request and hasattr(request, 'business'):
            attrs['business'] = request.business
        return attrs


class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = (
            'id', 'business', 'name', 'phone', 'email', 'address',
            'company', 'notes', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'business', 'created_at', 'updated_at')

    def validate(self, attrs):
        request = self.context.get('request')
        if request and hasattr(request, 'business'):
            attrs['business'] = request.business
        return attrs


class ProductSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default='')
    supplier_name = serializers.CharField(source='supplier.name', read_only=True, default='')
    profit_margin = serializers.DecimalField(max_digits=5, decimal_places=2, read_only=True)
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'business', 'name', 'slug', 'category', 'category_name',
            'barcode', 'description', 'purchase_price', 'selling_price',
            'quantity', 'minimum_stock', 'supplier', 'supplier_name',
            'image', 'status', 'profit_margin', 'is_low_stock',
            'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'business', 'slug', 'created_at', 'updated_at')

    def validate_barcode(self, value):
        if value:
            request = self.context.get('request')
            business = getattr(request, 'business', None)
            qs = Product.objects.filter(barcode=value, is_deleted=False)
            if business:
                qs = qs.filter(business=business)
            if self.instance:
                qs = qs.exclude(id=self.instance.id)
            if qs.exists():
                raise serializers.ValidationError('A product with this barcode already exists.')
        return value

    def validate(self, attrs):
        request = self.context.get('request')
        if request and hasattr(request, 'business'):
            attrs['business'] = request.business
        if 'purchase_price' in attrs and 'selling_price' in attrs:
            if attrs['selling_price'] < attrs['purchase_price']:
                pass
        return attrs

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
            if user.role == 'seller' or user.role == 'courier':
                data.pop('purchase_price', None)
        return data


class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True, default='')
    is_low_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = Product
        fields = (
            'id', 'name', 'slug', 'category', 'category_name',
            'barcode', 'selling_price', 'purchase_price', 'quantity',
            'status', 'is_low_stock', 'image',
        )

    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            user = request.user
            if user.role == 'seller' or user.role == 'courier':
                data.pop('purchase_price', None)
        return data
