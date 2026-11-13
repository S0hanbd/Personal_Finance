from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum
from .models import RecurringExpense, RecurringExpenseOccurrence
from .serializers import (
    RecurringExpenseSerializer,
    RecurringExpenseOccurrenceSerializer,
    PayBillOccurrenceSerializer,
)
from .services import generate_monthly_occurrences, pay_bill_occurrence, get_current_period
from apps.accounts.models import FinancialAccount


class RecurringExpenseViewSet(viewsets.ModelViewSet):
    serializer_class = RecurringExpenseSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return RecurringExpense.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        bill = serializer.save(user=self.request.user)
        # Immediately generate current month occurrence if applicable
        generate_monthly_occurrences(self.request.user)
        return bill


class RecurringExpenseOccurrenceViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RecurringExpenseOccurrenceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        period = self.request.query_params.get('period')
        qs = RecurringExpenseOccurrence.objects.filter(
            recurring_expense__user=self.request.user
        ).select_related('recurring_expense', 'recurring_expense__category', 'recurring_expense__preferred_account')

        if period:
            qs = qs.filter(period=period)
        return qs

    @action(detail=False, methods=['get'], url_path='current-month')
    def current_month(self, request):
        """
        Auto-generates occurrences for the current period and returns them
        along with summary metrics (unpaid_total, paid_total).
        """
        period = request.query_params.get('period') or get_current_period()
        generate_monthly_occurrences(request.user, period=period)

        occurrences = self.get_queryset().filter(period=period)
        serializer = self.get_serializer(occurrences, many=True)

        unpaid_total = occurrences.filter(status__in=['unpaid', 'overdue']).aggregate(
            total=Sum('amount')
        )['total'] or 0

        paid_total = occurrences.filter(status='paid').aggregate(
            total=Sum('amount')
        )['total'] or 0

        from decimal import Decimal
        return Response({
            'period': period,
            'unpaid_total': f"{Decimal(str(unpaid_total)):.2f}",
            'paid_total': f"{Decimal(str(paid_total)):.2f}",
            'results': serializer.data,
        })

    @action(detail=True, methods=['post'], url_path='pay')
    def pay(self, request, pk=None):
        occurrence = self.get_object()
        serializer = PayBillOccurrenceSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        account = FinancialAccount.objects.get(
            id=serializer.validated_data['account_id'],
            user=request.user
        )

        try:
            occurrence, tx = pay_bill_occurrence(
                occurrence=occurrence,
                account=account,
                payment_date=serializer.validated_data.get('payment_date'),
                description=serializer.validated_data.get('description'),
            )
            return Response(
                RecurringExpenseOccurrenceSerializer(occurrence).data,
                status=status.HTTP_200_OK
            )
        except ValueError as err:
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)
