from django.contrib.auth import authenticate, get_user_model
from rest_framework import status
from rest_framework.decorators import api_view, permission_classes, throttle_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserSettings
from .serializers import (
    RegisterSerializer,
    UserSerializer,
    ProfileSerializer,
    PasswordChangeSerializer,
    UserSettingsSerializer,
)
from .throttling import LoginThrottle, RegisterThrottle

User = get_user_model()


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([RegisterThrottle])
def register_view(request):
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
@throttle_classes([LoginThrottle])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(username=username, password=password)
    if user:
        refresh = RefreshToken.for_user(user)
        return Response({
            'user': UserSerializer(user).data,
            'access': str(refresh.access_token),
            'refresh': str(refresh),
        })
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def me_view(request):
    if request.method == 'GET':
        return Response(UserSerializer(request.user).data)
    serializer = UserSerializer(request.user, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def profile_view(request):
    """Get or update user profile (name, phone, bio, profile picture)."""
    if request.method == 'GET':
        serializer = ProfileSerializer(request.user, context={'request': request})
        return Response(serializer.data)
    # PATCH — handle file uploads via request.data
    serializer = ProfileSerializer(
        request.user,
        data=request.data,
        partial=True,
        context={'request': request},
    )
    if serializer.is_valid():
        serializer.save()
        result = ProfileSerializer(serializer.instance, context={'request': request}).data
        return Response(result)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def change_password_view(request):
    """Change user password."""
    serializer = PasswordChangeSerializer(data=request.data)
    if serializer.is_valid():
        user = request.user
        if not user.check_password(serializer.validated_data['current_password']):
            return Response(
                {'current_password': 'Current password is incorrect.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user.set_password(serializer.validated_data['new_password1'])
        user.save(update_fields=['password'])
        return Response({'detail': 'Password changed successfully.'})
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PATCH'])
@permission_classes([IsAuthenticated])
def user_settings_view(request):
    """Get or update user dashboard and navigation settings."""
    settings, _ = UserSettings.objects.get_or_create(user=request.user)
    if request.method == 'GET':
        serializer = UserSettingsSerializer(settings)
        return Response(serializer.data)
    serializer = UserSettingsSerializer(settings, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
