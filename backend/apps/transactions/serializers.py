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


class AccountTransferSerializer(serializers.ModelSerializer):
    class Meta:
        model = AccountTransfer
        fields = '__all__'
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')
