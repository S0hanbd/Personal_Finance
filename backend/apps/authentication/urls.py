from django.urls import path
from . import views

urlpatterns = [
    path('register/', views.register_view, name='auth-register'),
    path('login/', views.login_view, name='auth-login'),
    path('me/', views.me_view, name='auth-me'),
    path('profile/', views.profile_view, name='auth-profile'),
    path('change_password/', views.change_password_view, name='auth-change-password'),
    path('settings/', views.user_settings_view, name='auth-settings'),
]
