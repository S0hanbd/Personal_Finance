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
    project_item = serializers.IntegerField(required=False, allow_null=True, write_only=True)
    project_item_name = serializers.CharField(
        source='project_item.name', read_only=True, default=None
    )

    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ('id', 'user', 'created_at', 'updated_at')

    def validate_amount(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be strictly positive.")
        return value

    def validate_project_item(self, value):
        if value is not None:
            from apps.projects.models import ProjectItem
            try:
                item = ProjectItem.objects.get(id=value)
            except ProjectItem.DoesNotExist:
                raise serializers.ValidationError("Invalid project item.")
            if self.context.get('request'):
                user = self.context['request'].user
                if item.project.user != user:
                    raise serializers.ValidationError(
                        "This project item does not belong to your projects."
                    )
            return item
        return None


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
