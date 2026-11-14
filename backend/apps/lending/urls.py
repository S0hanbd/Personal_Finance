from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('people', views.PersonViewSet, basename='person')
router.register('loans', views.LoanRecordViewSet, basename='loan')
router.register('settlements', views.LoanSettlementViewSet, basename='settlement')

urlpatterns = [
    path('', include(router.urls)),
]

