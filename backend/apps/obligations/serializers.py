from rest_framework import serializers
from .models import FinancialObligation
from apps.accounts.models import FinancialAccount


class FinancialObligationSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = FinancialObligation
        fields = [
            'id',
            'name',
            'amount',
            'category',
            'category_name',
            'due_date',
            'priority',
            'description',
            'status',
            'paid_transaction',
            'paid_at',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'paid_transaction', 'paid_at', 'created_at', 'updated_at']

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value


class PayObligationSerializer(serializers.Serializer):
    account_id = serializers.IntegerField()
    payment_date = serializers.DateField(required=False)
    description = serializers.CharField(required=False, allow_blank=True, max_length=255)

    def validate_account_id(self, value):
        user = self.context['request'].user
        if not FinancialAccount.objects.filter(id=value, user=user).exists():
            raise serializers.ValidationError("Invalid account selected.")
        return value
