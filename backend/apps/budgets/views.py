from datetime import date
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from apps.accounts.models import FinancialAccount
from .models import MonthlyBudget, BudgetCategory, PlannedPurchase
from .serializers import (
    MonthlyBudgetSerializer,
    BudgetCategorySerializer,
    PlannedPurchaseSerializer,
    SettlePlannedPurchaseSerializer,
)
from .services import calculate_budget_performance, settle_planned_purchase


class MonthlyBudgetViewSet(viewsets.ModelViewSet):
    serializer_class = MonthlyBudgetSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return MonthlyBudget.objects.filter(
            user=self.request.user
        ).prefetch_related('category_allocations__category')

    @action(detail=False, methods=['get'], url_path='performance')
    def performance(self, request):
        today = date.today()
        try:
            year = int(request.query_params.get('year', today.year))
            month = int(request.query_params.get('month', today.month))
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid year or month parameter.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        data = calculate_budget_performance(request.user, year, month)
        return Response(data)


class BudgetCategoryViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetCategorySerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return BudgetCategory.objects.filter(
            budget__user=self.request.user
        ).select_related('category')


class PlannedPurchaseViewSet(viewsets.ModelViewSet):
    serializer_class = PlannedPurchaseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = PlannedPurchase.objects.filter(
            user=self.request.user
        ).select_related('category', 'purchased_transaction')

        item_status = self.request.query_params.get('status')
        if item_status:
            qs = qs.filter(status=item_status)

        priority = self.request.query_params.get('priority')
        if priority:
            qs = qs.filter(priority=priority)

        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'], url_path='purchase')
    def purchase(self, request, pk=None):
        planned_item = self.get_object()
        serializer = SettlePlannedPurchaseSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        account_id = serializer.validated_data['account_id']
        try:
            account = FinancialAccount.objects.get(id=account_id, user=request.user)
        except FinancialAccount.DoesNotExist:
            return Response(
                {'error': 'Selected payment account was not found.'},
                status=status.HTTP_404_NOT_FOUND
            )

        try:
            item, tx = settle_planned_purchase(
                planned_item=planned_item,
                account=account,
                actual_amount=serializer.validated_data.get('actual_amount'),
                payment_date=serializer.validated_data.get('payment_date'),
                description=serializer.validated_data.get('description'),
            )
        except ValueError as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

        return Response(PlannedPurchaseSerializer(item).data)
