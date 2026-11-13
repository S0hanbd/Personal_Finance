from decimal import Decimal
from rest_framework import serializers
from apps.transactions.models import ExpenseCategory
from .models import MonthlyBudget, BudgetCategory, PlannedPurchase


class BudgetCategorySerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = BudgetCategory
        fields = ['id', 'category', 'category_name', 'allocated_amount']


class BudgetCategoryInputSerializer(serializers.Serializer):
    category_id = serializers.IntegerField()
    allocated_amount = serializers.DecimalField(max_digits=15, decimal_places=2, min_value=Decimal('0.00'))


class MonthlyBudgetSerializer(serializers.ModelSerializer):
    category_allocations = BudgetCategorySerializer(many=True, read_only=True)
    allocations = BudgetCategoryInputSerializer(many=True, write_only=True, required=False)

    class Meta:
        model = MonthlyBudget
        fields = [
            'id',
            'year',
            'month',
            'total_amount',
            'notes',
            'category_allocations',
            'allocations',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_month(self, value):
        if not (1 <= value <= 12):
            raise serializers.ValidationError("Month must be between 1 and 12.")
        return value

    def create(self, validated_data):
        allocations_data = validated_data.pop('allocations', [])
        user = self.context['request'].user
        budget, created = MonthlyBudget.objects.update_or_create(
            user=user,
            year=validated_data['year'],
            month=validated_data['month'],
            defaults={
                'total_amount': validated_data['total_amount'],
                'notes': validated_data.get('notes', ''),
            }
        )

        if allocations_data:
            # Upsert or replace allocations
            existing_allocs = {a.category_id: a for a in budget.category_allocations.all()}
            updated_cat_ids = set()
            for item in allocations_data:
                cat_id = item['category_id']
                cat = ExpenseCategory.objects.get(id=cat_id, user=user)
                amt = item['allocated_amount']
                updated_cat_ids.add(cat_id)
                if cat_id in existing_allocs:
                    existing_allocs[cat_id].allocated_amount = amt
                    existing_allocs[cat_id].save(update_fields=['allocated_amount'])
                else:
                    BudgetCategory.objects.create(budget=budget, category=cat, allocated_amount=amt)

        return budget

    def update(self, instance, validated_data):
        allocations_data = validated_data.pop('allocations', None)
        instance.total_amount = validated_data.get('total_amount', instance.total_amount)
        instance.notes = validated_data.get('notes', instance.notes)
        instance.save(update_fields=['total_amount', 'notes'])

        if allocations_data is not None:
            user = self.context['request'].user
            existing_allocs = {a.category_id: a for a in instance.category_allocations.all()}
            for item in allocations_data:
                cat_id = item['category_id']
                cat = ExpenseCategory.objects.get(id=cat_id, user=user)
                amt = item['allocated_amount']
                if cat_id in existing_allocs:
                    existing_allocs[cat_id].allocated_amount = amt
                    existing_allocs[cat_id].save(update_fields=['allocated_amount'])
                else:
                    BudgetCategory.objects.create(budget=instance, category=cat, allocated_amount=amt)

        return instance


class PlannedPurchaseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    purchased_transaction_id = serializers.IntegerField(source='purchased_transaction.id', read_only=True)

    class Meta:
        model = PlannedPurchase
        fields = [
            'id',
            'name',
            'estimated_amount',
            'target_date',
            'category',
            'category_name',
            'priority',
            'status',
            'notes',
            'purchased_transaction_id',
            'purchased_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'purchased_transaction_id', 'purchased_at', 'created_at', 'updated_at']


class SettlePlannedPurchaseSerializer(serializers.Serializer):
    account_id = serializers.IntegerField(required=True)
    actual_amount = serializers.DecimalField(
        max_digits=15,
        decimal_places=2,
        min_value=Decimal('0.01'),
        required=False
    )
    payment_date = serializers.DateField(required=False)
    description = serializers.CharField(required=False, allow_blank=True)
