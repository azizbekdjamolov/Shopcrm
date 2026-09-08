from django.contrib.auth import get_user_model
from rest_framework import serializers


User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    verification_code = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('email', 'first_name', 'last_name', 'business_name', 'password', 'password_confirm', 'verification_code')

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError({'password_confirm': 'Passwords do not match.'})
        from .models import EmailVerification
        if not EmailVerification.verify(attrs['email'], attrs['verification_code'], purpose=EmailVerification.PURPOSE_REGISTER):
            raise serializers.ValidationError({'verification_code': 'Invalid or expired verification code.'})
        return attrs

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        validated_data.pop('verification_code')
        password = validated_data.pop('password')
        business_name = validated_data.pop('business_name', '')
        user = User.objects.create_user(**validated_data)
        user.set_password(password)
        user.role = User.Role.CUSTOMER
        user.business_name = business_name
        user.save()
        if business_name:
            from apps.businesses.models import Business, BusinessUser
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
                phone=user.phone or '',
                email=user.email,
            )
            BusinessUser.objects.create(
                user=user,
                business=business,
                role=BusinessUser.Role.OWNER,
            )
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        from django.contrib.auth import authenticate
        user = authenticate(email=attrs['email'], password=attrs['password'])
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('This account is inactive.')
        attrs['user'] = user
        return attrs


class SendVerificationCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError('A user with this email already exists.')
        return value.lower()


class VerifyVerificationCodeSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.CharField(max_length=6)


class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            'id', 'email', 'first_name', 'last_name', 'full_name', 'phone',
            'business_name', 'avatar', 'role', 'is_platform_admin',
            'preferred_language', 'preferred_theme', 'telegram_username',
            'telegram_user_id', 'date_of_birth', 'address', 'date_joined',
        )
        read_only_fields = ('id', 'email', 'role', 'is_platform_admin', 'date_joined')

    def get_full_name(self, obj):
        return obj.get_full_name()

    def to_representation(self, instance):
        data = super().to_representation(instance)
        if instance.is_platform_admin:
            data['role'] = 'platform_admin'
        else:
            from apps.businesses.models import BusinessUser
            bu = BusinessUser.objects.filter(user=instance, is_active=True).first()
            if bu:
                data['role'] = bu.role
        return data


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=8)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value

    def save(self, **kwargs):
        user = self.context['request'].user
        user.set_password(self.validated_data['new_password'])
        user.save()
        return user


class ForgotPasswordSerializer(serializers.Serializer):
    email = serializers.EmailField()


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'first_name', 'last_name', 'phone', 'business_name',
            'avatar', 'preferred_language', 'preferred_theme',
            'date_of_birth', 'address',
        )

    def validate_phone(self, value):
        if value and not value.startswith('+'):
            raise serializers.ValidationError('Phone number must include country code.')
        return value
