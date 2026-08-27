from rest_framework import serializers
from .models import Business, BusinessUser, Branch, BusinessSettings


class BranchSerializer(serializers.ModelSerializer):
    class Meta:
        model = Branch
        fields = (
            'id', 'business', 'name', 'address', 'phone',
            'is_main', 'is_active', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'business', 'created_at', 'updated_at')

    def validate(self, attrs):
        request = self.context.get('request')
        if request and hasattr(request, 'business'):
            attrs['business'] = request.business
        return attrs


class BusinessUserSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)
    user_full_name = serializers.SerializerMethodField()

    class Meta:
        model = BusinessUser
        fields = (
            'id', 'user', 'business', 'role', 'is_active', 'joined_at',
            'user_email', 'user_full_name',
        )
        read_only_fields = ('id', 'joined_at')

    def get_user_full_name(self, obj):
        return obj.user.get_full_name()


class BusinessSerializer(serializers.ModelSerializer):
    branches = BranchSerializer(many=True, read_only=True)
    owner_email = serializers.EmailField(source='owner.email', read_only=True)
    member_count = serializers.SerializerMethodField()

    class Meta:
        model = Business
        fields = (
            'id', 'owner', 'name', 'slug', 'description', 'logo',
            'phone', 'email', 'address', 'website', 'is_active',
            'created_at', 'updated_at', 'branches', 'owner_email', 'member_count',
        )
        read_only_fields = ('id', 'owner', 'created_at', 'updated_at')

    def get_member_count(self, obj):
        return obj.business_users.filter(is_active=True).count()


class CreateBusinessSerializer(serializers.ModelSerializer):
    class Meta:
        model = Business
        fields = (
            'name', 'description', 'logo', 'phone', 'email',
            'address', 'website',
        )

    def create(self, validated_data):
        request = self.context['request']
        business = Business.objects.create(owner=request.user, **validated_data)
        BusinessUser.objects.create(
            user=request.user,
            business=business,
            role=BusinessUser.Role.OWNER,
        )
        return business


class BusinessSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BusinessSettings
        fields = (
            'id', 'is_public', 'delivery_enabled', 'delivery_fee',
            'min_order_amount', 'store_description', 'store_phone',
            'store_address', 'extra_data', 'created_at', 'updated_at',
        )
        read_only_fields = ('id', 'created_at', 'updated_at')

    def update(self, instance, validated_data):
        extra = validated_data.pop('extra_data', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        if extra is not None:
            merged = {**instance.extra_data, **extra}
            instance.extra_data = merged
        instance.save()
        return instance
