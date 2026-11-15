"""Reports services — CSV export and PDF generation with customization options."""

import csv
import io
from datetime import date
from decimal import Decimal
from typing import Any

from django.db.models import Sum

from apps.transactions.models import Transaction
from apps.budgets.models import MonthlyBudget
from apps.projects.models import Project, ProjectItem


# Valid values for options validation
VALID_SECTIONS = {'summary', 'categories', 'transactions', 'charts'}
VALID_COLUMNS = {'date', 'type', 'amount', 'account', 'category',
                 'income_source', 'project_item', 'description'}

# Column name to display name mapping
COLUMN_DISPLAY = {
    'date': 'Date',
    'type': 'Type',
    'amount': 'Amount',
    'account': 'Account',
    'category': 'Category',
    'income_source': 'Income Source',
    'project_item': 'Project Item',
    'description': 'Description',
}

# Default options when none provided
DEFAULT_OPTIONS = {
    'sections': list(VALID_SECTIONS),
    'columns': list(VALID_COLUMNS),
    'include_charts': True,
}


def _validate_options(options: dict[str, Any] | None) -> dict[str, Any]:
    """Validate and normalize report options.

    Returns a normalized options dict with defaults for missing/invalid values.
    """
    if not options:
        return {
            'sections': list(DEFAULT_OPTIONS['sections']),
            'columns': list(DEFAULT_OPTIONS['columns']),
            'include_charts': True,
            'filters': {},
        }

    validated = {}

    # Sections
    sections = options.get('sections')
    if sections and isinstance(sections, list):
        validated['sections'] = [s for s in sections if s in VALID_SECTIONS]
        if not validated['sections']:
            validated['sections'] = list(DEFAULT_OPTIONS['sections'])
    else:
        validated['sections'] = list(DEFAULT_OPTIONS['sections'])

    # Columns
    columns = options.get('columns')
    if columns and isinstance(columns, list):
        validated['columns'] = [c for c in columns if c in VALID_COLUMNS]
        if not validated['columns']:
            validated['columns'] = list(DEFAULT_OPTIONS['columns'])
    else:
        validated['columns'] = list(DEFAULT_OPTIONS['columns'])

    # Include charts
    validated['include_charts'] = bool(options.get('include_charts', True))

    # Filters (passed through, validated by caller)
    filters = options.get('filters')
    if isinstance(filters, dict):
        validated['filters'] = filters
    else:
        validated['filters'] = {}

    return validated


def _get_transaction_field(tx, column: str):
    """Get a transaction field value by column name."""
    if column == 'date':
        return tx.transaction_date.isoformat()
    if column == 'type':
        return tx.get_transaction_type_display()
    if column == 'amount':
        return str(tx.amount)
    if column == 'account':
        return tx.account.name
    if column == 'category':
        return tx.category.name if tx.category else ''
    if column == 'income_source':
        return tx.income_source.name if tx.income_source else ''
    if column == 'project_item':
        return tx.project_item.name if tx.project_item else ''
    if column == 'description':
        return tx.description or ''
    return ''


def _apply_filters(qs, filters: dict) -> Any:
    """Apply filter dict to a transaction queryset."""
    if not filters:
        return qs
    start_date = filters.get('start_date')
    end_date = filters.get('end_date')
    transaction_type = filters.get('transaction_type')
    account_id = filters.get('account_id')
    category_id = filters.get('category_id')

    if start_date:
        try:
            qs = qs.filter(transaction_date__gte=date.fromisoformat(str(start_date)))
        except (ValueError, TypeError):
            pass
    if end_date:
        try:
            qs = qs.filter(transaction_date__lte=date.fromisoformat(str(end_date)))
        except (ValueError, TypeError):
            pass
    if transaction_type:
        qs = qs.filter(transaction_type=transaction_type)
    if account_id:
        try:
            qs = qs.filter(account_id=int(account_id))
        except (ValueError, TypeError):
            pass
    if category_id:
        try:
            qs = qs.filter(category_id=int(category_id))
        except (ValueError, TypeError):
            pass
    return qs


def export_transactions_csv(
    user,
    start_date: date | None = None,
    end_date: date | None = None,
    transaction_type: str | None = None,
    account_id: int | None = None,
    category_id: int | None = None,
    options: dict[str, Any] | None = None,
) -> str:
    """Export filtered transactions to CSV format.

    Supports customization via options dict with 'columns' and 'filters'.
    Returns a CSV string with headers and all matching transactions.
    """
    opts = _validate_options(options)
    columns = opts['columns']
    filters = opts['filters']

    qs = Transaction.objects.filter(user=user).select_related(
        'account', 'category', 'income_source', 'project_item'
    )

    # Apply legacy params (backward compat) or filters from options
    if start_date:
        qs = qs.filter(transaction_date__gte=start_date)
    if end_date:
        qs = qs.filter(transaction_date__lte=end_date)
    if transaction_type:
        qs = qs.filter(transaction_type=transaction_type)
    if account_id:
        qs = qs.filter(account_id=account_id)
    if category_id:
        qs = qs.filter(category_id=category_id)
    # Apply additional filters from options
    qs = _apply_filters(qs, filters)

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([COLUMN_DISPLAY.get(c, c) for c in columns])

    for tx in qs.order_by('transaction_date'):
        writer.writerow([_get_transaction_field(tx, c) for c in columns])

    return output.getvalue()


def _get_monthly_data(user, year: int, month: int) -> dict:
    """Get aggregated monthly income/expense data."""
    start = date(year, month, 1)
    if month == 12:
        end = date(year + 1, 1, 1)
    else:
        end = date(year, month + 1, 1)

    qs = Transaction.objects.filter(
        user=user,
        transaction_date__gte=start,
        transaction_date__lt=end,
    )

    income_total = qs.filter(transaction_type='income').aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0')

    expense_total = qs.filter(transaction_type='expense').aggregate(
        total=Sum('amount')
    )['total'] or Decimal('0')

    # Category breakdown
    category_data = []
    categories = qs.filter(transaction_type='expense').values(
        'category__name'
    ).annotate(total=Sum('amount')).order_by('-total')
    for cat in categories:
        category_data.append({
            'name': cat['category__name'] or 'Uncategorized',
            'amount': cat['total'],
        })

    return {
        'income': income_total,
        'expense': expense_total,
        'net': income_total - expense_total,
        'categories': category_data,
    }


def generate_monthly_report(
    user,
    year: int,
    month: int,
    options: dict[str, Any] | None = None,
) -> bytes:
    """Generate a monthly financial report as PDF bytes.

    Supports customization via options dict with 'sections', 'columns',
    'filters', and 'include_charts'.
    """
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import (
        SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
    )

    opts = _validate_options(options)
    sections = opts['sections']
    columns = opts['columns']
    filters = opts['filters']
    include_charts = opts['include_charts']

    data = _get_monthly_data(user, year, month)
    month_name = date(year, month, 1).strftime('%B %Y')

    # Get filtered transactions if 'transactions' section is requested
    transactions = []
    if 'transactions' in sections:
        start = date(year, month, 1)
        if month == 12:
            end = date(year + 1, 1, 1)
        else:
            end = date(year, month + 1, 1)
        qs = Transaction.objects.filter(
            user=user,
            transaction_date__gte=start,
            transaction_date__lt=end,
        ).select_related('account', 'category', 'income_source', 'project_item')
        qs = _apply_filters(qs, filters)
        transactions = qs.order_by('transaction_date')

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=6,
        textColor=colors.HexColor('#172554'),
    )
    subtitle_style = ParagraphStyle(
        'ReportSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=12,
        textColor=colors.HexColor('#64748B'),
    )

    elements = []

    # Title
    elements.append(Paragraph('Monthly Financial Report', title_style))
    elements.append(Paragraph(month_name, subtitle_style))
    elements.append(Spacer(1, 12))

    # Summary section
    if 'summary' in sections:
        summary_data = [
            ['Income', 'Expense', 'Net'],
            [
                f"৳{data['income']:.2f}",
                f"৳{data['expense']:.2f}",
                f"৳{data['net']:.2f}",
            ],
        ]
        summary_table = Table(summary_data, colWidths=[2 * inch, 2 * inch, 2 * inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#172554')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#F8FAFC')),
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, 1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 20))

    # Category breakdown section
    if 'categories' in sections:
        if data['categories']:
            elements.append(Paragraph('Spending by Category', styles['Heading2']))
            elements.append(Spacer(1, 8))

            cat_data = [['Category', 'Amount', '% of Total']]
            for cat in data['categories']:
                pct = (cat['amount'] / data['expense'] * 100) if data['expense'] > 0 else 0
                cat_data.append([
                    cat['name'],
                    f"৳{cat['amount']:.2f}",
                    f"{pct:.1f}%",
                ])

            cat_table = Table(cat_data, colWidths=[2.5 * inch, 1.5 * inch, 1.5 * inch])
            cat_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#172554')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 9),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('ALIGN', (1, 1), (-1, -1), 'RIGHT'),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 6),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ]))
            elements.append(cat_table)
        else:
            elements.append(Paragraph('No expense data for this period.', styles['Normal']))
        elements.append(Spacer(1, 16))

    # Transaction details section
    if 'transactions' in sections:
        if transactions:
            elements.append(Paragraph('Transaction Details', styles['Heading2']))
            elements.append(Spacer(1, 8))

            # Build column widths dynamically
            num_cols = len(columns)
            col_width = 5.0 / max(num_cols, 1)
            col_widths = [col_width * inch] * num_cols

            tx_data = [[COLUMN_DISPLAY.get(c, c) for c in columns]]
            for tx in transactions:
                tx_data.append([_get_transaction_field(tx, c) for c in columns])

            tx_table = Table(tx_data, colWidths=col_widths)
            tx_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#172554')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(tx_table)
        else:
            elements.append(Paragraph('No transactions for this period.', styles['Normal']))
        elements.append(Spacer(1, 16))

    # Charts section (placeholder — charts rendered as text summary)
    if 'charts' in sections and include_charts:
        elements.append(Paragraph('Charts & Projections', styles['Heading2']))
        elements.append(Spacer(1, 8))
        if data['expense'] > 0:
            chart_text = []
            for cat in data['categories'][:5]:
                pct = (cat['amount'] / data['expense'] * 100) if data['expense'] > 0 else 0
                bar_len = int(pct / 2)
                bar = '█' * bar_len + '░' * (50 - bar_len)
                chart_text.append(f"  {cat['name'][:15]:<15} |{bar}| {pct:.0f}%")
            elements.append(Paragraph('Spending Distribution:', styles['Normal']))
            for line in chart_text:
                elements.append(Paragraph(line, ParagraphStyle('chart', fontName='Courier', fontSize=7)))
        else:
            elements.append(Paragraph('No data to chart.', styles['Normal']))
        elements.append(Spacer(1, 16))

    doc.build(elements)
    return buffer.getvalue()


def generate_budget_report(
    user,
    year: int,
    month: int,
    options: dict[str, Any] | None = None,
) -> bytes:
    """Generate a budget performance report as PDF bytes.

    Supports customization via options dict with 'sections', 'columns',
    'filters', and 'include_charts'.
    """
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import (
        SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
    )

    opts = _validate_options(options)
    sections = opts['sections']
    columns = opts['columns']
    filters = opts['filters']
    include_charts = opts['include_charts']

    month_name = date(year, month, 1).strftime('%B %Y')

    # Get budget data
    budget = MonthlyBudget.objects.filter(
        user=user, year=year, month=month
    ).first()

    start = date(year, month, 1)
    if month == 12:
        end = date(year + 1, 1, 1)
    else:
        end = date(year, month + 1, 1)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=6,
        textColor=colors.HexColor('#172554'),
    )
    subtitle_style = ParagraphStyle(
        'ReportSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=12,
        textColor=colors.HexColor('#64748B'),
    )

    elements = []
    elements.append(Paragraph('Budget Performance Report', title_style))
    elements.append(Paragraph(month_name, subtitle_style))
    elements.append(Spacer(1, 12))

    if not budget:
        elements.append(Paragraph('No budget set for this period.', styles['Normal']))
        doc.build(elements)
        return buffer.getvalue()

    # Summary section — total budget vs actual
    if 'summary' in sections:
        total_allocated = budget.total_amount
        qs = Transaction.objects.filter(
            user=user,
            transaction_type='expense',
            transaction_date__gte=start,
            transaction_date__lt=end,
        )
        qs = _apply_filters(qs, filters)
        total_actual = qs.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        remaining = total_allocated - total_actual

        summary_data = [
            ['Budget', 'Spent', 'Remaining'],
            [
                f"৳{total_allocated:.2f}",
                f"৳{total_actual:.2f}",
                f"৳{remaining:.2f}",
            ],
        ]
        summary_table = Table(summary_data, colWidths=[2 * inch, 2 * inch, 2 * inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#172554')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#F8FAFC')),
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, 1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 20))

    # Category breakdown section
    if 'categories' in sections:
        cat_data = [['Category', 'Allocated', 'Actual', 'Remaining', 'Status']]

        total_allocated = Decimal('0')
        total_actual = Decimal('0')

        for bc in budget.category_allocations.all():
            allocated = bc.allocated_amount
            actual = Transaction.objects.filter(
                user=user,
                transaction_type='expense',
                category=bc.category,
                transaction_date__gte=start,
                transaction_date__lt=end,
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0')

            remaining = allocated - actual
            status = 'Over' if remaining < 0 else 'On track'

            total_allocated += allocated
            total_actual += actual

            cat_data.append([
                bc.category.name,
                f"৳{allocated:.2f}",
                f"৳{actual:.2f}",
                f"৳{remaining:.2f}",
                status,
            ])

        cat_data.append([
            'Total',
            f"৳{total_allocated:.2f}",
            f"৳{total_actual:.2f}",
            f"৳{(total_allocated - total_actual):.2f}",
            '',
        ])

        table = Table(cat_data, colWidths=[1.5 * inch, 1.2 * inch, 1.2 * inch, 1.2 * inch, 1 * inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#172554')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (3, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor('#F8FAFC')]),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#172554')),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 16))

    # Transaction details section
    if 'transactions' in sections:
        qs = Transaction.objects.filter(
            user=user,
            transaction_type='expense',
            transaction_date__gte=start,
            transaction_date__lt=end,
        ).select_related('account', 'category', 'income_source', 'project_item')
        qs = _apply_filters(qs, filters)
        transactions = qs.order_by('transaction_date')

        if transactions:
            elements.append(Paragraph('Transaction Details', styles['Heading2']))
            elements.append(Spacer(1, 8))

            num_cols = len(columns)
            col_width = 5.0 / max(num_cols, 1)
            col_widths = [col_width * inch] * num_cols

            tx_data = [[COLUMN_DISPLAY.get(c, c) for c in columns]]
            for tx in transactions:
                tx_data.append([_get_transaction_field(tx, c) for c in columns])

            tx_table = Table(tx_data, colWidths=col_widths)
            tx_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#172554')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(tx_table)
        else:
            elements.append(Paragraph('No transactions for this period.', styles['Normal']))
        elements.append(Spacer(1, 16))

    # Charts section
    if 'charts' in sections and include_charts:
        elements.append(Paragraph('Budget vs Actual Overview', styles['Heading2']))
        elements.append(Spacer(1, 8))
        for bc in budget.category_allocations.all():
            actual = Transaction.objects.filter(
                user=user,
                transaction_type='expense',
                category=bc.category,
                transaction_date__gte=start,
                transaction_date__lt=end,
            ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
            pct = (actual / bc.allocated_amount * 100) if bc.allocated_amount > 0 else 0
            bar_len = min(int(pct / 2), 50)
            bar = '█' * bar_len + '░' * (50 - bar_len)
            elements.append(Paragraph(
                f"  {bc.category.name[:15]:<15} |{bar}| {pct:.0f}%",
                ParagraphStyle('chart', fontName='Courier', fontSize=7)
            ))
        elements.append(Spacer(1, 16))

    doc.build(elements)
    return buffer.getvalue()


def generate_project_report(
    user,
    project_id: int,
    options: dict[str, Any] | None = None,
) -> bytes:
    """Generate a project finance report as PDF bytes.

    Supports customization via options dict with 'sections', 'columns',
    'filters', and 'include_charts'.
    """
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import (
        SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
    )

    opts = _validate_options(options)
    sections = opts['sections']
    columns = opts['columns']
    filters = opts['filters']
    include_charts = opts['include_charts']

    project = Project.objects.filter(user=user, id=project_id).first()
    if not project:
        raise ValueError('Project not found')

    items = ProjectItem.objects.filter(project=project).order_by('order')

    total_estimated = Decimal('0')
    total_spent = Decimal('0')

    for item in items:
        actual = item.transactions.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        total_estimated += item.estimated_amount
        total_spent += actual

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        topMargin=0.5 * inch,
        bottomMargin=0.5 * inch,
        leftMargin=0.75 * inch,
        rightMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'ReportTitle',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=6,
        textColor=colors.HexColor('#172554'),
    )
    subtitle_style = ParagraphStyle(
        'ReportSubtitle',
        parent=styles['Normal'],
        fontSize=12,
        spaceAfter=12,
        textColor=colors.HexColor('#64748B'),
    )

    elements = []
    elements.append(Paragraph('Project Finance Report', title_style))
    elements.append(Paragraph(project.name, subtitle_style))
    if project.description:
        elements.append(Paragraph(project.description, styles['Normal']))
    elements.append(Spacer(1, 6))
    elements.append(Paragraph(f"Status: {project.get_status_display()}", styles['Normal']))
    elements.append(Spacer(1, 12))

    # Summary section
    if 'summary' in sections:
        summary_data = [
            ['Estimated', 'Spent', 'Remaining'],
            [
                f"৳{total_estimated:.2f}",
                f"৳{total_spent:.2f}",
                f"৳{(total_estimated - total_spent):.2f}",
            ],
        ]
        summary_table = Table(summary_data, colWidths=[2 * inch, 2 * inch, 2 * inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#172554')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('BACKGROUND', (0, 1), (-1, 1), colors.HexColor('#F8FAFC')),
            ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 1), (-1, 1), 12),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
        ]))
        elements.append(summary_table)
        elements.append(Spacer(1, 20))

    # Category (items) breakdown section
    if 'categories' in sections:
        item_data = [['Item', 'Estimated', 'Actual Spent', 'Remaining', 'Progress']]
        for item in items:
            actual = item.transactions.aggregate(total=Sum('amount'))['total'] or Decimal('0')
            remaining = item.estimated_amount - actual
            pct = (actual / item.estimated_amount * 100) if item.estimated_amount > 0 else 0
            progress = f"{pct:.0f}%"

            item_data.append([
                item.name,
                f"৳{item.estimated_amount:.2f}",
                f"৳{actual:.2f}",
                f"৳{remaining:.2f}",
                progress,
            ])

        item_data.append([
            'Total',
            f"৳{total_estimated:.2f}",
            f"৳{total_spent:.2f}",
            f"৳{(total_estimated - total_spent):.2f}",
            '',
        ])

        table = Table(item_data, colWidths=[1.5 * inch, 1.2 * inch, 1.2 * inch, 1.2 * inch, 1 * inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#172554')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 9),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (1, 0), (3, -1), 'RIGHT'),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -2), [colors.white, colors.HexColor('#F8FAFC')]),
            ('BACKGROUND', (0, -1), (-1, -1), colors.HexColor('#172554')),
            ('TEXTCOLOR', (0, -1), (-1, -1), colors.white),
            ('FONTNAME', (0, -1), (-1, -1), 'Helvetica-Bold'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ]))
        elements.append(table)
        elements.append(Spacer(1, 16))

    # Transaction details section
    if 'transactions' in sections:
        qs = Transaction.objects.filter(
            project_item__project=project
        ).select_related('account', 'category', 'income_source', 'project_item')
        qs = _apply_filters(qs, filters)
        transactions = qs.order_by('transaction_date')

        if transactions:
            elements.append(Paragraph('Transaction Details', styles['Heading2']))
            elements.append(Spacer(1, 8))

            num_cols = len(columns)
            col_width = 5.0 / max(num_cols, 1)
            col_widths = [col_width * inch] * num_cols

            tx_data = [[COLUMN_DISPLAY.get(c, c) for c in columns]]
            for tx in transactions:
                tx_data.append([_get_transaction_field(tx, c) for c in columns])

            tx_table = Table(tx_data, colWidths=col_widths)
            tx_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#172554')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 8),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#E2E8F0')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor('#F8FAFC')]),
                ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
                ('TOPPADDING', (0, 0), (-1, -1), 4),
                ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
            ]))
            elements.append(tx_table)
        else:
            elements.append(Paragraph('No transactions for this project.', styles['Normal']))
        elements.append(Spacer(1, 16))

    # Charts section
    if 'charts' in sections and include_charts:
        elements.append(Paragraph('Item Budget Progress', styles['Heading2']))
        elements.append(Spacer(1, 8))
        for item in items:
            actual = item.transactions.aggregate(total=Sum('amount'))['total'] or Decimal('0')
            pct = (actual / item.estimated_amount * 100) if item.estimated_amount > 0 else 0
            bar_len = min(int(pct / 2), 50)
            bar = '█' * bar_len + '░' * (50 - bar_len)
            elements.append(Paragraph(
                f"  {item.name[:15]:<15} |{bar}| {pct:.0f}%",
                ParagraphStyle('chart', fontName='Courier', fontSize=7)
            ))
        elements.append(Spacer(1, 16))

    doc.build(elements)
    return buffer.getvalue()
