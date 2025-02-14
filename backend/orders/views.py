from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework import generics
from .serializers import StoreOrderCreateSerializer
from .models import StoreOrder
from .serializers import StoreOrderListSerializer


class StoreOrderCreateView(APIView):
    def post(self, request):
        serializer = StoreOrderCreateSerializer(data=request.data)
        if serializer.is_valid():
            store_order = serializer.save()
            return Response(StoreOrderCreateSerializer(store_order).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class StoreOrderListView(APIView):
    def get(self, request):
        # .values()를 사용하여 id를 제외한 필요한 필드만 조회합니다.
        orders = list(
            StoreOrder.objects.values(
                '매장_id',  # 이 값은 외래키의 pk (Store 모델의 매장_id)로 반환됩니다.
                '품목_id',  # 이 값은 Item 모델의 품목_id로 반환됩니다.
                '기간',
                '매장_발주량'
            )
        )
        return Response(orders, status=status.HTTP_200_OK)
