from rest_framework.routers import DefaultRouter
from .views import TransactionViewSet, IncomeSourceViewSet, ExpenseCategoryViewSet, AccountTransferViewSet

router = DefaultRouter()
router.register(r'income-sources', IncomeSourceViewSet, basename='income-source')
router.register(r'categories', ExpenseCategoryViewSet, basename='expense-category')
router.register(r'transfers', AccountTransferViewSet, basename='transfer')
router.register(r'', TransactionViewSet, basename='transaction')
urlpatterns = router.urls
