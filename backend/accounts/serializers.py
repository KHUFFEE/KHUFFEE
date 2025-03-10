from rest_framework import serializers
from .models import Store


class StoreLoginSerializer(serializers.Serializer):
    매장명 = serializers.CharField()
    매장_비밀번호 = serializers.CharField(write_only=True)

    def validate(self, data):
        try:
            store = Store.objects.get(매장명=data["매장명"])
        except Store.DoesNotExist:
            raise serializers.ValidationError("존재하지 않는 매장입니다.")

        if store.매장_비밀번호 != data["매장_비밀번호"]:
            raise serializers.ValidationError("비밀번호가 올바르지 않습니다.")

        return store


class StoreListSerializer(serializers.ModelSerializer):
    class Meta:
        model = Store
        fields = ("매장_id", "매장명")
