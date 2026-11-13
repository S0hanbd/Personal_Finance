from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'rules', views.RecurringExpenseViewSet, basename='recurring-expense')
router.register(r'occurrences', views.RecurringExpenseOccurrenceViewSet, basename='bill-occurrence')

urlpatterns = [
    path('', include(router.urls)),
]
