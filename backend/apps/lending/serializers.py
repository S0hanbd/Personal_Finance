
from rest_framework import serializers
from apps.accounts.models import FinancialAccount
from .models import Person, LoanRecord, LoanSettlement


class PersonSerializer(serializers.ModelSerializer):
    total_lent = serializers.DecimalField(
        max_digits=15, decimal_places=2, coerce_to_string=True, read_only=True
    )
    total_borrowed = serializers.DecimalField(
        max_digits=15, decimal_places=2, coerce_to_string=True, read_only=True
    )

    class Meta:
        model = Person
        fields = [
            'id', 'name', 'phone', 'email', 'notes',
            'total_lent', 'total_borrowed', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'total_lent', 'total_borrowed', 'created_at', 'updated_at']


class LoanRecordSerializer(serializers.ModelSerializer):
    person_name = serializers.CharField(source='person.name', read_only=True)
    initial_amount = serializers.DecimalField(
        max_digits=15, decimal_places=2, coerce_to_string=True, read_only=True
    )
    remaining_amount = serializers.DecimalField(
        max_digits=15, decimal_places=2, coerce_to_string=True, read_only=True
    )

    class Meta:
        model = LoanRecord
        fields = [
            'id', 'person', 'person_name', 'loan_type',
            'initial_amount', 'remaining_amount', 'due_date',
            'status', 'notes', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class LoanSettlementSerializer(serializers.ModelSerializer):
    amount = serializers.DecimalField(
        max_digits=15, decimal_places=2, coerce_to_string=True, read_only=True
    )
    loan_id = serializers.IntegerField(source='loan.id', read_only=True)
    person_name = serializers.CharField(source='loan.person.name', read_only=True)

    class Meta:
        model = LoanSettlement
        fields = [
            'id', 'loan_id', 'person_name', 'amount',
            'settlement_date', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']


class LendMoneySerializer(serializers.Serializer):
    person_name = serializers.CharField(max_length=100)
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    account_id = serializers.IntegerField()
    due_date = serializers.DateField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=500)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def validate_account_id(self, value):
        user = self.context['request'].user
        if not FinancialAccount.objects.filter(id=value, user=user).exists():
            raise serializers.ValidationError("Invalid account selected.")
        return value


class BorrowMoneySerializer(serializers.Serializer):
    person_name = serializers.CharField(max_length=100)
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    account_id = serializers.IntegerField()
    due_date = serializers.DateField(required=False, allow_null=True)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=500)
    phone = serializers.CharField(required=False, allow_blank=True, max_length=20)
    email = serializers.EmailField(required=False, allow_blank=True)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def validate_account_id(self, value):
        user = self.context['request'].user
        if not FinancialAccount.objects.filter(id=value, user=user).exists():
            raise serializers.ValidationError("Invalid account selected.")
        return value


class SettleLoanSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=15, decimal_places=2)
    account_id = serializers.IntegerField()
    settlement_date = serializers.DateField(required=False)
    notes = serializers.CharField(required=False, allow_blank=True, max_length=500)

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than zero.")
        return value

    def validate_account_id(self, value):
        user = self.context['request'].user
        if not FinancialAccount.objects.filter(id=value, user=user).exists():
            raise serializers.ValidationError("Invalid account selected.")
        return value
