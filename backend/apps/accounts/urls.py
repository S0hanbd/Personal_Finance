from rest_framework.routers import DefaultRouter
from .views import FinancialAccountViewSet

router = DefaultRouter()
router.register(r'', FinancialAccountViewSet, basename='account')
urlpatterns = router.urls
