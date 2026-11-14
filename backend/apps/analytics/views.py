from datetime import date

from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.response import Response

from .services import (
    get_monthly_income_expense,
    get_spending_by_category,
    get_spending_trends,
    get_account_balance_history,
    get_top_categories,
    get_budget_vs_actual,
)


class AnalyticsViewSet(viewsets.ViewSet):
    """Analytics endpoints — each action returns pre-aggregated chart data."""

    permission_classes = [permissions.IsAuthenticated]

    def _get_dates(self, request):
        """Extract start_date and end_date from query params."""
        start = request.query_params.get('start_date')
        end = request.query_params.get('end_date')
        start_date = date.fromisoformat(start) if start else None
        end_date = date.fromisoformat(end) if end else None
        return start_date, end_date

    @action(detail=False, methods=['get'])
    def monthly_trend(self, request):
        """Monthly income vs expense totals."""
        start_date, end_date = self._get_dates(request)
        data = get_monthly_income_expense(
            request.user,
            start_date=start_date,
            end_date=end_date,
        )
        return Response(data)

    @action(detail=False, methods=['get'])
    def category_breakdown(self, request):
        """Expense totals grouped by category."""
        start_date, end_date = self._get_dates(request)
        data = get_spending_by_category(
            request.user,
            start_date=start_date,
            end_date=end_date,
        )
        return Response(data)

    @action(detail=False, methods=['get'])
    def spending_trends(self, request):
        """Daily or weekly spending trends."""
        start_date, end_date = self._get_dates(request)
        granularity = request.query_params.get('granularity')
        data = get_spending_trends(
            request.user,
            start_date=start_date,
            end_date=end_date,
            granularity=granularity,
        )
        return Response(data)

    @action(detail=False, methods=['get'])
    def balance_history(self, request):
        """Daily balance snapshots per account."""
        start_date, end_date = self._get_dates(request)
        data = get_account_balance_history(
            request.user,
            start_date=start_date,
            end_date=end_date,
        )
        return Response(data)

    @action(detail=False, methods=['get'])
    def top_categories(self, request):
        """Top N categories by total spend."""
        start_date, end_date = self._get_dates(request)
        limit = int(request.query_params.get('limit', 10))
        data = get_top_categories(
            request.user,
            start_date=start_date,
            end_date=end_date,
            limit=limit,
        )
        return Response(data)

    @action(detail=False, methods=['get'])
    def budget_vs_actual(self, request):
        """Budget allocations vs actual spending per category."""
        year = int(request.query_params['year']) if 'year' in request.query_params else None
        month = int(request.query_params['month']) if 'month' in request.query_params else None
        data = get_budget_vs_actual(
            request.user,
            year=year,
            month=month,
        )
        return Response(data)

