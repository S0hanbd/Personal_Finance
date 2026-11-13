from rest_framework import serializers
from .models import Transaction, IncomeSource, ExpenseCategory, AccountTransfer


class IncomeSourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = IncomeSource
        fields = '__all__'
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')


class ExpenseCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = ExpenseCategory
        fields = '__all__'
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')


class TransactionSerializer(serializers.ModelSerializer):
    account_name = serializers.CharField(source='account.name', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    income_source_name = serializers.CharField(source='income_source.name', read_only=True)

    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be strictly positive.")
        return value


class AccountTransferSerializer(serializers.ModelSerializer):
    source_account_name = serializers.CharField(source='source_account.name', read_only=True)
    destination_account_name = serializers.CharField(source='destination_account.name', read_only=True)

    class Meta:
        model = AccountTransfer
        fields = '__all__'
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Transfer amount must be strictly positive.")
        return value

    def validate(self, attrs):
        source = attrs.get('source_account') or (self.instance and self.instance.source_account)
        dest = attrs.get('destination_account') or (self.instance and self.instance.destination_account)
        if source and dest and source == dest:
            raise serializers.ValidationError(
                {"destination_account": "Source and destination accounts must be different."}
            )
        return attrs
