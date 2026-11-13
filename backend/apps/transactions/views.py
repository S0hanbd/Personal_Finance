from rest_framework import viewsets, permissions
from .models import Transaction, IncomeSource, ExpenseCategory, AccountTransfer
from .serializers import (
    TransactionSerializer, IncomeSourceSerializer,
    ExpenseCategorySerializer, AccountTransferSerializer,
)


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).select_related('account', 'category', 'income_source')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class IncomeSourceViewSet(viewsets.ModelViewSet):
    serializer_class = IncomeSourceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return IncomeSource.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return ExpenseCategory.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AccountTransferViewSet(viewsets.ModelViewSet):
    serializer_class = AccountTransferSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return AccountTransfer.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
