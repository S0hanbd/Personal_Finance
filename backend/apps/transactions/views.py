from rest_framework import viewsets, permissions, filters, status
from rest_framework.response import Response
from django_filters.rest_framework import DjangoFilterBackend
import django_filters
from .models import Transaction, IncomeSource, ExpenseCategory, AccountTransfer
from .serializers import (
    TransactionSerializer, IncomeSourceSerializer,
    ExpenseCategorySerializer, AccountTransferSerializer,
)
from . import services


class TransactionFilter(django_filters.FilterSet):
    start_date = django_filters.DateFilter(field_name='transaction_date', lookup_expr='gte')
    end_date = django_filters.DateFilter(field_name='transaction_date', lookup_expr='lte')

    class Meta:
        model = Transaction
        fields = ['account', 'transaction_type', 'category', 'income_source', 'start_date', 'end_date']


class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TransactionFilter
    search_fields = ['description']
    ordering_fields = ['transaction_date', 'amount', 'created_at']
    ordering = ['-transaction_date', '-created_at']

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user).select_related('account', 'category', 'income_source')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tx = services.create_transaction(
            user=request.user,
            **serializer.validated_data
        )
        return Response(self.get_serializer(tx).data, status=status.HTTP_201_CREATED)

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        tx = services.update_transaction(instance, **serializer.validated_data)
        return Response(self.get_serializer(tx).data)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        services.delete_transaction(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class IncomeSourceViewSet(viewsets.ModelViewSet):
    serializer_class = IncomeSourceSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        return IncomeSource.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class ExpenseCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = ExpenseCategorySerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['name']

    def get_queryset(self):
        return ExpenseCategory.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class AccountTransferViewSet(viewsets.ModelViewSet):
    serializer_class = AccountTransferSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering = ['-transaction_date', '-created_at']

    def get_queryset(self):
        return AccountTransfer.objects.filter(user=self.request.user).select_related('source_account', 'destination_account')

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        transfer = services.create_transfer(
            user=request.user,
            **serializer.validated_data
        )
        return Response(self.get_serializer(transfer).data, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        services.delete_transfer(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)
