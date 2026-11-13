from rest_framework import serializers
from .models import RecurringExpense, RecurringExpenseOccurrence
from apps.accounts.models import FinancialAccount


class RecurringExpenseSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    preferred_account_name = serializers.CharField(source='preferred_account.name', read_only=True)

    class Meta:
        model = RecurringExpense
        fields = [
            'id',
            'name',
            'category',
            'category_name',
            'amount',
            'frequency',
            'start_date',
            'due_day',
            'preferred_account',
            'preferred_account_name',
            'description',
            'status',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def validate_due_day(self, value):
        if not (1 <= value <= 31):
            raise serializers.ValidationError("Due day must be between 1 and 31.")
        return value


class RecurringExpenseOccurrenceSerializer(serializers.ModelSerializer):
    bill_name = serializers.CharField(source='recurring_expense.name', read_only=True)
    category_name = serializers.CharField(source='recurring_expense.category.name', read_only=True)
    preferred_account_id = serializers.IntegerField(source='recurring_expense.preferred_account_id', read_only=True)
    preferred_account_name = serializers.CharField(source='recurring_expense.preferred_account.name', read_only=True)

    class Meta:
        model = RecurringExpenseOccurrence
        fields = [
            'id',
            'recurring_expense',
            'bill_name',
            'category_name',
            'preferred_account_id',
            'preferred_account_name',
            'period',
            'due_date',
            'amount',
            'status',
            'paid_transaction',
            'paid_at',
            'created_at',
        ]
        read_only_fields = ['id', 'paid_transaction', 'paid_at', 'created_at']


class PayBillOccurrenceSerializer(serializers.Serializer):
    account_id = serializers.IntegerField()
    payment_date = serializers.DateField(required=False)
    description = serializers.CharField(required=False, allow_blank=True, max_length=255)

    def validate_account_id(self, value):
        user = self.context['request'].user
        if not FinancialAccount.objects.filter(id=value, user=user).exists():
            raise serializers.ValidationError("Invalid account selected.")
        return value
