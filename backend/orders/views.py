from django.shortcuts import render
from rest_framework.response import Response
from rest_framework import status, generics
from rest_framework.decorators import api_view
from .models import Store, User
from .serializers import StoreSerializer, UserSerializer

# ✅ 모든 매장 조회 & 매장 추가
@api_view(['GET', 'POST'])
def store_list(request):
    if request.method == 'GET':
        stores = Store.objects.all()
        serializer = StoreSerializer(stores, many=True)
        return Response(serializer.data)

    elif request.method == 'POST':
        serializer = StoreSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# ✅ 특정 매장 조회, 수정, 삭제
@api_view(['GET', 'PUT', 'DELETE'])
def store_detail(request, store_id):
    try:
        store = Store.objects.get(store_id=store_id)
    except Store.DoesNotExist:
        return Response({'error': 'Store not found'}, status=status.HTTP_404_NOT_FOUND)

    if request.method == 'GET':
        serializer = StoreSerializer(store)
        return Response(serializer.data)

    elif request.method == 'PUT':
        serializer = StoreSerializer(store, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    elif request.method == 'DELETE':
        store.delete()
        return Response({'message': 'Store deleted successfully'}, status=status.HTTP_204_NO_CONTENT)

# ✅ 로그인 API
@api_view(['POST'])
def store_login(request):
    store_id = request.data.get('store_id')
    store_pw = request.data.get('store_pw')

    try:
        user = User.objects.get(store_id=store_id)
    except User.DoesNotExist:
        return Response({'error': 'Store not found'}, status=status.HTTP_404_NOT_FOUND)

    if user.store_pw == store_pw:
        return Response({'message': 'Login successful'}, status=status.HTTP_200_OK)
    else:
        return Response({'error': 'Invalid password'}, status=status.HTTP_401_UNAUTHORIZED)

