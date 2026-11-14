from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .models import Project, ProjectItem
from .serializers import (
    ProjectSerializer,
    ProjectDetailSerializer,
    ProjectItemSerializer,
    ProjectItemCreateUpdateSerializer,
)


class ProjectViewSet(viewsets.ModelViewSet):
    """CRUD for projects, filtered by the authenticated user."""

    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Project.objects.filter(user=self.request.user).all()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProjectDetailSerializer
        return ProjectSerializer

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Return aggregate totals across all user's projects."""
        qs = self.get_queryset()
        from django.db.models import Sum
        from decimal import Decimal
        from apps.transactions.models import Transaction

        total_estimated = qs.aggregate(
            total=Sum('items__estimated_amount')
        )['total'] or Decimal('0')

        total_spent = Transaction.objects.filter(
            user=request.user, project_item__isnull=False
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

        return Response({
            'total_estimated': str(total_estimated.quantize(Decimal('0.01'))),
            'total_spent': str(total_spent.quantize(Decimal('0.01'))),
            'remaining': str((total_estimated - total_spent).quantize(Decimal('0.01'))),
            'project_count': qs.count(),
        })


class ProjectItemViewSet(viewsets.ModelViewSet):
    """CRUD for project items, scoped to a project."""

    permission_classes = [permissions.IsAuthenticated]
    lookup_url_kwarg = 'project_pk'

    def get_queryset(self):
        project_id = self.kwargs.get('project_pk')
        return ProjectItem.objects.filter(
            project_id=project_id, project__user=self.request.user
        ).all()

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProjectItemSerializer
        return ProjectItemCreateUpdateSerializer

    def perform_create(self, serializer):
        project = Project.objects.get(
            id=self.kwargs['project_pk'], user=self.request.user
        )
        serializer.save(project=project)

    @action(detail=False, methods=['get'])
    def with_spent(self, request, project_pk=None):
        """Return items with actual_spent computed."""
        items = self.get_queryset()
        serializer = ProjectItemSerializer(items, many=True, context={'request': request})
        return Response(serializer.data)

