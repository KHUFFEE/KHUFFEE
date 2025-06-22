from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Store
from .serializers import StoreLoginSerializer
from rest_framework import generics
from .serializers import StoreListSerializer


class StoreLoginView(APIView):
    def post(self, request):
        serializer = StoreLoginSerializer(data=request.data)

        if serializer.is_valid():
            store = serializer.validated_data  # validate에서 Store 객체를 돌려줌
            refresh = RefreshToken()  # (필요하면 for_user 사용)

            return Response(
                {
                    "매장_아이디": store.매장_아이디,
                    "매장명": store.매장명,  # ← 화면 전환용
                    "매장_id": store.매장_id,  # ← 창고(ST_102) 확인용
                    "refresh": str(refresh),
                    "access": str(refresh.access_token),
                },
                status=status.HTTP_200_OK,
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class StoreListView(generics.ListAPIView):
    queryset = Store.objects.all()
    serializer_class = StoreListSerializer
