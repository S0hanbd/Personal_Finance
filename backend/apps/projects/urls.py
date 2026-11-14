from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('', views.ProjectViewSet, basename='project')

# Nested router for project items
projects_router = DefaultRouter()
projects_router.register(
    'items', views.ProjectItemViewSet, basename='project_item'
)

urlpatterns = [
    path('', include(router.urls)),
    path('<int:project_pk>/', include(projects_router.urls)),
]

