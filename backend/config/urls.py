from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('apps.authentication.urls')),
    path('api/accounts/', include('apps.accounts.urls')),
    path('api/transactions/', include('apps.transactions.urls')),
    path('api/budgets/', include('apps.budgets.urls')),
    path('api/bills/', include('apps.bills.urls')),
    path('api/obligations/', include('apps.obligations.urls')),
    path('api/lending/', include('apps.lending.urls')),
    path('api/analytics/', include('apps.analytics.urls')),
    path('api/projects/', include('apps.projects.urls')),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]
