from django.shortcuts import render

# Create your views here.
# management/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import TableStatus

class TableStatusUpdateView(APIView):
    def post(self, request):
        table_name = request.data.get('테이블')
        new_status = request.data.get('상태')

        # 필수 필드 확인
        if table_name is None or new_status is None:
            return Response(
                {"error": "테이블, 상태 필드는 필수입니다."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 0 또는 1이 아닌 값이 들어온다면 예외 처리
        if not (str(new_status) in ["0", "1"]):
            return Response(
                {"error": "상태 필드는 0 또는 1만 가능합니다."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # DB 업데이트
        try:
            # get_or_create 사용 시, 테이블이 없으면 새로 생성
            obj, created = TableStatus.objects.get_or_create(테이블=table_name)
            obj.상태 = new_status
            obj.save()

            return Response({
                "테이블": obj.테이블,
                "상태": obj.상태
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
