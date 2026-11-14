from django.contrib import admin
from django.http import JsonResponse
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

def api_root(request):
    return JsonResponse({
        'name': 'Personal Finance API',
        'version': '1.0.0',
        'endpoints': {
            'auth': '/api/auth/',
            'accounts': '/api/accounts/',
            'transactions': '/api/transactions/',
            'budgets': '/api/budgets/',
            'bills': '/api/bills/',
            'obligations': '/api/obligations/',
            'lending': '/api/lending/',
            'analytics': '/api/analytics/',
            'projects': '/api/projects/',
            'admin': '/admin/',
            'token_refresh': '/api/token/refresh/'
        }
    })

urlpatterns = [
    path('', api_root, name='api-root'),
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
