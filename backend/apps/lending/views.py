from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, DecimalField as DjangoDecimalField
from django.utils import timezone
from .models import Person, LoanRecord, LoanSettlement
from .serializers import (
    PersonSerializer,
    LoanRecordSerializer,
    LoanSettlementSerializer,
    LendMoneySerializer,
    BorrowMoneySerializer,
    SettleLoanSerializer,
)
from .services import lend_money, borrow_money, record_settlement
from apps.accounts.models import FinancialAccount


class PersonViewSet(viewsets.ModelViewSet):
    serializer_class = PersonSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Person.objects.filter(user=self.request.user).order_by('name')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        people = self.get_queryset()
        total_lent = people.aggregate(
            total=Sum('total_lent', output_field=DjangoDecimalField())
        )['total'] or 0
        total_borrowed = people.aggregate(
            total=Sum('total_borrowed', output_field=DjangoDecimalField())
        )['total'] or 0
        from decimal import Decimal
        return Response({
            'total_lent': f"{Decimal(str(total_lent)):.2f}",
            'total_borrowed': f"{Decimal(str(total_borrowed)):.2f}",
            'net_position': f"{Decimal(str(total_lent - total_borrowed)):.2f}",
        })


class LoanRecordViewSet(viewsets.ModelViewSet):
    serializer_class = LoanRecordSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LoanRecord.objects.filter(user=self.request.user).select_related('person')

    @action(detail=False, methods=['post'], url_path='lend')
    def lend(self, request):
        serializer = LendMoneySerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        account = FinancialAccount.objects.get(
            id=serializer.validated_data['account_id'],
            user=request.user,
        )
        try:
            loan = lend_money(
                user=request.user,
                person_name=serializer.validated_data['person_name'],
                amount=serializer.validated_data['amount'],
                account=account,
                due_date=serializer.validated_data.get('due_date'),
                notes=serializer.validated_data.get('notes', ''),
                phone=serializer.validated_data.get('phone', ''),
                email=serializer.validated_data.get('email', ''),
            )
            return Response(
                LoanRecordSerializer(loan).data,
                status=status.HTTP_201_CREATED,
            )
        except ValueError as err:
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=False, methods=['post'], url_path='borrow')
    def borrow(self, request):
        serializer = BorrowMoneySerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        account = FinancialAccount.objects.get(
            id=serializer.validated_data['account_id'],
            user=request.user,
        )
        try:
            loan = borrow_money(
                user=request.user,
                person_name=serializer.validated_data['person_name'],
                amount=serializer.validated_data['amount'],
                account=account,
                due_date=serializer.validated_data.get('due_date'),
                notes=serializer.validated_data.get('notes', ''),
                phone=serializer.validated_data.get('phone', ''),
                email=serializer.validated_data.get('email', ''),
            )
            return Response(
                LoanRecordSerializer(loan).data,
                status=status.HTTP_201_CREATED,
            )
        except ValueError as err:
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'], url_path='settle')
    def settle(self, request, pk=None):
        loan = self.get_object()
        serializer = SettleLoanSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        account = FinancialAccount.objects.get(
            id=serializer.validated_data['account_id'],
            user=request.user,
        )
        settlement_date = serializer.validated_data.get(
            'settlement_date', timezone.now().date()
        )
        try:
            settlement = record_settlement(
                loan=loan,
                amount=serializer.validated_data['amount'],
                account=account,
                settlement_date=settlement_date,
                notes=serializer.validated_data.get('notes', ''),
            )
            return Response(
                LoanSettlementSerializer(settlement).data,
                status=status.HTTP_201_CREATED,
            )
        except ValueError as err:
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)


class LoanSettlementViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = LoanSettlementSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return LoanSettlement.objects.filter(
            loan__user=self.request.user
        ).select_related('loan', 'loan__person', 'transaction')

