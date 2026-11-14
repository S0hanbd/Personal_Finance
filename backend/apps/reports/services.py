"""Reports services — CSV export and PDF generation."""

import csv
import io
from datetime import date
from decimal import Decimal

from django.db.models import Sum

from apps.transactions.models import Transaction
from apps.budgets.models import MonthlyBudget
from apps.projects.models import Project, ProjectItem


def export_transactions_csv(
    user,
    start_date: date | None = None,
    end_date: date | None = None,
    transaction_type: str | None = None,
    account_id: int | None = None,
    category_id: int | None = None,
) -> str:
    """Export filtered transactions to CSV format.

    Returns a CSV string with headers and all matching transactions.
    """
    qs = Transaction.objects.filter(user=user).select_related(
        'account', 'category', 'income_source', 'project_item'
    )

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

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow([
        'Date',
        'Type',
        'Amount',
        'Account',
        'Category',
        'Income Source',
        'Project Item',
        'Description',
    ])

    for tx in qs.order_by('transaction_date'):
        writer.writerow([
            tx.transaction_date.isoformat(),
            tx.get_transaction_type_display(),
            str(tx.amount),
            tx.account.name,
            tx.category.name if tx.category else '',
            tx.income_source.name if tx.income_source else '',
            tx.project_item.name if tx.project_item else '',
            tx.description or '',
        ])

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
) -> bytes:
    """Generate a monthly financial report as PDF bytes."""
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import (
        SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
    )

    data = _get_monthly_data(user, year, month)
    month_name = date(year, month, 1).strftime('%B %Y')

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

    # Summary cards
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

    # Category breakdown
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

    doc.build(elements)
    return buffer.getvalue()


def generate_budget_report(
    user,
    year: int,
    month: int,
) -> bytes:
    """Generate a budget performance report as PDF bytes."""
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import (
        SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
    )

    month_name = date(year, month, 1).strftime('%B %Y')

    # Get budget data
    budget = MonthlyBudget.objects.filter(
        user=user, year=year, month=month
    ).first()

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

    # Get actual spending
    start = date(year, month, 1)
    if month == 12:
        end = date(year + 1, 1, 1)
    else:
        end = date(year, month + 1, 1)

    # Category allocations vs actual
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

    # Add totals row
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

    doc.build(elements)
    return buffer.getvalue()


def generate_project_report(
    user,
    project_id: int,
) -> bytes:
    """Generate a project finance report as PDF bytes."""
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import inch
    from reportlab.platypus import (
        SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer,
    )

    project = Project.objects.filter(user=user, id=project_id).first()
    if not project:
        raise ValueError('Project not found')

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

    # Get items with actual spent
    items = ProjectItem.objects.filter(project=project).order_by('order')

    total_estimated = Decimal('0')
    total_spent = Decimal('0')

    item_data = [['Item', 'Estimated', 'Actual Spent', 'Remaining', 'Progress']]
    for item in items:
        actual = item.transactions.aggregate(total=Sum('amount'))['total'] or Decimal('0')
        remaining = item.estimated_amount - actual
        pct = (actual / item.estimated_amount * 100) if item.estimated_amount > 0 else 0
        progress = f"{pct:.0f}%"

        total_estimated += item.estimated_amount
        total_spent += actual

        item_data.append([
            item.name,
            f"৳{item.estimated_amount:.2f}",
            f"৳{actual:.2f}",
            f"৳{remaining:.2f}",
            progress,
        ])

    # Totals row
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
    elements.append(Spacer(1, 20))

    # Transaction list
    transactions = Transaction.objects.filter(
        project_item__project=project
    ).select_related('account', 'category').order_by('transaction_date')

    if transactions:
        elements.append(Paragraph('Transactions', styles['Heading2']))
        elements.append(Spacer(1, 8))

        tx_data = [['Date', 'Type', 'Amount', 'Account', 'Description']]
        for tx in transactions:
            tx_data.append([
                tx.transaction_date.isoformat(),
                tx.get_transaction_type_display(),
                f"৳{tx.amount:.2f}",
                tx.account.name,
                tx.description or '',
            ])

        tx_table = Table(tx_data, colWidths=[0.9 * inch, 0.8 * inch, 1 * inch, 1.2 * inch, 2.1 * inch])
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

    doc.build(elements)
    return buffer.getvalue()
