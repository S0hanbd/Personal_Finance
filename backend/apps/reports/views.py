"""Reports API views — CSV export and PDF generation with customization."""

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
    """Reports endpoints — CSV export and PDF generation with customization."""

    permission_classes = [permissions.IsAuthenticated]

    def _parse_date(self, value):
        """Parse a date from query params."""
        if value is None:
            return None
        try:
            return date.fromisoformat(value)
        except (ValueError, TypeError):
            return None

    @action(detail=False, methods=['get', 'post'])
    def export_csv(self, request):
        """Export filtered transactions to CSV.

        GET: query params for filters.
        POST: JSON body with 'options' dict for customization.
        """
        import json
        options = None
        if request.method == 'POST':
            # Parse JSON body manually since @action doesn't handle POST body well
            raw = request.body
            if raw:
                try:
                    data = json.loads(raw)
                    options = data.get('options', {})
                except (json.JSONDecodeError, TypeError):
                    options = {}
            filters = options.get('filters', {}) if options else {}
            start_date = self._parse_date(filters.get('start_date'))
            end_date = self._parse_date(filters.get('end_date'))
            transaction_type = filters.get('transaction_type')
            account_id = filters.get('account_id')
            category_id = filters.get('category_id')
        else:
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
            options=options,
        )

        response = HttpResponse(csv_data, content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="transactions.csv"'
        return response

    @action(detail=False, methods=['get', 'post'])
    def monthly_report(self, request):
        """Generate a monthly financial report PDF.

        GET: query params for year/month.
        POST: JSON body with 'year', 'month', and 'options' for customization.
        """
        import json
        if request.method == 'POST':
            raw = request.body
            if raw:
                try:
                    data = json.loads(raw)
                    year_str = data.get('year')
                    month_str = data.get('month')
                    options = data.get('options', {})
                except (json.JSONDecodeError, TypeError):
                    return Response(
                        {'error': 'Invalid JSON body'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                return Response(
                    {'error': 'year and month parameters are required'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            year_str = request.query_params.get('year')
            month_str = request.query_params.get('month')
            options = None

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
            pdf_data = generate_monthly_report(request.user, year, month, options)
        except Exception as e:
            return Response(
                {'error': f'Failed to generate report: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response = HttpResponse(pdf_data, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="monthly_report_{year}_{month:02d}.pdf"'
        return response

    @action(detail=False, methods=['get', 'post'])
    def budget_report(self, request):
        """Generate a budget performance report PDF.

        GET: query params for year/month.
        POST: JSON body with 'year', 'month', and 'options' for customization.
        """
        import json
        if request.method == 'POST':
            raw = request.body
            if raw:
                try:
                    data = json.loads(raw)
                    year_str = data.get('year')
                    month_str = data.get('month')
                    options = data.get('options', {})
                except (json.JSONDecodeError, TypeError):
                    return Response(
                        {'error': 'Invalid JSON body'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                return Response(
                    {'error': 'year and month parameters are required'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            year_str = request.query_params.get('year')
            month_str = request.query_params.get('month')
            options = None

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
            pdf_data = generate_budget_report(request.user, year, month, options)
        except Exception as e:
            return Response(
                {'error': f'Failed to generate report: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        response = HttpResponse(pdf_data, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="budget_report_{year}_{month:02d}.pdf"'
        return response

    @action(detail=False, methods=['get', 'post'])
    def project_report(self, request):
        """Generate a project finance report PDF.

        GET: query params for project_id.
        POST: JSON body with 'project_id' and 'options' for customization.
        """
        import json
        if request.method == 'POST':
            raw = request.body
            if raw:
                try:
                    data = json.loads(raw)
                    project_id = data.get('project_id')
                    options = data.get('options', {})
                except (json.JSONDecodeError, TypeError):
                    return Response(
                        {'error': 'Invalid JSON body'},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                return Response(
                    {'error': 'project_id parameter is required'},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        else:
            project_id = request.query_params.get('project_id')
            options = None

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
            pdf_data = generate_project_report(request.user, project_id_int, options)
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
