from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import FinancialAccount
from .serializers import FinancialAccountSerializer
from apps.transactions.services import reconcile_account


class FinancialAccountViewSet(viewsets.ModelViewSet):
    serializer_class = FinancialAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FinancialAccount.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        account = serializer.save(user=self.request.user)
        account.current_balance = account.opening_balance
        account.save(update_fields=['current_balance'])

    @action(detail=True, methods=['post'], url_path='reconcile')
    def reconcile(self, request, pk=None):
        account = self.get_object()
        new_balance = reconcile_account(account)
        return Response({
            'status': 'reconciled',
            'current_balance': str(new_balance)
        }, status=status.HTTP_200_OK)
