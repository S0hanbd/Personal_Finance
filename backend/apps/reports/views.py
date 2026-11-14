"""Reports API views — CSV export and PDF generation endpoints."""

from datetime import date

from django.http import HttpResponse
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response

from .services import (
    export_transactions_csv,
    generate_monthly_report,
    generate_budget_report,
    generate_project_report,
)


class ReportsViewSet(viewsets.ViewSet):
    """Reports endpoints — CSV export and PDF generation."""

    permission_classes = [permissions.IsAuthenticated]

    def _parse_date(self, value):
        """Parse a date from query params."""
        if value is None:
            return None
        try:
            return date.fromisoformat(value)
        except (ValueError, TypeError):
            return None

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        """Export filtered transactions to CSV."""
        start_date = self._parse_date(request.query_params.get('start_date'))
        end_date = self._parse_date(request.query_params.get('end_date'))
        transaction_type = request.query_params.get('transaction_type')
        account_id = request.query_params.get('account_id')
        category_id = request.query_params.get('category_id')

        csv_data = export_transactions_csv(
            request.user,
            start_date=start_date,
            end_date=end_date,
            transaction_type=transaction_type,
            account_id=int(account_id) if account_id else None,
            category_id=int(category_id) if category_id else None,
        )

        response = HttpResponse(csv_data, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="transactions.csv"'
        return response

    @action(detail=False, methods=['get'])
    def monthly_report(self, request):
        """Generate a monthly financial report PDF."""
        year_str = request.query_params.get('year')
        month_str = request.query_params.get('month')

        if not year_str or not month_str:
            return Response(
                {'error': 'year and month parameters are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            year = int(year_str)
            month = int(month_str)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid year or month format'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            pdf_data = generate_monthly_report(request.user, year, month)
        except Exception as e:
            return Response(
                {'error': f'Failed to generate report: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response = HttpResponse(pdf_data, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="monthly_report_{year}_{month:02d}.pdf"'
        return response

    @action(detail=False, methods=['get'])
    def budget_report(self, request):
        """Generate a budget performance report PDF."""
        year_str = request.query_params.get('year')
        month_str = request.query_params.get('month')

        if not year_str or not month_str:
            return Response(
                {'error': 'year and month parameters are required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            year = int(year_str)
            month = int(month_str)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid year or month format'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            pdf_data = generate_budget_report(request.user, year, month)
        except Exception as e:
            return Response(
                {'error': f'Failed to generate report: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response = HttpResponse(pdf_data, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="budget_report_{year}_{month:02d}.pdf"'
        return response

    @action(detail=False, methods=['get'])
    def project_report(self, request):
        """Generate a project finance report PDF."""
        project_id = request.query_params.get('project_id')

        if not project_id:
            return Response(
                {'error': 'project_id parameter is required'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            project_id_int = int(project_id)
        except (ValueError, TypeError):
            return Response(
                {'error': 'Invalid project_id format'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            pdf_data = generate_project_report(request.user, project_id_int)
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND,
            )
        except Exception as e:
            return Response(
                {'error': f'Failed to generate report: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response = HttpResponse(pdf_data, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="project_report_{project_id_int}.pdf"'
        return response
