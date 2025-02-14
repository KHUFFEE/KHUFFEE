from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .serializers import StoreOrderCreateSerializer

class StoreOrderCreateView(APIView):
    def post(self, request):
        serializer = StoreOrderCreateSerializer(data=request.data)
        if serializer.is_valid():
            store_order = serializer.save()
            return Response(StoreOrderCreateSerializer(store_order).data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
