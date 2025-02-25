from django.shortcuts import render

# Create your views here.
# management/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import TableStatus

class TableStatusListView(APIView):
    def get(self, request):
        # TableStatus의 모든 레코드에서 테이블과 상태 칼럼만 조회
        statuses = TableStatus.objects.all().values("테이블", "상태")
        return Response(list(statuses), status=status.HTTP_200_OK)

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

        # new_status를 정수로 변환 시도
        try:
            new_status_int = int(new_status)
        except ValueError:
            return Response(
                {"error": "상태 필드는 정수여야 합니다."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # 0부터 9까지의 값만 허용
        if not (0 <= new_status_int <= 9):
            return Response(
                {"error": "상태 필드는 0부터 9까지 가능합니다."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # DB 업데이트
        try:
            # get_or_create 사용 시, 테이블이 없으면 새로 생성
            obj, created = TableStatus.objects.get_or_create(테이블=table_name)
            obj.상태 = new_status_int
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

