from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    MonthlyBudgetViewSet,
    BudgetCategoryViewSet,
    PlannedPurchaseViewSet,
)

router = DefaultRouter()
router.register(r'monthly', MonthlyBudgetViewSet, basename='monthly-budget')
router.register(r'categories', BudgetCategoryViewSet, basename='budget-category')
router.register(r'planned-purchases', PlannedPurchaseViewSet, basename='planned-purchase')

urlpatterns = [
    path('', include(router.urls)),
]
