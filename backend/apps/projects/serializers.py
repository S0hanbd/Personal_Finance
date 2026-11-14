
from decimal import Decimal

from django.db.models import Sum
from rest_framework import serializers
from .models import Project, ProjectItem


class ProjectItemSerializer(serializers.ModelSerializer):
    actual_spent = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True, coerce_to_string=True
    )
    remaining = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True, coerce_to_string=True
    )
    percent_spent = serializers.FloatField(read_only=True)

    class Meta:
        model = ProjectItem
        fields = [
            'id', 'project', 'name', 'estimated_amount', 'notes', 'order',
            'actual_spent', 'remaining', 'percent_spent', 'created_at', 'updated_at',
        ]
        read_only_fields = ('id', 'created_at', 'updated_at')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        spent_qs = instance.transactions.aggregate(total=Sum('amount'))
        actual = spent_qs['total'] or Decimal('0')
        estimated = instance.estimated_amount or Decimal('0')
        remaining = estimated - actual
        percent = (actual / estimated * 100) if estimated > 0 else Decimal('0')
        data['actual_spent'] = str(actual.quantize(Decimal('0.01')))
        data['remaining'] = str(remaining.quantize(Decimal('0.01')))
        data['percent_spent'] = round(float(percent), 1)
        return data


class ProjectItemCreateUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProjectItem
        fields = ['id', 'name', 'estimated_amount', 'notes', 'order']
        read_only_fields = ('id',)


class ProjectSerializer(serializers.ModelSerializer):
    total_estimated = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True, coerce_to_string=True
    )
    total_spent = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True, coerce_to_string=True
    )
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'user', 'name', 'description', 'status',
            'start_date', 'end_date', 'total_estimated', 'total_spent',
            'item_count', 'created_at', 'updated_at',
        ]
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        item_totals = instance.items.aggregate(
            total_estimated=Sum('estimated_amount'),
        )
        total_est = item_totals['total_estimated'] or Decimal('0')
        from apps.transactions.models import Transaction
        total_spent = Transaction.objects.filter(
            project_item__project=instance
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        data['total_estimated'] = str(total_est.quantize(Decimal('0.01')))
        data['total_spent'] = str(total_spent.quantize(Decimal('0.01')))
        data['item_count'] = instance.items.count()
        return data


class ProjectDetailSerializer(serializers.ModelSerializer):
    items = ProjectItemSerializer(many=True, read_only=True)
    total_estimated = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True, coerce_to_string=True
    )
    total_spent = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True, coerce_to_string=True
    )
    remaining = serializers.DecimalField(
        max_digits=15, decimal_places=2, read_only=True, coerce_to_string=True
    )
    percent_complete = serializers.FloatField(read_only=True)

    class Meta:
        model = Project
        fields = [
            'id', 'user', 'name', 'description', 'status',
            'start_date', 'end_date', 'items',
            'total_estimated', 'total_spent', 'remaining', 'percent_complete',
            'created_at', 'updated_at',
        ]
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def to_representation(self, instance):
        data = super().to_representation(instance)
        item_totals = instance.items.aggregate(
            total_estimated=Sum('estimated_amount'),
        )
        total_est = item_totals['total_estimated'] or Decimal('0')
        from apps.transactions.models import Transaction
        total_spent = Transaction.objects.filter(
            project_item__project=instance
        ).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        remaining = total_est - total_spent
        percent = (total_spent / total_est * 100) if total_est > 0 else Decimal('0')
        data['total_estimated'] = str(total_est.quantize(Decimal('0.01')))
        data['total_spent'] = str(total_spent.quantize(Decimal('0.01')))
        data['remaining'] = str(remaining.quantize(Decimal('0.01')))
        data['percent_complete'] = round(float(percent), 1)
        return data
