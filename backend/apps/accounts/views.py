from rest_framework import viewsets, permissions
from .models import FinancialAccount
from .serializers import FinancialAccountSerializer


class FinancialAccountViewSet(viewsets.ModelViewSet):
    serializer_class = FinancialAccountSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return FinancialAccount.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        account = serializer.save(user=self.request.user)
        account.current_balance = account.opening_balance
        account.save()
