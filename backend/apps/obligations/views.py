from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from datetime import date
from django.db.models import Sum
from .models import FinancialObligation
from .serializers import FinancialObligationSerializer, PayObligationSerializer
from .services import pay_obligation
from apps.accounts.models import FinancialAccount


class FinancialObligationViewSet(viewsets.ModelViewSet):
    serializer_class = FinancialObligationSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = FinancialObligation.objects.filter(user=self.request.user).select_related('category')
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)

        # Update overdue statuses on the fly for pending items
        today = date.today()
        pending_overdue = qs.filter(status='pending', due_date__lt=today)
        if pending_overdue.exists():
            pending_overdue.update(status='overdue')

        return qs

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=False, methods=['get'], url_path='summary')
    def summary(self, request):
        qs = self.get_queryset()
        pending_qs = qs.filter(status__in=['pending', 'overdue'])
        total_pending = pending_qs.aggregate(total=Sum('amount'))['total'] or 0
        total_paid = qs.filter(status='paid').aggregate(total=Sum('amount'))['total'] or 0

        from decimal import Decimal
        return Response({
            'total_pending': f"{Decimal(str(total_pending)):.2f}",
            'total_paid': f"{Decimal(str(total_paid)):.2f}",
            'pending_count': pending_qs.count(),
        })

    @action(detail=True, methods=['post'], url_path='pay')
    def pay(self, request, pk=None):
        obligation = self.get_object()
        serializer = PayObligationSerializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        account = FinancialAccount.objects.get(
            id=serializer.validated_data['account_id'],
            user=request.user
        )

        try:
            obligation, tx = pay_obligation(
                obligation=obligation,
                account=account,
                payment_date=serializer.validated_data.get('payment_date'),
                description=serializer.validated_data.get('description'),
            )
            return Response(
                FinancialObligationSerializer(obligation).data,
                status=status.HTTP_200_OK
            )
        except ValueError as err:
            return Response({'error': str(err)}, status=status.HTTP_400_BAD_REQUEST)
