from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Store
from .serializers import StoreLoginSerializer

class StoreLoginView(APIView):
    def post(self, request):
        serializer = StoreLoginSerializer(data=request.data)

        if serializer.is_valid():
            store = serializer.validated_data  # 검증된 store 객체
            refresh = RefreshToken()  # 직접 JWT 생성

            return Response({
                '매장명': store.매장명,  # 아이디로 사용됨
                'refresh': str(refresh),
                'access': str(refresh.access_token),
            }, status=status.HTTP_200_OK)

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
