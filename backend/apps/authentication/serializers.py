from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import UserSettings

User = get_user_model()


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'password', 'timezone', 'default_currency')

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'timezone', 'default_currency')
        read_only_fields = ('id',)


class ProfileSerializer(serializers.ModelSerializer):
    profile_picture_url = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'first_name', 'last_name', 'phone',
                  'bio', 'profile_picture', 'profile_picture_url', 'timezone', 'default_currency')
        read_only_fields = ('id', 'profile_picture_url')

    def get_profile_picture_url(self, obj):
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
        return None


class PasswordChangeSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password1 = serializers.CharField(write_only=True, min_length=8)
    new_password2 = serializers.CharField(write_only=True, min_length=8)

    def validate(self, attrs):
        if attrs['new_password1'] != attrs['new_password2']:
            raise serializers.ValidationError({'new_password2': 'Passwords do not match.'})
        return attrs


class UserSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserSettings
        fields = ('id', 'user', 'dashboard_cards', 'sidebar_items')
        read_only_fields = ('id', 'user')
