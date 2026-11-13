from rest_framework import serializers
from .models import FinancialAccount


class FinancialAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = FinancialAccount
        fields = '__all__'
        read_only_fields = ('id', 'user', 'current_balance', 'created_at', 'updated_at')
